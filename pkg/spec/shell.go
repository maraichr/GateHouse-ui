package spec

type ShellConfig struct {
	Layout  string        `yaml:"layout" json:"layout"`
	Sidebar SidebarConfig `yaml:"sidebar" json:"sidebar,omitempty"`
	Header  HeaderConfig  `yaml:"header" json:"header,omitempty"`
}

type SidebarConfig struct {
	Position         string `yaml:"position" json:"position"`
	Collapsible      bool   `yaml:"collapsible" json:"collapsible"`
	DefaultCollapsed bool   `yaml:"default_collapsed" json:"default_collapsed"`
	Width            int    `yaml:"width" json:"width"`
	CollapsedWidth   int    `yaml:"collapsed_width" json:"collapsed_width"`
	ShowUserMenu     bool   `yaml:"show_user_menu" json:"show_user_menu"`
	ShowSearch       bool   `yaml:"show_search" json:"show_search"`
}

type HeaderConfig struct {
	ShowBreadcrumbs    bool           `yaml:"show_breadcrumbs" json:"show_breadcrumbs"`
	ShowGlobalSearch   bool           `yaml:"show_global_search" json:"show_global_search"`
	ShowNotifications  bool           `yaml:"show_notifications" json:"show_notifications"`
	ShowTenantSwitcher bool           `yaml:"show_tenant_switcher" json:"show_tenant_switcher"`
	Actions            []HeaderAction `yaml:"actions" json:"actions,omitempty"`
}

type HeaderAction struct {
	Label  string       `yaml:"label" json:"label"`
	Icon   string       `yaml:"icon" json:"icon,omitempty"`
	Action ActionTarget `yaml:"action" json:"action"`
}

type ActionTarget struct {
	Type     string `yaml:"type" json:"type"`
	URL      string `yaml:"url" json:"url,omitempty"`
	Path     string `yaml:"path" json:"path,omitempty"`
	Method   string `yaml:"method" json:"method,omitempty"`
	Download bool   `yaml:"download" json:"download,omitempty"`
	Body     map[string]any `yaml:"body" json:"body,omitempty"`
}
