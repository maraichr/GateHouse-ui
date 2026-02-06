package spec

type Entity struct {
	Name              string          `yaml:"name" json:"name"`
	APIResource       string          `yaml:"api_resource" json:"api_resource"`
	DisplayName       string          `yaml:"display_name" json:"display_name"`
	DisplayNamePlural string          `yaml:"display_name_plural" json:"display_name_plural,omitempty"`
	Icon              string          `yaml:"icon" json:"icon,omitempty"`
	Description       string          `yaml:"description" json:"description,omitempty"`
	LabelField        string          `yaml:"label_field" json:"label_field"`
	SubtitleField     string          `yaml:"subtitle_field" json:"subtitle_field,omitempty"`
	StatusField       string          `yaml:"status_field" json:"status_field,omitempty"`
	Fields            []Field         `yaml:"fields" json:"fields"`
	StateMachine      *StateMachine   `yaml:"state_machine" json:"state_machine,omitempty"`
	Relationships     []Relationship  `yaml:"relationships" json:"relationships,omitempty"`
	Views             EntityViews     `yaml:"views" json:"views"`
	ComputedFields    []ComputedField `yaml:"computed_fields" json:"computed_fields,omitempty"`
}

type StateMachine struct {
	Field       string       `yaml:"field" json:"field"`
	Initial     string       `yaml:"initial" json:"initial"`
	Transitions []Transition `yaml:"transitions" json:"transitions"`
}

type Transition struct {
	Name         string        `yaml:"name" json:"name"`
	Label        string        `yaml:"label" json:"label"`
	From         []string      `yaml:"from" json:"from"`
	To           string        `yaml:"to" json:"to"`
	Icon         string        `yaml:"icon" json:"icon,omitempty"`
	Color        string        `yaml:"color" json:"color,omitempty"`
	Confirmation *Confirmation `yaml:"confirmation" json:"confirmation,omitempty"`
	Guards       []Guard       `yaml:"guards" json:"guards,omitempty"`
	Permissions  []string      `yaml:"permissions" json:"permissions,omitempty"`
	Form         *TransitionForm `yaml:"form" json:"form,omitempty"`
}

type Confirmation struct {
	Title          string `yaml:"title" json:"title"`
	Message        string `yaml:"message" json:"message,omitempty"`
	Style          string `yaml:"style" json:"style,omitempty"`
	RequireComment bool   `yaml:"require_comment" json:"require_comment"`
	CommentLabel   string `yaml:"comment_label" json:"comment_label,omitempty"`
	TypeToConfirm  string `yaml:"type_to_confirm" json:"type_to_confirm,omitempty"`
}

type Guard struct {
	Name       string         `yaml:"name" json:"name"`
	Message    string         `yaml:"message" json:"message"`
	FieldCheck string         `yaml:"field_check" json:"field_check,omitempty"`
	APICheck   string         `yaml:"api_check" json:"api_check,omitempty"`
	Expected   map[string]any `yaml:"expected" json:"expected,omitempty"`
}

type TransitionForm struct {
	Fields []Field `yaml:"fields" json:"fields"`
}

type Relationship struct {
	Name          string         `yaml:"name" json:"name"`
	Type          string         `yaml:"type" json:"type"`
	Entity        string         `yaml:"entity" json:"entity"`
	ForeignKey    string         `yaml:"foreign_key" json:"foreign_key,omitempty"`
	Through       string         `yaml:"through" json:"through,omitempty"`
	DisplayName   string         `yaml:"display_name" json:"display_name,omitempty"`
	ShowInDetail  bool           `yaml:"show_in_detail" json:"show_in_detail"`
	InlineCreate  bool           `yaml:"inline_create" json:"inline_create"`
	InlineEdit    bool           `yaml:"inline_edit" json:"inline_edit"`
	DefaultSort   *SortConfig    `yaml:"default_sort" json:"default_sort,omitempty"`
}

type SortConfig struct {
	Field string `yaml:"field" json:"field"`
	Order string `yaml:"order" json:"order"`
}

type ComputedField struct {
	Name         string         `yaml:"name" json:"name"`
	DisplayName  string         `yaml:"display_name" json:"display_name"`
	Type         string         `yaml:"type" json:"type"`
	Expression   string         `yaml:"expression" json:"expression"`
	DisplayAs    string         `yaml:"display_as" json:"display_as,omitempty"`
	Values       map[string]any `yaml:"values" json:"values,omitempty"`
	DisplayRules []DisplayRule  `yaml:"display_rules" json:"display_rules,omitempty"`
}
