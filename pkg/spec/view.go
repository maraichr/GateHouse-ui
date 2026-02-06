package spec

import "gopkg.in/yaml.v3"

type EntityViews struct {
	List   *ListView   `yaml:"list" json:"list,omitempty"`
	Detail *DetailView `yaml:"detail" json:"detail,omitempty"`
	Create *FormView   `yaml:"create" json:"create,omitempty"`
	Edit   *FormView   `yaml:"edit" json:"edit,omitempty"`
}

// ListView

type ListView struct {
	Title       string        `yaml:"title" json:"title,omitempty"`
	DefaultSort *SortConfig   `yaml:"default_sort" json:"default_sort,omitempty"`
	Columns     []ListColumn  `yaml:"columns" json:"columns"`
	Filters     *FilterConfig `yaml:"filters" json:"filters,omitempty"`
	Search      *SearchConfig `yaml:"search" json:"search,omitempty"`
	Actions     *ActionConfig `yaml:"actions" json:"actions,omitempty"`
	BulkActions []BulkAction  `yaml:"bulk_actions" json:"bulk_actions,omitempty"`
	Empty       *EmptyState   `yaml:"empty" json:"empty,omitempty"`
}

type ListColumn struct {
	Field        string      `yaml:"field" json:"field"`
	Width        interface{} `yaml:"width" json:"width,omitempty"`
	Fixed        string      `yaml:"fixed" json:"fixed,omitempty"`
	LinkTo       string      `yaml:"link_to" json:"link_to,omitempty"`
	MaxDisplay   int         `yaml:"max_display" json:"max_display,omitempty"`
	DisplayField string      `yaml:"display_field" json:"display_field,omitempty"`
}

func (c *ListColumn) UnmarshalYAML(value *yaml.Node) error {
	if value.Kind == yaml.ScalarNode {
		c.Field = value.Value
		return nil
	}
	type plain ListColumn
	return value.Decode((*plain)(c))
}

type FilterConfig struct {
	Layout     string        `yaml:"layout" json:"layout"`
	Persistent bool          `yaml:"persistent" json:"persistent,omitempty"`
	Groups     []FilterGroup `yaml:"groups" json:"groups"`
}

type FilterGroup struct {
	Label  string        `yaml:"label" json:"label,omitempty"`
	Fields []FilterField `yaml:"fields" json:"fields"`
}

type FilterField struct {
	Field      string        `yaml:"field" json:"field"`
	Type       string        `yaml:"type" json:"type"`
	ShowCounts bool          `yaml:"show_counts" json:"show_counts,omitempty"`
	Searchable bool          `yaml:"searchable" json:"searchable,omitempty"`
	Min        interface{}   `yaml:"min" json:"min,omitempty"`
	Max        interface{}   `yaml:"max" json:"max,omitempty"`
	Step       float64       `yaml:"step" json:"step,omitempty"`
	Presets    []FilterPreset `yaml:"presets" json:"presets,omitempty"`
}

type FilterPreset struct {
	Label string        `yaml:"label" json:"label"`
	Range []interface{} `yaml:"range" json:"range"`
}

type SearchConfig struct {
	Placeholder string   `yaml:"placeholder" json:"placeholder,omitempty"`
	Fields      []string `yaml:"fields" json:"fields"`
	DebounceMs  int      `yaml:"debounce_ms" json:"debounce_ms,omitempty"`
	MinLength   int      `yaml:"min_length" json:"min_length,omitempty"`
}

type ActionConfig struct {
	Primary   []ActionButton `yaml:"primary" json:"primary,omitempty"`
	Secondary []ActionButton `yaml:"secondary" json:"secondary,omitempty"`
	Row       []ActionButton `yaml:"row" json:"row,omitempty"`
}

type ActionButton struct {
	Label        string        `yaml:"label" json:"label"`
	Icon         string        `yaml:"icon" json:"icon,omitempty"`
	Action       ActionTarget  `yaml:"action" json:"action"`
	Permissions  []string      `yaml:"permissions" json:"permissions,omitempty"`
	Confirmation *Confirmation `yaml:"confirmation" json:"confirmation,omitempty"`
}

type BulkAction struct {
	Label        string        `yaml:"label" json:"label"`
	Icon         string        `yaml:"icon" json:"icon,omitempty"`
	Action       ActionTarget  `yaml:"action" json:"action"`
	Permissions  []string      `yaml:"permissions" json:"permissions,omitempty"`
	Confirmation *Confirmation `yaml:"confirmation" json:"confirmation,omitempty"`
}

type EmptyState struct {
	Icon    string `yaml:"icon" json:"icon,omitempty"`
	Title   string `yaml:"title" json:"title"`
	Message string `yaml:"message" json:"message,omitempty"`
	Action  *EmptyStateAction `yaml:"action" json:"action,omitempty"`
}

