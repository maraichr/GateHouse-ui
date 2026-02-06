package engine

import (
	"fmt"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

type Builder struct{}

func NewBuilder() *Builder {
	return &Builder{}
}

func (b *Builder) Build(appSpec *spec.AppSpec, analysis *Analysis) *ComponentTree {
	root := &ComponentNode{
		ID:   "root",
		Kind: KindAppShell,
		Props: map[string]any{
			"app_name":     appSpec.App.DisplayName,
			"theme":        appSpec.App.Theme,
			"shell":        appSpec.Shell,
			"auth":         appSpec.Auth,
			"api":          appSpec.API,
			"behaviors":    appSpec.Behaviors,
			"accessibility": appSpec.Accessibility,
		},
	}

	// Sidebar navigation
	sidebar := b.buildSidebar(appSpec)
	root.Children = append(root.Children, sidebar)

	// Entity pages
	for _, entity := range appSpec.Entities {
		pages := b.buildEntityPages(&entity, analysis)
		root.Children = append(root.Children, pages...)
	}

	// Custom pages
	for _, page := range appSpec.Pages {
		pageNode := b.buildCustomPage(&page)
		root.Children = append(root.Children, pageNode)
	}

	entityNames := make([]string, len(appSpec.Entities))
	for i, e := range appSpec.Entities {
		entityNames[i] = e.Name
	}

	routeCount := 0
	for _, e := range appSpec.Entities {
		routeCount += 2 // list + detail
		if e.Views.Create != nil {
			routeCount++
		}
		if e.Views.Edit != nil {
			routeCount++
		}
	}
	routeCount += len(appSpec.Pages)

	return &ComponentTree{
		Root: root,
		Metadata: TreeMetadata{
			AppName:    appSpec.App.DisplayName,
			Version:    appSpec.App.Version,
			Entities:   entityNames,
			RouteCount: routeCount,
		},
	}
}

func (b *Builder) buildSidebar(appSpec *spec.AppSpec) *ComponentNode {
	sidebar := &ComponentNode{
		ID:   "sidebar",
		Kind: KindSidebar,
		Props: map[string]any{
			"config": appSpec.Shell.Sidebar,
		},
	}

	for _, item := range appSpec.Navigation.Items {
		sidebar.Children = append(sidebar.Children, b.buildNavItem(item))
	}

	return sidebar
}

func (b *Builder) buildNavItem(item spec.NavItem) *ComponentNode {
	if len(item.Children) > 0 {
		group := &ComponentNode{
			ID:   fmt.Sprintf("nav_%s", item.ID),
			Kind: KindNavGroup,
			Props: map[string]any{
				"id":    item.ID,
				"label": item.Label,
				"icon":  item.Icon,
			},
		}
		if len(item.Permissions) > 0 {
			group.Conditions = []RenderCondition{{Type: "permission", Roles: item.Permissions}}
		}
		for _, child := range item.Children {
			group.Children = append(group.Children, b.buildNavItem(child))
		}
		return group
	}

	node := &ComponentNode{
		ID:   fmt.Sprintf("nav_%s", item.ID),
		Kind: KindNavItem,
		Props: map[string]any{
			"id":       item.ID,
			"label":    item.Label,
			"icon":     item.Icon,
			"path":     item.Path,
			"entity":   item.Entity,
			"page":     item.Page,
			"position": item.Position,
		},
	}
	if item.Badge != nil {
		node.Props["badge"] = item.Badge
	}
	if len(item.Permissions) > 0 {
		node.Conditions = []RenderCondition{{Type: "permission", Roles: item.Permissions}}
	}
	return node
}

func (b *Builder) buildEntityPages(entity *spec.Entity, analysis *Analysis) []*ComponentNode {
	var nodes []*ComponentNode
	routes := analysis.RouteTable[entity.Name]
	scope := &Scope{Entity: entity.Name}

	// List page
	listNode := b.buildEntityList(entity, routes.ListPath)
	listNode.Scope = &Scope{Entity: entity.Name, Route: routes.ListPath}
	nodes = append(nodes, listNode)

	// Detail page
	detailNode := b.buildEntityDetail(entity, routes.DetailPath)
	detailNode.Scope = &Scope{Entity: entity.Name, Route: routes.DetailPath}
	nodes = append(nodes, detailNode)

	// Create form
	if entity.Views.Create != nil {
		createNode := b.buildCreateForm(entity, routes.CreatePath)
		createNode.Scope = &Scope{Entity: entity.Name, Route: routes.CreatePath}
		nodes = append(nodes, createNode)
	}

	// Edit form
	if entity.Views.Edit != nil {
		editNode := b.buildEditForm(entity, routes.EditPath)
		editNode.Scope = &Scope{Entity: entity.Name, Route: routes.EditPath}
		nodes = append(nodes, editNode)
	}

	_ = scope
	return nodes
}

func (b *Builder) buildEntityList(entity *spec.Entity, route string) *ComponentNode {
	listView := entity.Views.List

	node := &ComponentNode{
		ID:   fmt.Sprintf("%s_list", entity.Name),
		Kind: KindEntityList,
		Props: map[string]any{
			"entity":       entity.Name,
			"api_resource": entity.APIResource,
			"display_name": entity.DisplayNamePlural,
			"label_field":  entity.LabelField,
			"icon":         entity.Icon,
		},
	}

	if listView == nil {
		return node
	}

	node.Props["title"] = listView.Title
	if listView.DefaultSort != nil {
		node.Props["default_sort"] = listView.DefaultSort
	}

	// DataTable
	tableNode := &ComponentNode{
		ID:   fmt.Sprintf("%s_table", entity.Name),
		Kind: KindDataTable,
		Props: map[string]any{
			"columns": listView.Columns,
			"entity":  entity.Name,
			"fields":  entity.Fields,
		},
	}
	node.Children = append(node.Children, tableNode)

	// Filter panel
	if listView.Filters != nil {
		filterNode := &ComponentNode{
			ID:   fmt.Sprintf("%s_filters", entity.Name),
			Kind: KindFilterPanel,
			Props: map[string]any{
				"config": listView.Filters,
				"fields": entity.Fields,
			},
		}
		node.Children = append(node.Children, filterNode)
	}

	// Search bar
	if listView.Search != nil {
		searchNode := &ComponentNode{
			ID:   fmt.Sprintf("%s_search", entity.Name),
			Kind: KindSearchBar,
			Props: map[string]any{
				"config": listView.Search,
			},
		}
		node.Children = append(node.Children, searchNode)
	}

	// Actions
	if listView.Actions != nil {
		node.Props["actions"] = listView.Actions
	}
	if len(listView.BulkActions) > 0 {
		node.Props["bulk_actions"] = listView.BulkActions
	}

	// Empty state
	if listView.Empty != nil {
		emptyNode := &ComponentNode{
			ID:   fmt.Sprintf("%s_empty", entity.Name),
			Kind: KindEmptyState,
			Props: map[string]any{
				"config": listView.Empty,
			},
		}
		node.Children = append(node.Children, emptyNode)
	}

	return node
}

func (b *Builder) buildEntityDetail(entity *spec.Entity, route string) *ComponentNode {
	detailView := entity.Views.Detail

	node := &ComponentNode{
		ID:   fmt.Sprintf("%s_detail", entity.Name),
		Kind: KindEntityDetail,
		Props: map[string]any{
			"entity":        entity.Name,
			"api_resource":  entity.APIResource,
			"display_name":  entity.DisplayName,
			"label_field":   entity.LabelField,
			"status_field":  entity.StatusField,
			"fields":        entity.Fields,
			"state_machine": entity.StateMachine,
			"relationships": entity.Relationships,
		},
	}

	if detailView == nil {
		return node
	}

	node.Props["layout"] = detailView.Layout

	// Header
	if detailView.Header != nil {
		headerNode := &ComponentNode{
			ID:   fmt.Sprintf("%s_detail_header", entity.Name),
			Kind: KindDetailHeader,
			Props: map[string]any{
				"config":        detailView.Header,
				"state_machine": entity.StateMachine,
			},
		}
		node.Children = append(node.Children, headerNode)
	}

	// Tabs
	if len(detailView.Tabs) > 0 {
		tabLayout := &ComponentNode{
			ID:   fmt.Sprintf("%s_tabs", entity.Name),
			Kind: KindTabLayout,
		}
		for _, tab := range detailView.Tabs {
			tabNode := &ComponentNode{
				ID:   fmt.Sprintf("%s_tab_%s", entity.Name, tab.ID),
				Kind: KindTab,
				Props: map[string]any{
					"id":    tab.ID,
					"label": tab.Label,
					"icon":  tab.Icon,
				},
			}
			// Build sections within tab
			for _, section := range tab.Sections {
				sectionNode := b.buildDetailSection(entity, section)
				tabNode.Children = append(tabNode.Children, sectionNode)
			}
			if tab.Content != nil {
				tabNode.Props["content"] = tab.Content
			}
			tabLayout.Children = append(tabLayout.Children, tabNode)
		}
		node.Children = append(node.Children, tabLayout)
	}

	return node
}

func (b *Builder) buildDetailSection(entity *spec.Entity, section spec.DetailSection) *ComponentNode {
	sectionNode := &ComponentNode{
		ID:   fmt.Sprintf("%s_section_%s", entity.Name, section.Title),
		Kind: KindSection,
		Props: map[string]any{
			"title":  section.Title,
			"layout": section.Layout,
			"fields": section.Fields,
		},
	}
	if len(section.Permissions) > 0 {
		sectionNode.Conditions = []RenderCondition{{Type: "permission", Roles: section.Permissions}}
	}
	return sectionNode
}

func (b *Builder) buildCreateForm(entity *spec.Entity, route string) *ComponentNode {
	createView := entity.Views.Create

	if createView.Layout == "stepped" {
		return b.buildSteppedForm(entity, createView, route)
	}

	node := &ComponentNode{
		ID:   fmt.Sprintf("%s_create", entity.Name),
		Kind: KindCreateForm,
		Props: map[string]any{
			"entity":       entity.Name,
			"api_resource": entity.APIResource,
			"title":        createView.Title,
			"submit_label": createView.SubmitLabel,
			"cancel_path":  createView.CancelPath,
			"fields":       entity.Fields,
			"overrides":    createView.FieldOverrides,
		},
	}

	for _, section := range createView.Sections {
		sectionNode := &ComponentNode{
			Kind: KindFormSection,
			Props: map[string]any{
				"title":  section.Title,
				"fields": section.Fields,
			},
		}
		if len(section.Permissions) > 0 {
			sectionNode.Conditions = []RenderCondition{{Type: "permission", Roles: section.Permissions}}
		}
		node.Children = append(node.Children, sectionNode)
	}

	return node
}

func (b *Builder) buildSteppedForm(entity *spec.Entity, view *spec.FormView, route string) *ComponentNode {
	node := &ComponentNode{
		ID:   fmt.Sprintf("%s_create", entity.Name),
		Kind: KindSteppedForm,
		Props: map[string]any{
			"entity":       entity.Name,
			"api_resource": entity.APIResource,
			"title":        view.Title,
			"submit_label": view.SubmitLabel,
			"cancel_path":  view.CancelPath,
			"fields":       entity.Fields,
			"overrides":    view.FieldOverrides,
		},
	}

	for _, step := range view.Steps {
		stepNode := &ComponentNode{
			ID:   fmt.Sprintf("%s_step_%s", entity.Name, step.ID),
			Kind: KindFormStep,
			Props: map[string]any{
				"id":          step.ID,
				"title":       step.Title,
				"description": step.Description,
				"type":        step.Type,
				"fields":      step.Fields,
			},
		}
		node.Children = append(node.Children, stepNode)
	}

	return node
}

func (b *Builder) buildEditForm(entity *spec.Entity, route string) *ComponentNode {
	editView := entity.Views.Edit

	node := &ComponentNode{
		ID:   fmt.Sprintf("%s_edit", entity.Name),
		Kind: KindEditForm,
		Props: map[string]any{
			"entity":       entity.Name,
			"api_resource": entity.APIResource,
			"title":        editView.Title,
			"submit_label": editView.SubmitLabel,
			"fields":       entity.Fields,
		},
	}

	for _, section := range editView.Sections {
		sectionNode := &ComponentNode{
			Kind: KindFormSection,
			Props: map[string]any{
				"title":  section.Title,
				"fields": section.Fields,
			},
		}
		if len(section.Permissions) > 0 {
			sectionNode.Conditions = []RenderCondition{{Type: "permission", Roles: section.Permissions}}
		}
		node.Children = append(node.Children, sectionNode)
	}

	return node
}

func (b *Builder) buildCustomPage(page *spec.Page) *ComponentNode {
	node := &ComponentNode{
		ID:   fmt.Sprintf("page_%s", page.ID),
		Kind: KindCustomPage,
		Props: map[string]any{
			"id":    page.ID,
			"title": page.Title,
			"path":  page.Path,
		},
		Scope: &Scope{Page: page.ID, Route: page.Path},
	}

	if len(page.Permissions) > 0 {
		node.Conditions = []RenderCondition{{Type: "permission", Roles: page.Permissions}}
	}

	for _, widget := range page.Widgets {
		widgetNode := b.buildWidget(widget)
		node.Children = append(node.Children, widgetNode)
	}

	return node
}

func (b *Builder) buildWidget(widget spec.Widget) *ComponentNode {
	switch widget.Type {
	case "stat_cards":
		return &ComponentNode{
			Kind: KindStatCards,
			Props: map[string]any{
				"layout": widget.Layout,
				"cards":  widget.Cards,
			},
		}
	case "chart":
		return &ComponentNode{
			Kind: KindChart,
			Props: map[string]any{
				"title":        widget.Title,
				"chart_type":   widget.ChartType,
				"source":       widget.Source,
				"data_mapping": widget.DataMapping,
				"height":       widget.Height,
			},
		}
	case "entity_table":
		return &ComponentNode{
			Kind: KindEntityTableWidget,
			Props: map[string]any{
				"title":   widget.Title,
				"entity":  widget.Entity,
				"query":   widget.Query,
				"columns": widget.Columns,
				"link":    widget.Link,
				"actions": widget.Actions,
			},
		}
	default:
		return &ComponentNode{
			Kind: KindCustomPage,
			Props: map[string]any{
				"type":   widget.Type,
				"widget": widget,
			},
		}
	}
}
