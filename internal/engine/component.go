package engine

import "encoding/json"

type ComponentTree struct {
	Root     *ComponentNode `json:"root"`
	Metadata TreeMetadata   `json:"metadata"`
}

type TreeMetadata struct {
	AppName    string   `json:"app_name"`
	Version    string   `json:"version"`
	Entities   []string `json:"entities"`
	RouteCount int      `json:"route_count"`
	Target     string   `json:"target,omitempty"`
}

type ComponentNode struct {
	ID         string            `json:"id,omitempty"`
	Kind       ComponentKind     `json:"kind"`
	Props      map[string]any    `json:"props,omitempty"`
	Children   []*ComponentNode  `json:"children,omitempty"`
	Scope      *Scope            `json:"scope,omitempty"`
	Conditions []RenderCondition `json:"conditions,omitempty"`
}

type Scope struct {
	Entity string `json:"entity,omitempty"`
	Page   string `json:"page,omitempty"`
	Route  string `json:"route,omitempty"`
}

type RenderCondition struct {
	Type  string   `json:"type"`
	Roles []string `json:"roles,omitempty"`
}

type ComponentKind string

const (
	// Layout
	KindAppShell  ComponentKind = "app_shell"
	KindSidebar   ComponentKind = "sidebar"
	KindHeader    ComponentKind = "header"
	KindPage      ComponentKind = "page"
	KindTabLayout ComponentKind = "tab_layout"
	KindTab       ComponentKind = "tab"
	KindSection   ComponentKind = "section"
	KindTwoColumn ComponentKind = "two_column"

	// Entity views
	KindEntityList   ComponentKind = "entity_list"
	KindDataTable    ComponentKind = "data_table"
	KindFilterPanel  ComponentKind = "filter_panel"
	KindSearchBar    ComponentKind = "search_bar"
	KindEntityDetail ComponentKind = "entity_detail"
	KindDetailHeader ComponentKind = "detail_header"
	KindEmptyState   ComponentKind = "empty_state"

	// Forms
	KindCreateForm  ComponentKind = "create_form"
	KindEditForm    ComponentKind = "edit_form"
	KindSteppedForm ComponentKind = "stepped_form"
	KindFormStep    ComponentKind = "form_step"
	KindFormSection ComponentKind = "form_section"

	// Display components
	KindDisplayString     ComponentKind = "display_string"
	KindDisplayEnum       ComponentKind = "display_enum"
	KindDisplayDate       ComponentKind = "display_date"
	KindDisplayCurrency   ComponentKind = "display_currency"
	KindDisplayStarRating ComponentKind = "display_star_rating"
	KindDisplayBadge      ComponentKind = "display_badge"
	KindDisplayAvatar     ComponentKind = "display_avatar"

	// Field inputs
	KindFieldString    ComponentKind = "field_string"
	KindFieldEnum      ComponentKind = "field_enum"
	KindFieldDate      ComponentKind = "field_date"
	KindFieldReference ComponentKind = "field_reference"
	KindFieldCurrency  ComponentKind = "field_currency"
	KindFieldRichText  ComponentKind = "field_richtext"
	KindFieldAddress   ComponentKind = "field_address"

	// Navigation
	KindNavItem  ComponentKind = "nav_item"
	KindNavGroup ComponentKind = "nav_group"

	// Widgets
	KindStatCards         ComponentKind = "stat_cards"
	KindChart             ComponentKind = "chart"
	KindEntityTableWidget ComponentKind = "entity_table_widget"

	// Placeholder for custom pages
	KindCustomPage ComponentKind = "custom_page"
)

func (t *ComponentTree) ToJSON() ([]byte, error) {
	return json.Marshal(t)
}
