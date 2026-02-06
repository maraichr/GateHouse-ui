package spec

type Field struct {
	Name           string              `yaml:"name" json:"name"`
	Type           string              `yaml:"type" json:"type"`
	DisplayName    string              `yaml:"display_name" json:"display_name,omitempty"`
	Required       bool                `yaml:"required" json:"required"`
	Hidden         bool                `yaml:"hidden" json:"hidden,omitempty"`
	PrimaryKey     bool                `yaml:"primary_key" json:"primary_key,omitempty"`
	Immutable      bool                `yaml:"immutable" json:"immutable,omitempty"`
	Computed       interface{}         `yaml:"computed" json:"computed,omitempty"`
	Generated      bool                `yaml:"generated" json:"generated,omitempty"`
	Sensitive      bool                `yaml:"sensitive" json:"sensitive,omitempty"`
	MaskPattern    string              `yaml:"mask_pattern" json:"mask_pattern,omitempty"`
	Default        interface{}         `yaml:"default" json:"default,omitempty"`
	Placeholder    string              `yaml:"placeholder" json:"placeholder,omitempty"`
	HelpText       string              `yaml:"help_text" json:"help_text,omitempty"`
	MinLength      int                 `yaml:"min_length" json:"min_length,omitempty"`
	MaxLength      int                 `yaml:"max_length" json:"max_length,omitempty"`
	Min            interface{}         `yaml:"min" json:"min,omitempty"`
	Max            interface{}         `yaml:"max" json:"max,omitempty"`
	Pattern        string              `yaml:"pattern" json:"pattern,omitempty"`
	PatternMessage string              `yaml:"pattern_message" json:"pattern_message,omitempty"`
	Precision      int                 `yaml:"precision" json:"precision,omitempty"`
	Format         string              `yaml:"format" json:"format,omitempty"`
	Currency       string              `yaml:"currency" json:"currency,omitempty"`
	FutureOnly     bool                `yaml:"future_only" json:"future_only,omitempty"`
	Searchable     bool                `yaml:"searchable" json:"searchable,omitempty"`
	Sortable       bool                `yaml:"sortable" json:"sortable,omitempty"`
	Filterable     bool                `yaml:"filterable" json:"filterable,omitempty"`
	Values         []EnumValue         `yaml:"values" json:"values,omitempty"`
	ShowIn         *ShowIn             `yaml:"show_in" json:"show_in,omitempty"`
	DisplayAs      string              `yaml:"display_as" json:"display_as,omitempty"`
	DisplayRules   []DisplayRule       `yaml:"display_rules" json:"display_rules,omitempty"`
	Permissions    *FieldPermissions   `yaml:"permissions" json:"permissions,omitempty"`
	// Reference fields
	Entity       string `yaml:"entity" json:"entity,omitempty"`
	DisplayField string `yaml:"display_field" json:"display_field,omitempty"`
	Filter       map[string]any `yaml:"filter" json:"filter,omitempty"`
	// Array fields
	MinItems  int        `yaml:"min_items" json:"min_items,omitempty"`
	MaxItems  int        `yaml:"max_items" json:"max_items,omitempty"`
	Items     *FieldItem `yaml:"items" json:"items,omitempty"`
	InputType string     `yaml:"input_type" json:"input_type,omitempty"`
	// Address fields
	Components map[string]AddressComponent `yaml:"components" json:"components,omitempty"`
	// File fields
	Accept    interface{} `yaml:"accept" json:"accept,omitempty"`
	MaxSizeMB int         `yaml:"max_size_mb" json:"max_size_mb,omitempty"`
	MaxFiles  int         `yaml:"max_files" json:"max_files,omitempty"`
	Preview   bool        `yaml:"preview" json:"preview,omitempty"`
	// Image fields
	Dimensions *ImageDimensions `yaml:"dimensions" json:"dimensions,omitempty"`
	// Rich text
	Toolbar []string `yaml:"toolbar" json:"toolbar,omitempty"`
	// Inline table
	Columns    []InlineTableColumn `yaml:"columns" json:"columns,omitempty"`
	Footer     []InlineTableFooter `yaml:"footer" json:"footer,omitempty"`
	MinRows    int                 `yaml:"min_rows" json:"min_rows,omitempty"`
	MaxRows    int                 `yaml:"max_rows" json:"max_rows,omitempty"`
	// Highlight (used in field_overrides)
	Highlight bool `yaml:"highlight" json:"highlight,omitempty"`
}

type FieldItem struct {
	Type       string `yaml:"type" json:"type"`
	Entity     string `yaml:"entity" json:"entity,omitempty"`
	LabelField string `yaml:"label_field" json:"label_field,omitempty"`
}

type FieldPermissions struct {
	View []string `yaml:"view" json:"view,omitempty"`
	Edit []string `yaml:"edit" json:"edit,omitempty"`
}

type EnumValue struct {
	Value string `yaml:"value" json:"value"`
	Label string `yaml:"label" json:"label"`
	Color string `yaml:"color" json:"color,omitempty"`
	Icon  string `yaml:"icon" json:"icon,omitempty"`
}

type ShowIn struct {
	List   bool `yaml:"list" json:"list"`
	Detail bool `yaml:"detail" json:"detail"`
	Create bool `yaml:"create" json:"create"`
	Edit   bool `yaml:"edit" json:"edit"`
}

type DisplayRule struct {
	Condition string `yaml:"condition" json:"condition"`
	Style     string `yaml:"style" json:"style"`
	Tooltip   string `yaml:"tooltip" json:"tooltip,omitempty"`
	Label     string `yaml:"label" json:"label,omitempty"`
}

type AddressComponent struct {
	Required bool   `yaml:"required" json:"required"`
	Type     string `yaml:"type" json:"type,omitempty"`
	Pattern  string `yaml:"pattern" json:"pattern,omitempty"`
	Default  string `yaml:"default" json:"default,omitempty"`
}

type ImageDimensions struct {
	MinWidth    int    `yaml:"min_width" json:"min_width,omitempty"`
	MaxWidth    int    `yaml:"max_width" json:"max_width,omitempty"`
	AspectRatio string `yaml:"aspect_ratio" json:"aspect_ratio,omitempty"`
}

type InlineTableColumn struct {
	Name     string      `yaml:"name" json:"name"`
	Type     string      `yaml:"type" json:"type"`
	Required bool        `yaml:"required" json:"required,omitempty"`
	Width    interface{} `yaml:"width" json:"width,omitempty"`
	Computed string      `yaml:"computed" json:"computed,omitempty"`
}

type InlineTableFooter struct {
	Column    string `yaml:"column" json:"column"`
	Value     string `yaml:"value" json:"value,omitempty"`
	Aggregate string `yaml:"aggregate" json:"aggregate,omitempty"`
	Style     string `yaml:"style" json:"style,omitempty"`
}
