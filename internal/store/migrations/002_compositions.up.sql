-- Compositions: multi-service spec composition support

CREATE TABLE compositions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    description   TEXT,
    host_spec_id  UUID NOT NULL REFERENCES specs(id) ON DELETE RESTRICT,
    owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_compositions_name UNIQUE (name)
);

CREATE INDEX idx_compositions_host_spec ON compositions (host_spec_id);
CREATE INDEX idx_compositions_owner ON compositions (owner_id);

CREATE TRIGGER trg_compositions_updated_at
    BEFORE UPDATE ON compositions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE compositions IS 'Multi-service UI compositions. Each aggregates a host spec with service member specs.';

CREATE TABLE composition_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id  UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
    spec_id         UUID NOT NULL REFERENCES specs(id) ON DELETE RESTRICT,
    service_name    VARCHAR(100) NOT NULL,
    prefix          VARCHAR(100),
    nav_group       VARCHAR(100),
    nav_order       INT NOT NULL DEFAULT 0,
    optional        BOOLEAN NOT NULL DEFAULT false,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_members_spec UNIQUE (composition_id, spec_id),
    CONSTRAINT uq_comp_members_name UNIQUE (composition_id, service_name)
);

CREATE INDEX idx_comp_members_composition ON composition_members (composition_id);
CREATE INDEX idx_comp_members_spec ON composition_members (spec_id);

COMMENT ON TABLE composition_members IS 'Service specs that contribute entities and nav items to a composition.';
