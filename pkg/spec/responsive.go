package spec

type ResponsiveConfig struct {
	Breakpoints Breakpoints      `yaml:"breakpoints" json:"breakpoints"`
	Rules       []ResponsiveRule `yaml:"rules" json:"rules,omitempty"`
}

type Breakpoints struct {
	Mobile  int `yaml:"mobile" json:"mobile"`
	Tablet  int `yaml:"tablet" json:"tablet"`
	Desktop int `yaml:"desktop" json:"desktop"`
	Wide    int `yaml:"wide" json:"wide"`
}

type ResponsiveRule struct {
	Breakpoint  string         `yaml:"breakpoint" json:"breakpoint"`
	EntityList  map[string]any `yaml:"entity_list" json:"entity_list,omitempty"`
	Sidebar     map[string]any `yaml:"sidebar" json:"sidebar,omitempty"`
	Detail      map[string]any `yaml:"detail" json:"detail,omitempty"`
}
