package spec

type StudioConfig struct {
	SchemaVersion string              `yaml:"schema_version" json:"schema_version,omitempty"`
	ModeDefaults  *StudioModeDefaults `yaml:"mode_defaults" json:"mode_defaults,omitempty"`
}

type StudioModeDefaults struct {
	Editor string `yaml:"editor" json:"editor,omitempty"`
}

type Journey struct {
	ID           string        `yaml:"id" json:"id"`
	Name         string        `yaml:"name" json:"name"`
	Goal         string        `yaml:"goal" json:"goal,omitempty"`
	PrimaryRoles []string      `yaml:"primary_roles" json:"primary_roles,omitempty"`
	Entry        bool          `yaml:"entry" json:"entry,omitempty"`
	Steps        []JourneyStep `yaml:"steps" json:"steps,omitempty"`
}

type JourneyStep struct {
	ID           string   `yaml:"id" json:"id"`
	Name         string   `yaml:"name" json:"name"`
	PageID       string   `yaml:"page_id" json:"page_id,omitempty"`
	EntityRefs   []string `yaml:"entity_refs" json:"entity_refs,omitempty"`
	ServiceScope string   `yaml:"service_scope" json:"service_scope,omitempty"`
}
