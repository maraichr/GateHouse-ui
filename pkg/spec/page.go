package spec

type Page struct {
	ID          string   `yaml:"id" json:"id"`
	Path        string   `yaml:"path" json:"path"`
	Title       string   `yaml:"title" json:"title"`
	Permissions []string `yaml:"permissions" json:"permissions,omitempty"`
	Widgets     []Widget `yaml:"widgets" json:"widgets"`
}

type Widget struct {
	Type string `yaml:"type" json:"type"`
	// stat_cards
	Layout string     `yaml:"layout" json:"layout,omitempty"`
	Cards  []StatCard `yaml:"cards" json:"cards,omitempty"`
	// chart
	Title       string         `yaml:"title" json:"title,omitempty"`
	ChartType   string         `yaml:"chart_type" json:"chart_type,omitempty"`
	Source      string         `yaml:"source" json:"source,omitempty"`
	DataMapping map[string]any `yaml:"data_mapping" json:"data_mapping,omitempty"`
	Height      int            `yaml:"height" json:"height,omitempty"`
	// entity_table
	Entity  string         `yaml:"entity" json:"entity,omitempty"`
	Query   *WidgetQuery   `yaml:"query" json:"query,omitempty"`
	Columns interface{}    `yaml:"columns" json:"columns,omitempty"`
	Link    string         `yaml:"link" json:"link,omitempty"`
	Actions *ActionConfig  `yaml:"actions" json:"actions,omitempty"`
	// report_builder
	Reports []Report `yaml:"reports" json:"reports,omitempty"`
	// settings_form
	Sections []SettingsSection `yaml:"sections" json:"sections,omitempty"`
	// confirmation
	Confirmation *Confirmation `yaml:"confirmation" json:"confirmation,omitempty"`
}

type StatCard struct {
	Title string      `yaml:"title" json:"title"`
	Value interface{} `yaml:"value" json:"value"`
	Icon  string      `yaml:"icon" json:"icon,omitempty"`
	Color string      `yaml:"color" json:"color,omitempty"`
	Link  string      `yaml:"link" json:"link,omitempty"`
}

type WidgetQuery struct {
	Filter map[string]any `yaml:"filter" json:"filter,omitempty"`
	Sort   *SortConfig    `yaml:"sort" json:"sort,omitempty"`
	Limit  int            `yaml:"limit" json:"limit,omitempty"`
}

type Report struct {
	ID           string          `yaml:"id" json:"id"`
	Name         string          `yaml:"name" json:"name"`
	Description  string          `yaml:"description" json:"description,omitempty"`
	Endpoint     string          `yaml:"endpoint" json:"endpoint"`
	Parameters   []ReportParam   `yaml:"parameters" json:"parameters,omitempty"`
	ExportFormats []string       `yaml:"export_formats" json:"export_formats,omitempty"`
}

type ReportParam struct {
	Name     string `yaml:"name" json:"name"`
	Type     string `yaml:"type" json:"type"`
	Required bool   `yaml:"required" json:"required,omitempty"`
	Entity   string `yaml:"entity" json:"entity,omitempty"`
	Field    string `yaml:"field" json:"field,omitempty"`
}

type SettingsSection struct {
	Title  string         `yaml:"title" json:"title"`
	Fields []SettingsField `yaml:"fields" json:"fields"`
}

type SettingsField struct {
	Name        string      `yaml:"name" json:"name"`
	Type        string      `yaml:"type" json:"type"`
	DisplayName string      `yaml:"display_name" json:"display_name,omitempty"`
	Source      string      `yaml:"source" json:"source,omitempty"`
	Save        string      `yaml:"save" json:"save,omitempty"`
	Options     []string    `yaml:"options" json:"options,omitempty"`
	Min         int         `yaml:"min" json:"min,omitempty"`
	Max         int         `yaml:"max" json:"max,omitempty"`
	Default     interface{} `yaml:"default" json:"default,omitempty"`
}
