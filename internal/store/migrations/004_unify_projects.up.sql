-- Unify projects: every spec gets a composition wrapper (single-service = 0 members)

-- Auto-create a composition for every spec not already a host in any composition
INSERT INTO compositions (name, display_name, description, host_spec_id, owner_id)
SELECT
    s.app_name,
    s.display_name,
    s.description,
    s.id,
    s.owner_id
FROM specs s
WHERE NOT EXISTS (
    SELECT 1 FROM compositions c WHERE c.host_spec_id = s.id
);

-- Enforce 1:1 mapping: each spec can be host of at most one composition
ALTER TABLE compositions
    ADD CONSTRAINT uq_compositions_host_spec_id UNIQUE (host_spec_id);
