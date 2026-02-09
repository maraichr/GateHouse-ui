# GateHouse PostgreSQL DDL Guidelines

A comprehensive guide for writing DDL that integrates seamlessly with the GateHouse code generation pipeline.

---

## Table of Contents

1. [Naming Conventions](#1-naming-conventions)
2. [Schema Organization](#2-schema-organization)
3. [Primary Keys](#3-primary-keys)
4. [Audit Columns](#4-audit-columns)
5. [Soft Delete](#5-soft-delete)
6. [Foreign Keys](#6-foreign-keys)
7. [Enums](#7-enums)
8. [JSONB Columns](#8-jsonb-columns)
9. [Indexes](#9-indexes)
10. [Constraints](#10-constraints)
11. [Comments & Documentation](#11-comments--documentation)
12. [Complete Examples](#12-complete-examples)

---

## 1. Naming Conventions

### General Rules

| Element | Convention | Example |
|---------|------------|---------|
| Schemas | `snake_case`, noun + `_service` | `domain_service`, `auth_service` |
| Tables | `snake_case`, plural nouns | `users`, `reference_items` |
| Columns | `snake_case`, descriptive | `created_at`, `is_active` |
| Primary Keys | `id` | `id` |
| Foreign Keys | `{referenced_table_singular}_id` | `domain_id`, `user_id` |
| Junction Tables | `{table1}_{table2}` alphabetical | `roles_users`, `domains_tags` |
| Indexes | `idx_{table}_{columns}` | `idx_users_email` |
| Unique Constraints | `uq_{table}_{columns}` | `uq_domains_name_parent` |
| Check Constraints | `chk_{table}_{description}` | `chk_items_status_valid` |
| Foreign Key Constraints | `fk_{table}_{referenced}` | `fk_items_domain` |

### Column Naming Patterns

```sql
-- Boolean columns: use is_, has_, can_, should_ prefixes
is_active BOOLEAN NOT NULL DEFAULT true,
has_children BOOLEAN NOT NULL DEFAULT false,
can_approve BOOLEAN NOT NULL DEFAULT false,
should_notify BOOLEAN NOT NULL DEFAULT true,

-- Timestamps: use _at suffix
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMP WITH TIME ZONE,
expires_at TIMESTAMP WITH TIME ZONE,
effective_at TIMESTAMP WITH TIME ZONE,

-- Counts/quantities: use _count suffix
retry_count INTEGER NOT NULL DEFAULT 0,
approval_count INTEGER NOT NULL DEFAULT 0,

-- User references: use _by suffix for actors, _id for relations
created_by UUID NOT NULL,      -- Actor who created
approved_by UUID,              -- Actor who approved
owner_id UUID,                 -- Relation to owner (not an action)
assignee_id UUID,              -- Relation to assignee

-- Status/state: use status or state
status VARCHAR(50) NOT NULL DEFAULT 'draft',
workflow_state VARCHAR(50) NOT NULL DEFAULT 'pending',

-- Configuration/settings: use _config or _settings suffix
schema_config JSONB NOT NULL DEFAULT '{}',
notification_settings JSONB NOT NULL DEFAULT '{}',

-- Metadata: use _metadata suffix
request_metadata JSONB,
sync_metadata JSONB,
```

### Reserved Column Names

These columns have special meaning in GateHouse:

```sql
-- Always reserved
id                  -- Primary key
created_at          -- Audit: creation timestamp
created_by          -- Audit: creator user ID
updated_at          -- Audit: last update timestamp
updated_by          -- Audit: last updater user ID
deleted_at          -- Soft delete timestamp
deleted_by          -- Soft delete actor (alternative: deleted_by_id)
version             -- Optimistic locking
tenant_id           -- Multi-tenancy isolation
```

---

## 2. Schema Organization

### One Schema = One Microservice

```sql
-- Create schemas for service boundaries
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS domain_service;
CREATE SCHEMA IF NOT EXISTS reference_service;
CREATE SCHEMA IF NOT EXISTS workflow_service;
CREATE SCHEMA IF NOT EXISTS shared;  -- Cross-cutting concerns

-- Set search path for the migration
SET search_path TO domain_service, public;
```

### Schema Naming Guidelines

```sql
-- Pattern: {bounded_context}_service
auth_service        -- Authentication & users
domain_service      -- Domain management
reference_service   -- Reference data items
workflow_service    -- Approval workflows
notification_service -- Notifications & alerts
audit_service       -- Audit logging
integration_service -- External integrations

-- Shared schema for cross-cutting tables
shared              -- audit_log, notifications, etc.
```

### Cross-Schema References

```sql
-- Foreign keys CAN reference other schemas
-- This creates service dependencies - use sparingly

CREATE TABLE domain_service.domains (
    id UUID PRIMARY KEY,
    -- References auth_service (acceptable: core dependency)
    created_by UUID NOT NULL REFERENCES auth_service.users(id),
    -- ...
);

-- Prefer: Copy user_id and validate at application layer
-- for loose coupling between services
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY,
    created_by UUID NOT NULL,  -- No FK, validated via SpiceDB
    -- ...
);
```

---

## 3. Primary Keys

### Always Use UUIDs

```sql
-- Standard pattern: UUID with auto-generation
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ...
);

-- For high-insert tables, consider UUIDv7 for sortability
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    -- ...
);
```

### Composite Primary Keys (Junction Tables Only)

```sql
-- Junction table for many-to-many
CREATE TABLE domain_service.domain_permissions (
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    granted_by UUID NOT NULL REFERENCES auth_service.users(id),

    PRIMARY KEY (domain_id, user_id)
);

-- Alternative: Surrogate key + unique constraint (preferred for GateHouse)
CREATE TABLE domain_service.domain_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    granted_by UUID NOT NULL REFERENCES auth_service.users(id),

    CONSTRAINT uq_domain_permissions_domain_user UNIQUE (domain_id, user_id)
);
```

---

## 4. Audit Columns

### Standard Audit Column Set

```sql
-- Minimal audit (required)
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

-- Full audit (recommended)
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
created_by UUID NOT NULL REFERENCES auth_service.users(id),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_by UUID NOT NULL REFERENCES auth_service.users(id),

-- With soft delete
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
created_by UUID NOT NULL REFERENCES auth_service.users(id),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_by UUID NOT NULL REFERENCES auth_service.users(id),
deleted_at TIMESTAMP WITH TIME ZONE,
deleted_by UUID REFERENCES auth_service.users(id),
```

### Automatic Timestamp Updates

```sql
-- Create the trigger function once per database
CREATE OR REPLACE FUNCTION shared.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table
CREATE TRIGGER trg_domains_updated_at
    BEFORE UPDATE ON domain_service.domains
    FOR EACH ROW
    EXECUTE FUNCTION shared.set_updated_at();
```

### Optimistic Locking

```sql
-- Add version column for optimistic locking
version INTEGER NOT NULL DEFAULT 1,

-- Trigger to auto-increment
CREATE OR REPLACE FUNCTION shared.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_domains_version
    BEFORE UPDATE ON domain_service.domains
    FOR EACH ROW
    EXECUTE FUNCTION shared.increment_version();
```

---

## 5. Soft Delete

### Standard Pattern

```sql
CREATE TABLE domain_service.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    -- ... other columns ...

    -- Soft delete columns
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth_service.users(id),

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth_service.users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES auth_service.users(id)
);

-- Partial index for active records (most queries)
CREATE INDEX idx_domains_active ON domain_service.domains (name)
    WHERE deleted_at IS NULL;

-- Index for finding deleted records (admin queries)
CREATE INDEX idx_domains_deleted ON domain_service.domains (deleted_at)
    WHERE deleted_at IS NOT NULL;
```

### Unique Constraints with Soft Delete

```sql
-- Problem: Unique constraint blocks re-creation after soft delete
-- Solution: Partial unique index excluding deleted records

-- DON'T DO THIS:
-- CONSTRAINT uq_domains_name UNIQUE (name)

-- DO THIS:
CREATE UNIQUE INDEX uq_domains_name_active
    ON domain_service.domains (name)
    WHERE deleted_at IS NULL;

-- For composite uniqueness:
CREATE UNIQUE INDEX uq_domains_name_parent_active
    ON domain_service.domains (name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'))
    WHERE deleted_at IS NULL;
```

### Cascading Soft Deletes

```sql
-- For hierarchical data, consider a trigger for cascading soft deletes
CREATE OR REPLACE FUNCTION domain_service.cascade_soft_delete_domains()
RETURNS TRIGGER AS $$
BEGIN
    -- Soft delete all children when parent is soft deleted
    UPDATE domain_service.domains
    SET deleted_at = NEW.deleted_at,
        deleted_by = NEW.deleted_by
    WHERE parent_id = NEW.id
      AND deleted_at IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_domains_cascade_soft_delete
    AFTER UPDATE OF deleted_at ON domain_service.domains
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION domain_service.cascade_soft_delete_domains();
```

---

## 6. Foreign Keys

### Referential Actions

```sql
-- ON DELETE options and when to use them:

-- CASCADE: Child is deleted with parent
-- Use for: Compositions, owned entities, junction tables
domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,

-- SET NULL: Child remains, reference cleared
-- Use for: Optional associations, reassignable items
parent_id UUID REFERENCES domains(id) ON DELETE SET NULL,

-- RESTRICT (default): Prevent deletion if children exist
-- Use for: Important references that shouldn't be orphaned
category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

-- NO ACTION: Like RESTRICT but checked at end of transaction
-- Use for: Deferred constraint checking
owner_id UUID REFERENCES users(id) ON DELETE NO ACTION DEFERRABLE,
```

### Self-Referential Foreign Keys

```sql
-- Hierarchical/tree structures
CREATE TABLE domain_service.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES domain_service.domains(id) ON DELETE SET NULL,

    -- Materialized path for efficient tree queries (optional)
    path LTREE,  -- Requires: CREATE EXTENSION IF NOT EXISTS ltree;
    depth INTEGER GENERATED ALWAYS AS (nlevel(path)) STORED,

    -- ...
);

-- Prevent circular references with a trigger
CREATE OR REPLACE FUNCTION domain_service.check_domain_cycle()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        -- Check if new parent is a descendant of this domain
        IF EXISTS (
            WITH RECURSIVE ancestors AS (
                SELECT id, parent_id FROM domain_service.domains WHERE id = NEW.parent_id
                UNION ALL
                SELECT d.id, d.parent_id
                FROM domain_service.domains d
                JOIN ancestors a ON d.id = a.parent_id
            )
            SELECT 1 FROM ancestors WHERE id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Circular reference detected in domain hierarchy';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_domains_check_cycle
    BEFORE INSERT OR UPDATE OF parent_id ON domain_service.domains
    FOR EACH ROW
    EXECUTE FUNCTION domain_service.check_domain_cycle();
```

### Cross-Schema Foreign Keys

```sql
-- Explicit schema qualification
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cross-schema reference (creates tight coupling)
    domain_id UUID NOT NULL
        REFERENCES domain_service.domains(id)
        ON DELETE RESTRICT,

    -- Same-schema reference
    category_id UUID
        REFERENCES reference_service.categories(id)
        ON DELETE SET NULL,

    -- Loose coupling alternative: store ID without FK
    -- Validate via application/SpiceDB
    created_by UUID NOT NULL,  -- References auth_service.users but no FK

    -- ...
);
```

---

## 7. Enums

### Strategy Comparison

| Approach | Pros | Cons |
|----------|------|------|
| Native ENUM | Type safety, compact storage | Hard to modify, no ordering |
| CHECK constraint | Easy to modify, clear in DDL | No reuse, repeated definition |
| Lookup table | Full flexibility, metadata | Join overhead, more complexity |

### Recommended: CHECK Constraints for Simple Enums

```sql
-- Simple status enum via CHECK constraint
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Enum via CHECK - GateHouse parses this
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_items_status CHECK (status IN (
            'draft',
            'pending_approval',
            'approved',
            'rejected',
            'archived'
        )),

    -- Sensitivity level enum
    sensitivity_level VARCHAR(20) NOT NULL DEFAULT 'normal'
        CONSTRAINT chk_items_sensitivity CHECK (sensitivity_level IN (
            'normal',
            'sensitive',
            'critical'
        )),

    -- ...
);
```

### Native ENUM for Stable, Widely-Used Types

```sql
-- Create in shared schema for reuse
CREATE TYPE shared.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);

-- Use in tables
CREATE TABLE workflow_service.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status shared.approval_status NOT NULL DEFAULT 'pending',
    -- ...
);

-- Adding values (PostgreSQL 10+)
ALTER TYPE shared.approval_status ADD VALUE 'expired' AFTER 'cancelled';

-- NOTE: You cannot remove or rename enum values without recreating the type
```

### Lookup Tables for Complex Enums

```sql
-- When enum needs metadata, descriptions, or frequent changes
CREATE TABLE reference_service.item_statuses (
    code VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_terminal BOOLEAN NOT NULL DEFAULT false,  -- Can't transition from
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO reference_service.item_statuses (code, display_name, sort_order, is_terminal) VALUES
    ('draft', 'Draft', 10, false),
    ('pending_approval', 'Pending Approval', 20, false),
    ('approved', 'Approved', 30, false),
    ('rejected', 'Rejected', 40, true),
    ('archived', 'Archived', 50, true);

-- Reference via FK
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        REFERENCES reference_service.item_statuses(code),
    -- ...
);
```

---

## 8. JSONB Columns

### When to Use JSONB

**Good use cases:**
- Schema-less/dynamic attributes
- User preferences/settings
- API request/response logging
- Metadata that varies by record
- Nested structures that don't need relational queries

**Avoid JSONB for:**
- Data that needs foreign keys
- Frequently queried/filtered fields
- Data with strict schema requirements
- Large text fields (use TEXT instead)

### Basic Patterns

```sql
CREATE TABLE domain_service.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,

    -- Dynamic schema configuration
    schema_config JSONB NOT NULL DEFAULT '{}'
        CONSTRAINT chk_domains_schema_config_object
        CHECK (jsonb_typeof(schema_config) = 'object'),

    -- Flexible metadata
    metadata JSONB DEFAULT '{}'
        CONSTRAINT chk_domains_metadata_object
        CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),

    -- Array of tags
    tags JSONB NOT NULL DEFAULT '[]'
        CONSTRAINT chk_domains_tags_array
        CHECK (jsonb_typeof(tags) = 'array'),

    -- ...
);
```

### JSONB with Schema Validation

```sql
-- Validate JSONB structure with CHECK constraints
CREATE TABLE workflow_service.approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domain_service.domains(id),

    -- Approval chain must be array of objects with required fields
    approval_chain JSONB NOT NULL DEFAULT '[]'
        CONSTRAINT chk_approval_chain_valid CHECK (
            jsonb_typeof(approval_chain) = 'array'
            AND (
                jsonb_array_length(approval_chain) = 0
                OR (
                    -- Each element must have approver_id and role
                    SELECT bool_and(
                        elem ? 'approver_id'
                        AND elem ? 'role'
                        AND (elem->>'approver_id') IS NOT NULL
                    )
                    FROM jsonb_array_elements(approval_chain) AS elem
                )
            )
        ),

    -- ...
);

-- Example valid data:
-- [
--   {"approver_id": "uuid-1", "role": "manager", "required": true},
--   {"approver_id": "uuid-2", "role": "director", "required": false}
-- ]
```

### Indexing JSONB

```sql
-- GIN index for containment queries (@>, ?, ?|, ?&)
CREATE INDEX idx_domains_metadata_gin
    ON domain_service.domains USING GIN (metadata);

-- Query: Find domains with specific metadata
-- SELECT * FROM domains WHERE metadata @> '{"category": "finance"}';

-- GIN index for specific path (more efficient for known paths)
CREATE INDEX idx_domains_metadata_category
    ON domain_service.domains USING GIN ((metadata->'category'));

-- B-tree index for specific extracted value (equality/range)
CREATE INDEX idx_items_metadata_priority
    ON reference_service.items ((metadata->>'priority'));

-- Query: Find high priority items
-- SELECT * FROM items WHERE metadata->>'priority' = 'high';

-- Partial GIN index (when most rows don't have the key)
CREATE INDEX idx_items_metadata_special
    ON reference_service.items USING GIN (metadata)
    WHERE metadata ? 'special_handling';
```

### Generated Columns from JSONB

```sql
-- Extract frequently-accessed JSONB fields as generated columns
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attributes JSONB NOT NULL DEFAULT '{}',

    -- Generated columns for common queries
    priority VARCHAR(20) GENERATED ALWAYS AS (attributes->>'priority') STORED,
    category VARCHAR(100) GENERATED ALWAYS AS (attributes->>'category') STORED,

    -- ...
);

-- Now you can index and query the generated columns directly
CREATE INDEX idx_items_priority ON reference_service.items (priority);
CREATE INDEX idx_items_category ON reference_service.items (category);
```

---

## 9. Indexes

### Index Naming Convention

```sql
-- Pattern: {prefix}_{table}_{columns}_{suffix}
-- Prefixes: idx (index), uq (unique), pk (primary key)
-- Suffixes: _partial, _gin, _gist, _brin

idx_users_email              -- Simple B-tree
idx_users_name_lower         -- Expression index
uq_domains_name_active       -- Unique partial index
idx_items_metadata_gin       -- GIN index
idx_audit_log_created_brin   -- BRIN index for time-series
```

### Essential Indexes

```sql
-- Foreign keys (PostgreSQL doesn't auto-index these!)
CREATE INDEX idx_items_domain_id ON reference_service.items (domain_id);
CREATE INDEX idx_items_created_by ON reference_service.items (created_by);
CREATE INDEX idx_items_category_id ON reference_service.items (category_id);

-- Soft delete (partial index for active records)
CREATE INDEX idx_items_active ON reference_service.items (domain_id, status)
    WHERE deleted_at IS NULL;

-- Frequent filter columns
CREATE INDEX idx_items_status ON reference_service.items (status);
CREATE INDEX idx_items_effective_date ON reference_service.items (effective_date);

-- Sorting columns
CREATE INDEX idx_items_created_at ON reference_service.items (created_at DESC);

-- Composite for common query patterns
CREATE INDEX idx_items_domain_status_created
    ON reference_service.items (domain_id, status, created_at DESC)
    WHERE deleted_at IS NULL;
```

### Text Search Indexes

```sql
-- Trigram index for LIKE '%pattern%' queries
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_items_name_trgm
    ON reference_service.items USING GIN (name gin_trgm_ops);

-- Full-text search
CREATE INDEX idx_items_fts
    ON reference_service.items USING GIN (
        to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    );
```

### Time-Series Indexes (BRIN)

```sql
-- BRIN indexes are small and efficient for naturally ordered data
CREATE INDEX idx_audit_log_timestamp_brin
    ON shared.audit_log USING BRIN (created_at)
    WITH (pages_per_range = 128);

-- Good for: audit logs, events, time-series data
-- Bad for: randomly ordered data, small tables
```

---

## 10. Constraints

### NOT NULL Strategy

```sql
-- Be explicit about nullability
CREATE TABLE reference_service.items (
    -- Always NOT NULL
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL,

    -- Explicitly nullable (optional fields)
    description TEXT,                              -- NULL = no description
    parent_id UUID,                                -- NULL = root item
    approved_at TIMESTAMP WITH TIME ZONE,          -- NULL = not yet approved
    approved_by UUID,                              -- NULL = not yet approved
    deleted_at TIMESTAMP WITH TIME ZONE,           -- NULL = not deleted

    -- With defaults (NOT NULL + DEFAULT)
    is_active BOOLEAN NOT NULL DEFAULT true,
    retry_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
);
```

### CHECK Constraints

```sql
CREATE TABLE reference_service.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Enum validation
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_items_status CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),

    -- Range validation
    priority INTEGER NOT NULL DEFAULT 0
        CONSTRAINT chk_items_priority_range CHECK (priority BETWEEN 0 AND 100),

    -- String length
    code VARCHAR(50) NOT NULL
        CONSTRAINT chk_items_code_length CHECK (char_length(code) >= 2),

    -- Pattern matching
    code VARCHAR(50) NOT NULL
        CONSTRAINT chk_items_code_format CHECK (code ~ '^[A-Z][A-Z0-9_-]*$'),

    -- Date logic
    effective_date DATE,
    expiry_date DATE,
    CONSTRAINT chk_items_date_range CHECK (expiry_date IS NULL OR expiry_date > effective_date),

    -- Cross-column validation
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    CONSTRAINT chk_items_approval_complete CHECK (
        (approved_at IS NULL AND approved_by IS NULL) OR
        (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),

    -- JSONB structure
    config JSONB NOT NULL DEFAULT '{}'
        CONSTRAINT chk_items_config_object CHECK (jsonb_typeof(config) = 'object'),
);
```

### Unique Constraints

```sql
-- Simple unique
CONSTRAINT uq_users_email UNIQUE (email),

-- Composite unique
CONSTRAINT uq_items_domain_code UNIQUE (domain_id, code),

-- Unique with soft delete (use partial index instead)
-- DON'T: CONSTRAINT uq_domains_name UNIQUE (name)
-- DO:
CREATE UNIQUE INDEX uq_domains_name_active
    ON domains (name)
    WHERE deleted_at IS NULL;

-- Case-insensitive unique
CREATE UNIQUE INDEX uq_users_email_lower
    ON auth_service.users (LOWER(email));

-- Unique with nulls treated as equal
CREATE UNIQUE INDEX uq_items_external_id
    ON items (COALESCE(external_id, ''))
    WHERE external_id IS NOT NULL;
```

### Exclusion Constraints

```sql
-- Prevent overlapping date ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE reference_service.item_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id),
    effective_from DATE NOT NULL,
    effective_to DATE,

    -- No overlapping versions for same item
    CONSTRAINT excl_item_versions_no_overlap
        EXCLUDE USING GIST (
            item_id WITH =,
            daterange(effective_from, effective_to, '[)') WITH &&
        )
);
```

---

## 11. Comments & Documentation

### Table and Column Comments

```sql
-- Table comment
COMMENT ON TABLE domain_service.domains IS
    'Hierarchical domain structure for organizing reference data. Supports up to 5 levels of nesting.';

-- Column comments
COMMENT ON COLUMN domain_service.domains.id IS
    'Primary key - UUID v4';
COMMENT ON COLUMN domain_service.domains.parent_id IS
    'Parent domain for hierarchy. NULL indicates root domain.';
COMMENT ON COLUMN domain_service.domains.schema_config IS
    'JSON Schema configuration for validating reference items in this domain. Example: {"type": "object", "required": ["code"]}';
COMMENT ON COLUMN domain_service.domains.sensitivity_level IS
    'Determines approval workflow requirements. Values: normal (no approval), sensitive (1 approver), critical (2 approvers)';
```

### Constraint Comments

```sql
-- GateHouse can extract these for error messages
COMMENT ON CONSTRAINT chk_items_code_format ON reference_service.items IS
    'Code must start with uppercase letter, followed by uppercase letters, numbers, underscores, or hyphens';

COMMENT ON CONSTRAINT chk_items_date_range ON reference_service.items IS
    'Expiry date must be after effective date';
```

---

## 12. Complete Examples

### User/Auth Table

```sql
CREATE SCHEMA IF NOT EXISTS auth_service;

CREATE TABLE auth_service.users (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,

    -- Profile
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,

    -- Authentication
    password_hash VARCHAR(255),  -- NULL for SSO-only users
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CONSTRAINT chk_users_status CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),

    -- Preferences
    preferences JSONB NOT NULL DEFAULT '{}'
        CONSTRAINT chk_users_preferences_object CHECK (jsonb_typeof(preferences) = 'object'),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Indexes
CREATE INDEX idx_users_email_lower ON auth_service.users (LOWER(email));
CREATE INDEX idx_users_status ON auth_service.users (status) WHERE status != 'deleted';

-- Triggers
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth_service.users
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- Comments
COMMENT ON TABLE auth_service.users IS 'User accounts for authentication and identity';
COMMENT ON COLUMN auth_service.users.password_hash IS 'Argon2id hash. NULL for SSO-only users.';
```

### Domain Table (Hierarchical with Soft Delete)

```sql
CREATE SCHEMA IF NOT EXISTS domain_service;

CREATE TABLE domain_service.domains (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core fields
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Hierarchy
    parent_id UUID REFERENCES domain_service.domains(id) ON DELETE SET NULL,

    -- Configuration
    schema_config JSONB NOT NULL DEFAULT '{}'
        CONSTRAINT chk_domains_schema_config CHECK (jsonb_typeof(schema_config) = 'object'),
    sensitivity_level VARCHAR(20) NOT NULL DEFAULT 'normal'
        CONSTRAINT chk_domains_sensitivity CHECK (sensitivity_level IN ('normal', 'sensitive', 'critical')),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth_service.users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES auth_service.users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth_service.users(id)
);

-- Indexes
CREATE INDEX idx_domains_parent_id ON domain_service.domains (parent_id);
CREATE INDEX idx_domains_created_by ON domain_service.domains (created_by);
CREATE INDEX idx_domains_active ON domain_service.domains (name, parent_id)
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_domains_name_parent_active
    ON domain_service.domains (name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'))
    WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER trg_domains_updated_at
    BEFORE UPDATE ON domain_service.domains
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TRIGGER trg_domains_version
    BEFORE UPDATE ON domain_service.domains
    FOR EACH ROW EXECUTE FUNCTION shared.increment_version();

-- Comments
COMMENT ON TABLE domain_service.domains IS 'Hierarchical domain structure. Max depth: 5 levels.';
COMMENT ON COLUMN domain_service.domains.sensitivity_level IS
    'Approval requirements: normal=none, sensitive=1 approver, critical=2 approvers';
```

### Reference Item (State Machine Entity)

```sql
CREATE TABLE reference_service.reference_items (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent reference
    domain_id UUID NOT NULL REFERENCES domain_service.domains(id) ON DELETE RESTRICT,

    -- Core fields
    code VARCHAR(50) NOT NULL
        CONSTRAINT chk_items_code_format CHECK (code ~ '^[A-Z][A-Z0-9_-]{1,49}$'),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- State machine field
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_items_status CHECK (status IN (
            'draft',
            'pending_approval',
            'approved',
            'rejected',
            'archived'
        )),

    -- Workflow fields
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES auth_service.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth_service.users(id),
    rejection_reason TEXT,

    -- Validity period
    effective_date DATE,
    expiry_date DATE,
    CONSTRAINT chk_items_date_range CHECK (
        expiry_date IS NULL OR effective_date IS NULL OR expiry_date > effective_date
    ),

    -- Flexible attributes
    attributes JSONB NOT NULL DEFAULT '{}'
        CONSTRAINT chk_items_attributes CHECK (jsonb_typeof(attributes) = 'object'),

    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth_service.users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES auth_service.users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth_service.users(id),

    -- Approval consistency
    CONSTRAINT chk_items_approval_complete CHECK (
        (approved_at IS NULL AND approved_by IS NULL) OR
        (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_items_domain_id ON reference_service.reference_items (domain_id);
CREATE INDEX idx_items_status ON reference_service.reference_items (status);
CREATE INDEX idx_items_effective_date ON reference_service.reference_items (effective_date);
CREATE INDEX idx_items_created_by ON reference_service.reference_items (created_by);
CREATE INDEX idx_items_attributes_gin ON reference_service.reference_items USING GIN (attributes);

-- Unique code per domain (active records only)
CREATE UNIQUE INDEX uq_items_domain_code_active
    ON reference_service.reference_items (domain_id, code)
    WHERE deleted_at IS NULL;

-- Active items query optimization
CREATE INDEX idx_items_domain_active
    ON reference_service.reference_items (domain_id, status, created_at DESC)
    WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON reference_service.reference_items
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TRIGGER trg_items_version
    BEFORE UPDATE ON reference_service.reference_items
    FOR EACH ROW EXECUTE FUNCTION shared.increment_version();

-- Comments
COMMENT ON TABLE reference_service.reference_items IS
    'Reference data items with approval workflow. Status transitions: draft → pending_approval → approved/rejected';
COMMENT ON COLUMN reference_service.reference_items.code IS
    'Unique identifier within domain. Format: uppercase letter followed by alphanumeric/underscore/hyphen.';
COMMENT ON COLUMN reference_service.reference_items.attributes IS
    'Flexible JSON attributes validated against parent domain schema_config.';
```

### Audit Log (Append-Only)

```sql
CREATE TABLE shared.audit_log (
    -- Use UUIDv7 for time-sortable IDs
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What changed
    service_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL
        CONSTRAINT chk_audit_action CHECK (action IN (
            'create', 'update', 'delete', 'restore',
            'state_change', 'permission_change', 'login', 'logout'
        )),

    -- Who changed it
    user_id UUID,  -- NULL for system actions

    -- When
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Change details
    before_state JSONB,
    after_state JSONB,
    changes JSONB,  -- Diff of what changed

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- BRIN index for time-range queries (very efficient for append-only)
CREATE INDEX idx_audit_log_timestamp_brin
    ON shared.audit_log USING BRIN (timestamp)
    WITH (pages_per_range = 128);

-- B-tree indexes for filtering
CREATE INDEX idx_audit_log_entity ON shared.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON shared.audit_log (user_id, timestamp DESC);
CREATE INDEX idx_audit_log_service ON shared.audit_log (service_name, timestamp DESC);

-- Partition by month for large deployments (optional)
-- CREATE TABLE shared.audit_log (...) PARTITION BY RANGE (timestamp);

COMMENT ON TABLE shared.audit_log IS 'Immutable audit trail of all data changes across services';
```

---

## Quick Reference Checklist

### Before Creating a Table

- [ ] Schema name follows `{context}_service` pattern
- [ ] Table name is plural, snake_case
- [ ] Primary key is `id UUID DEFAULT gen_random_uuid()`

### Columns

- [ ] Foreign keys named `{table_singular}_id`
- [ ] Booleans prefixed with `is_`, `has_`, `can_`
- [ ] Timestamps suffixed with `_at`
- [ ] Actor references suffixed with `_by`
- [ ] All columns have explicit NULL/NOT NULL

### Audit & Soft Delete

- [ ] `created_at`, `updated_at` present
- [ ] `created_by`, `updated_by` present (if authenticated context)
- [ ] `deleted_at`, `deleted_by` present (if soft delete)
- [ ] `version` present (if optimistic locking needed)
- [ ] Triggers for `updated_at` and `version`

### Constraints

- [ ] CHECK constraints for enums
- [ ] CHECK constraints for valid ranges
- [ ] Unique constraints use partial indexes with soft delete
- [ ] Foreign keys specify ON DELETE behavior

### Indexes

- [ ] All foreign keys have indexes
- [ ] Soft delete tables have partial index for active records
- [ ] Frequent filter columns are indexed
- [ ] GIN indexes for JSONB columns that are queried

### Documentation

- [ ] Table has COMMENT explaining purpose
- [ ] Complex columns have COMMENT explaining usage
- [ ] Enum CHECK constraints have COMMENT for error messages