type EmptyStateAction struct {
	Label string `yaml:"label" json:"label"`
	Path  string `yaml:"path" json:"path"`
}

// DetailView

type DetailView struct {
	Layout string           `yaml:"layout" json:"layout"`
	Header *DetailHeader    `yaml:"header" json:"header,omitempty"`
	Tabs   []DetailTab      `yaml:"tabs" json:"tabs,omitempty"`
	// For two_column layout (e.g. Document detail)
	Left   []DetailSection  `yaml:"left" json:"left,omitempty"`
	Right  *DetailRight     `yaml:"right" json:"right,omitempty"`
}

type DetailRight struct {
	Sections []DetailSection `yaml:"sections" json:"sections,omitempty"`
}

type DetailHeader struct {
	Title       string       `yaml:"title" json:"title"`
	Subtitle    string       `yaml:"subtitle" json:"subtitle,omitempty"`
	Avatar      string       `yaml:"avatar" json:"avatar,omitempty"`
	StatusBadge string       `yaml:"status_badge" json:"status_badge,omitempty"`
	Stats       []HeaderStat `yaml:"stats" json:"stats,omitempty"`
	Actions     interface{}  `yaml:"actions" json:"actions,omitempty"`
}

type HeaderStat struct {
	Label       string      `yaml:"label" json:"label"`
	Value       interface{} `yaml:"value" json:"value"`
	DisplayAs   string      `yaml:"display_as" json:"display_as,omitempty"`
	Format      string      `yaml:"format" json:"format,omitempty"`
	Permissions []string    `yaml:"permissions" json:"permissions,omitempty"`
}

type DetailTab struct {
	ID       string          `yaml:"id" json:"id"`
	Label    string          `yaml:"label" json:"label"`
	Icon     string          `yaml:"icon" json:"icon,omitempty"`
	Sections []DetailSection `yaml:"sections" json:"sections,omitempty"`
	Content  *TabContent     `yaml:"content" json:"content,omitempty"`
}

type DetailSection struct {
	Title       string   `yaml:"title" json:"title,omitempty"`
	Layout      string   `yaml:"layout" json:"layout,omitempty"`
	Fields      []string `yaml:"fields" json:"fields,omitempty"`
	Permissions []string `yaml:"permissions" json:"permissions,omitempty"`
	// For special content like file_preview
	Component string `yaml:"component" json:"component,omitempty"`
	Field     string `yaml:"field" json:"field,omitempty"`
	// Actions
	Actions interface{} `yaml:"actions" json:"actions,omitempty"`
}

type TabContent struct {
	Type         string   `yaml:"type" json:"type"`
	Relationship string   `yaml:"relationship" json:"relationship,omitempty"`
	InlineCreate bool     `yaml:"inline_create" json:"inline_create,omitempty"`
	Columns      []string `yaml:"columns" json:"columns,omitempty"`
	Source       string   `yaml:"source" json:"source,omitempty"`
	ItemTemplate *ItemTemplate `yaml:"item_template" json:"item_template,omitempty"`
	ShowCurrentState bool `yaml:"show_current_state" json:"show_current_state,omitempty"`
}

type ItemTemplate struct {
	Avatar    string `yaml:"avatar" json:"avatar,omitempty"`
	Title     string `yaml:"title" json:"title"`
	Subtitle  string `yaml:"subtitle" json:"subtitle,omitempty"`
	Timestamp string `yaml:"timestamp" json:"timestamp,omitempty"`
}

// FormView

type FormView struct {
	Title          string              `yaml:"title" json:"title"`
	Layout         string              `yaml:"layout" json:"layout"`
	SubmitLabel    string              `yaml:"submit_label" json:"submit_label,omitempty"`
	CancelPath     string              `yaml:"cancel_path" json:"cancel_path,omitempty"`
	Steps          []FormStep          `yaml:"steps" json:"steps,omitempty"`
	Sections       []FormSection       `yaml:"sections" json:"sections,omitempty"`
	FieldOverrides map[string]Field    `yaml:"field_overrides" json:"field_overrides,omitempty"`
}

type FormStep struct {
	ID          string   `yaml:"id" json:"id"`
	Title       string   `yaml:"title" json:"title"`
	Description string   `yaml:"description" json:"description,omitempty"`
	Type        string   `yaml:"type" json:"type,omitempty"`
	Fields      []string `yaml:"fields" json:"fields,omitempty"`
}

type FormSection struct {
	Title       string   `yaml:"title" json:"title"`
	Fields      []string `yaml:"fields" json:"fields"`
	Permissions []string `yaml:"permissions" json:"permissions,omitempty"`
}
