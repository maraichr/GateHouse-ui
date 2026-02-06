package spec

import "gopkg.in/yaml.v3"

type ResolvedSpec struct {
	Metadata   ResolvedMetadata          `yaml:"metadata" json:"metadata"`
	App        ResolvedApp               `yaml:"app" json:"app"`
	Entities   map[string]ResolvedEntity `yaml:"entities" json:"entities"`
	Layout     ResolvedLayout            `yaml:"layout" json:"layout"`
	Routes     []ResolvedRoute           `yaml:"routes" json:"routes"`
	Nodes      map[string]ResolvedNode   `yaml:"nodes" json:"nodes"`
	Extensions map[string]any            `yaml:"extensions" json:"extensions,omitempty"`
}

type ResolvedMetadata struct {
	AppName       string `yaml:"app_name" json:"app_name"`
	Version       string `yaml:"version" json:"version"`
	SchemaVersion string `yaml:"schema_version" json:"schema_version"`
}

type ResolvedApp struct {
	AppName       string         `yaml:"app_name" json:"app_name"`
	Accessibility A11yConfig     `yaml:"accessibility" json:"accessibility,omitempty"`
	Theme         ThemeConfig    `yaml:"theme" json:"theme,omitempty"`
	Auth          AuthConfig     `yaml:"auth" json:"auth,omitempty"`
	API           APIConfig      `yaml:"api" json:"api,omitempty"`
	Behaviors     BehaviorConfig `yaml:"behaviors" json:"behaviors,omitempty"`
}

type ResolvedEntity struct {
	LabelField    string           `yaml:"label_field" json:"label_field"`
	Fields        []map[string]any `yaml:"fields" json:"fields,omitempty"`
	Relationships []map[string]any `yaml:"relationships" json:"relationships,omitempty"`
	StateMachine  map[string]any   `yaml:"state_machine" json:"state_machine,omitempty"`
}

type ResolvedLayout struct {
	Root  ResolvedNode            `yaml:"root" json:"root"`
	Nodes map[string]ResolvedNode `yaml:"nodes" json:"nodes,omitempty"`
}

type ResolvedRoute struct {
	Path string `yaml:"path" json:"path"`
	Node string `yaml:"node" json:"node"`
}

type ResolvedNode struct {
	ID         string              `yaml:"id" json:"id,omitempty"`
	Kind       string              `yaml:"kind" json:"kind"`
	Props      map[string]any      `yaml:"props" json:"props,omitempty"`
	Scope      *ResolvedNodeScope  `yaml:"scope" json:"scope,omitempty"`
	Children   []ResolvedNodeChild `yaml:"children" json:"children,omitempty"`
	Conditions []ResolvedCondition `yaml:"conditions" json:"conditions,omitempty"`
}

type ResolvedNodeScope struct {
	Entity string `yaml:"entity" json:"entity,omitempty"`
	Page   string `yaml:"page" json:"page,omitempty"`
}

type ResolvedCondition struct {
	Type  string   `yaml:"type" json:"type"`
	Roles []string `yaml:"roles" json:"roles,omitempty"`
}

type ResolvedNodeChild struct {
	Ref  string
	Node *ResolvedNode
}

func (c *ResolvedNodeChild) UnmarshalYAML(value *yaml.Node) error {
	switch value.Kind {
	case yaml.ScalarNode:
		c.Ref = value.Value
		return nil
	case yaml.MappingNode:
		var node ResolvedNode
		if err := value.Decode(&node); err != nil {
			return err
		}
		c.Node = &node
		return nil
	default:
		return value.Decode(&c.Ref)
	}
}
