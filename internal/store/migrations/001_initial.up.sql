-- GateHouse Spec Reviewer: initial schema
-- Follows DDL_Rules.md conventions (CHECK constraints, named constraints,
-- NOT NULL audit columns, VARCHAR bounds, updated_at triggers, comments).

-- =============================================================================
-- Shared trigger function for automatic updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Users
-- =============================================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email       VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url  TEXT,

    -- Role
    role        VARCHAR(50) NOT NULL DEFAULT 'viewer'
        CONSTRAINT chk_users_role CHECK (role IN ('admin', 'editor', 'reviewer', 'viewer')),

    -- Password (bcrypt hash, nullable for external auth users)
    password_hash VARCHAR(255),

    -- Status
    is_active   BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_role ON users (role) WHERE is_active = true;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users IS 'User accounts for the Spec Reviewer.';
COMMENT ON COLUMN users.role IS 'Global role: admin (full access), editor (create/edit specs), reviewer (annotate/approve), viewer (read-only)';

-- =============================================================================
-- Sessions
-- =============================================================================
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sessions_token UNIQUE (token)
);

CREATE INDEX idx_sessions_token ON sessions (token);
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

COMMENT ON TABLE sessions IS 'Server-side session tokens for cookie-based auth. Expired rows cleaned periodically.';

-- =============================================================================
-- Specs (one per app)
-- =============================================================================
CREATE TABLE specs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core
    app_name     VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description  TEXT,

    -- Ownership
    owner_id     UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Audit
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_specs_app_name UNIQUE (app_name)
);

CREATE INDEX idx_specs_owner_id ON specs (owner_id);

CREATE TRIGGER trg_specs_updated_at
    BEFORE UPDATE ON specs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE specs IS 'Spec projects. Each represents one GateHouse application spec.';

-- =============================================================================
-- Spec versions (immutable snapshots)
-- =============================================================================
CREATE TABLE spec_versions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent spec
    spec_id        UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,

    -- Version info
    version        VARCHAR(50) NOT NULL,
    spec_data      JSONB NOT NULL
        CONSTRAINT chk_spec_versions_spec_data_object CHECK (jsonb_typeof(spec_data) = 'object'),
    change_summary TEXT,

    -- Status workflow: draft → in_review → approved | archived
    status         VARCHAR(50) NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_spec_versions_status CHECK (status IN (
            'draft', 'in_review', 'approved', 'archived'
        )),

    -- Lineage
    parent_id      UUID REFERENCES spec_versions(id) ON DELETE SET NULL,

    -- Audit
    created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_spec_versions_spec_version UNIQUE (spec_id, version)
);

CREATE INDEX idx_spec_versions_spec_id ON spec_versions (spec_id, created_at DESC);
CREATE INDEX idx_spec_versions_status ON spec_versions (status);
CREATE INDEX idx_spec_versions_created_by ON spec_versions (created_by);

COMMENT ON TABLE spec_versions IS 'Immutable spec snapshots. Status transitions: draft → in_review → approved/archived.';
COMMENT ON COLUMN spec_versions.spec_data IS 'Full AppSpec stored as JSON. Must be a JSON object.';
COMMENT ON COLUMN spec_versions.parent_id IS 'Previous version in the lineage chain. NULL for first version.';

-- =============================================================================
-- Annotations on spec elements
-- =============================================================================
CREATE TABLE annotations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    version_id   UUID NOT NULL REFERENCES spec_versions(id) ON DELETE CASCADE,
    element_path VARCHAR(500) NOT NULL,
    element_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_annotations_element_type CHECK (element_type IN (
            'entity', 'field', 'transition', 'permission', 'nav_item',
            'page', 'view', 'filter', 'widget', 'role', 'general'
        )),

    -- Content
    body         TEXT NOT NULL,

    -- State
    state        VARCHAR(20) NOT NULL DEFAULT 'open'
        CONSTRAINT chk_annotations_state CHECK (state IN ('open', 'resolved', 'blocking')),

    -- Author
    author_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Threading
    parent_id    UUID REFERENCES annotations(id) ON DELETE CASCADE,

    -- Audit
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Resolution
    resolved_at  TIMESTAMPTZ,
    resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Resolution consistency: both set or both null
    CONSTRAINT chk_annotations_resolution_complete CHECK (
        (resolved_at IS NULL AND resolved_by IS NULL) OR
        (resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
    )
);

