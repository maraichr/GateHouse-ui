package spec

type NavigationConfig struct {
	Items []NavItem `yaml:"items" json:"items"`
}

type NavItem struct {
	ID          string     `yaml:"id" json:"id"`
	Label       string     `yaml:"label" json:"label"`
	Icon        string     `yaml:"icon" json:"icon,omitempty"`
	Path        string     `yaml:"path" json:"path,omitempty"`
	Entity      string     `yaml:"entity" json:"entity,omitempty"`
	Page        string     `yaml:"page" json:"page,omitempty"`
	Target      *NavTarget `yaml:"target" json:"target,omitempty"`
	Position    string     `yaml:"position" json:"position,omitempty"`
	Permissions []string   `yaml:"permissions" json:"permissions,omitempty"`
	Badge       *NavBadge  `yaml:"badge" json:"badge,omitempty"`
	Children    []NavItem  `yaml:"children" json:"children,omitempty"`
}

type NavTarget struct {
	Type string `yaml:"type" json:"type"`
	Ref  string `yaml:"ref" json:"ref"`
}

type NavBadge struct {
	Type   string         `yaml:"type" json:"type"`
	Filter map[string]any `yaml:"filter" json:"filter,omitempty"`
	Color  string         `yaml:"color" json:"color,omitempty"`
	Source string         `yaml:"source" json:"source,omitempty"`
}
