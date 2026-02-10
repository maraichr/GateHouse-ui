-- Revert: drop the unique constraint (compositions created by migration remain)
ALTER TABLE compositions
    DROP CONSTRAINT IF EXISTS uq_compositions_host_spec_id;