CREATE INDEX idx_annotations_version_id ON annotations (version_id);
CREATE INDEX idx_annotations_element_path ON annotations (element_path);
CREATE INDEX idx_annotations_author_id ON annotations (author_id);
CREATE INDEX idx_annotations_state ON annotations (version_id, state)
    WHERE state != 'resolved';

COMMENT ON TABLE annotations IS 'Inline feedback on spec elements. States: open (comment), blocking (must resolve before approval), resolved.';
COMMENT ON COLUMN annotations.element_path IS 'Dot-separated path to the spec element, e.g. "Subcontractor.insurance_expiry_date"';

-- =============================================================================
-- Approvals
-- =============================================================================
CREATE TABLE approvals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    version_id  UUID NOT NULL REFERENCES spec_versions(id) ON DELETE CASCADE,

    -- Reviewer
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Decision
    decision    VARCHAR(20) NOT NULL
        CONSTRAINT chk_approvals_decision CHECK (decision IN (
            'approved', 'rejected', 'needs_changes'
        )),
    notes       TEXT,

    -- Audit
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One decision per reviewer per version
    CONSTRAINT uq_approvals_version_reviewer UNIQUE (version_id, reviewer_id)
);

CREATE INDEX idx_approvals_version_id ON approvals (version_id);
CREATE INDEX idx_approvals_reviewer_id ON approvals (reviewer_id);

COMMENT ON TABLE approvals IS 'Approval decisions on spec versions. One per reviewer per version (upsert on re-review).';

-- =============================================================================
-- Audit log (immutable, append-only)
-- =============================================================================
CREATE TABLE audit_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,

    -- What
    action        VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id   UUID NOT NULL,

    -- Context
    metadata      JSONB DEFAULT '{}'
        CONSTRAINT chk_audit_log_metadata_object CHECK (
            metadata IS NULL OR jsonb_typeof(metadata) = 'object'
        ),
    ip_address    VARCHAR(45),

    -- When (append-only, no updated_at)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_resource ON audit_log (resource_type, resource_id);
CREATE INDEX idx_audit_log_user_id ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_created_at ON audit_log USING BRIN (created_at)
    WITH (pages_per_range = 128);

COMMENT ON TABLE audit_log IS 'Immutable audit trail. Append-only — no UPDATE or DELETE in application code.';
COMMENT ON COLUMN audit_log.action IS 'Action identifier, e.g. spec.create, version.status_change, annotation.create, approval.submit';

-- =============================================================================
-- Spec-level role assignments
-- =============================================================================
CREATE TABLE spec_permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    spec_id     UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Permission
    permission  VARCHAR(50) NOT NULL
        CONSTRAINT chk_spec_permissions_permission CHECK (permission IN (
            'owner', 'editor', 'reviewer', 'viewer'
        )),

    -- Granted by
    granted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One permission per user per spec
    CONSTRAINT uq_spec_permissions_spec_user UNIQUE (spec_id, user_id)
);

CREATE INDEX idx_spec_permissions_spec_id ON spec_permissions (spec_id);
CREATE INDEX idx_spec_permissions_user_id ON spec_permissions (user_id);

COMMENT ON TABLE spec_permissions IS 'Per-spec role assignments. Supplements the global user role for fine-grained access.';

-- =============================================================================
-- Seed data: default users for development/testing
-- =============================================================================
-- bcrypt hash of "password" at cost 10 (dev/seed only)
INSERT INTO users (email, display_name, role, password_hash) VALUES
    ('admin@gatehouse.local',    'Admin User',      'admin',    '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('editor@gatehouse.local',   'Editor User',     'editor',   '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('reviewer@gatehouse.local', 'Reviewer User',   'reviewer', '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('viewer@gatehouse.local',   'Viewer User',     'viewer',   '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('alice@example.com',        'Alice Johnson',   'admin',    '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('bob@example.com',          'Bob Smith',       'editor',   '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u'),
    ('carol@example.com',        'Carol Williams',  'reviewer', '$2a$10$.HFTBA8uMUAz0M2Zg8ZUjuszVFibTT6OkIWWqigcytNWL4XNTxM1u')
ON CONFLICT (email) DO NOTHING;
