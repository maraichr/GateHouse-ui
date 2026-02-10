ALTER TABLE specs ADD COLUMN draft_data JSONB;
ALTER TABLE specs ADD COLUMN draft_updated_at TIMESTAMPTZ;
COMMENT ON COLUMN specs.draft_data IS 'Mutable working copy of the spec. NULL when no draft exists.';
