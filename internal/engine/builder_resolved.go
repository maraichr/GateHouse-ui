package engine

import (
	"fmt"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

func BuildResolvedTree(resolved *spec.ResolvedSpec) (*ComponentTree, error) {
	index := make(map[string]*spec.ResolvedNode)
	if err := registerResolvedNode(index, &resolved.Layout.Root); err != nil {
		return nil, err
	}
	for key, node := range resolved.Layout.Nodes {
		if node.ID == "" {
			node.ID = key
		}
		if node.Kind == "" {
			node.Kind = "page"
		}
		if err := registerResolvedNode(index, &node); err != nil {
			return nil, err
		}
	}
	for key, node := range resolved.Nodes {
		if node.ID == "" {
			node.ID = key
		}
		if node.Kind == "" {
			node.Kind = "page"
		}
		if err := registerResolvedNode(index, &node); err != nil {
			return nil, err
		}
	}

	routeMap := make(map[string]string)
	for _, route := range resolved.Routes {
		if route.Node == "" || route.Path == "" {
			continue
		}
		routeMap[route.Node] = route.Path
	}

	entityNames := make([]string, 0, len(resolved.Entities))
	for name := range resolved.Entities {
		entityNames = append(entityNames, name)
	}

	normalizedEntities := normalizeEntities(resolved.Entities)

	cache := make(map[string]*ComponentNode)
	var build func(node *spec.ResolvedNode, stack map[string]bool) (*ComponentNode, error)
	build = func(node *spec.ResolvedNode, stack map[string]bool) (*ComponentNode, error) {
		if node == nil {
			return nil, fmt.Errorf("nil node")
		}
		if node.ID == "" {
			return nil, fmt.Errorf("node missing id for kind %q", node.Kind)
		}
		if existing, ok := cache[node.ID]; ok {
			return existing, nil
		}
		if stack[node.ID] {
			return nil, fmt.Errorf("cycle detected at node %q", node.ID)
		}
		stack[node.ID] = true
		kind := normalizeKind(node.Kind)
		props := cloneMap(node.Props)
		scope := normalizeScope(node.Scope, routeMap[node.ID])
		normalizeConditions(node, &props)
		normalizeNodeProps(kind, scope, props, normalizedEntities)

		component := &ComponentNode{
			ID:         node.ID,
			Kind:       ComponentKind(kind),
			Props:      props,
			Scope:      scope,
			Conditions: normalizeNodeConditions(node.Conditions),
		}

		for _, child := range node.Children {
			var childNode *spec.ResolvedNode
			if child.Node != nil {
				childNode = child.Node
			} else if child.Ref != "" {
				var ok bool
				childNode, ok = index[child.Ref]
				if !ok {
					continue
				}
			}
			if childNode != nil {
				builtChild, err := build(childNode, stack)
				if err != nil {
					return nil, err
				}
				component.Children = append(component.Children, builtChild)
			}
		}

		cache[node.ID] = component
		delete(stack, node.ID)
		return component, nil
	}

	rootNode := resolved.Layout.Root
	rootNode.Props = mergeRootProps(rootNode.Props, resolved)
	root, err := build(&rootNode, map[string]bool{})
	if err != nil {
		return nil, err
	}

	childIDs := make(map[string]bool)
	for _, child := range root.Children {
		if child.ID != "" {
			childIDs[child.ID] = true
		}
	}
	for nodeID := range routeMap {
		if childIDs[nodeID] {
			continue
		}
		nodeSpec := index[nodeID]
		if nodeSpec == nil {
			continue
		}
		routedNode, err := build(nodeSpec, map[string]bool{})
		if err != nil {
			return nil, err
		}
		root.Children = append(root.Children, routedNode)
		childIDs[nodeID] = true
	}

	return &ComponentTree{
		Root: root,
		Metadata: TreeMetadata{
			AppName:    resolved.Metadata.AppName,
			Version:    resolved.Metadata.Version,
			Entities:   entityNames,
			RouteCount: len(resolved.Routes),
		},
	}, nil
}

func registerResolvedNode(index map[string]*spec.ResolvedNode, node *spec.ResolvedNode) error {
	if node == nil {
		return nil
	}
	if node.ID == "" {
		return fmt.Errorf("resolved node missing id for kind %q", node.Kind)
	}
	if _, exists := index[node.ID]; !exists {
		index[node.ID] = node
	}
	for _, child := range node.Children {
		if child.Node != nil {
			if err := registerResolvedNode(index, child.Node); err != nil {
				return err
			}
		}
	}
	return nil
}

func normalizeKind(kind string) string {
	switch kind {
	case "data_view":
		return string(KindDataTable)
	default:
		return kind
	}
}

func normalizeScope(scope *spec.ResolvedNodeScope, route string) *Scope {
	if scope == nil && route == "" {
		return nil
	}
	normalized := &Scope{}
	if scope != nil {
		normalized.Entity = scope.Entity
		normalized.Page = scope.Page
	}
	if route != "" {
		normalized.Route = route
	}
	return normalized
}

func normalizeNodeConditions(conditions []spec.ResolvedCondition) []RenderCondition {
	if len(conditions) == 0 {
		return nil
	}
	normalized := make([]RenderCondition, 0, len(conditions))
	for _, cond := range conditions {
		condType := cond.Type
		if condType == "role" {
			condType = "permission"
		}
		normalized = append(normalized, RenderCondition{
			Type:  condType,
			Roles: cond.Roles,
		})
	}
	return normalized
}

func normalizeConditions(node *spec.ResolvedNode, props *map[string]any) {
	if node == nil {
		return
	}
	for i := range node.Conditions {
		if node.Conditions[i].Type == "role" {
			node.Conditions[i].Type = "permission"
		}
	}
	if props == nil {
		return
	}
}

func normalizeNodeProps(kind string, scope *Scope, props map[string]any, entities map[string]spec.ResolvedEntity) {
	if props == nil {
		return
	}

	if scope != nil && scope.Entity != "" {
		if entity, ok := entities[scope.Entity]; ok {
			switch kind {
			case string(KindEntityDetail):
				props["fields"] = entity.Fields
				props["state_machine"] = entity.StateMachine
				props["relationships"] = entity.Relationships
				if _, ok := props["label_field"]; !ok && entity.LabelField != "" {
					props["label_field"] = entity.LabelField
				}
			case string(KindEntityList):
				if _, ok := props["label_field"]; !ok && entity.LabelField != "" {
					props["label_field"] = entity.LabelField
				}
			case string(KindDataTable):
				if _, ok := props["fields"]; !ok {
					props["fields"] = entity.Fields
				}
			}
		}
	}

	switch kind {
	case string(KindEntityList):
		props["actions"] = normalizeActionConfig(props["actions"])
		props["bulk_actions"] = normalizeActionList(props["bulk_actions"])
	case string(KindDataTable):
		props["columns"] = normalizeColumns(props["columns"])
	case string(KindDetailHeader):
		props["config"] = normalizeDetailHeaderConfig(props["config"])
	case string(KindFilterPanel):
		props["config"] = normalizeFilterConfig(props["config"])
	}
}

func normalizeEntities(entities map[string]spec.ResolvedEntity) map[string]spec.ResolvedEntity {
	if entities == nil {
		return nil
	}
	normalized := make(map[string]spec.ResolvedEntity, len(entities))
	for name, entity := range entities {
		entity.Fields = normalizeFields(entity.Fields)
		entity.StateMachine = normalizeStateMachine(entity.StateMachine)
		normalized[name] = entity
	}
	return normalized
}

func normalizeActionConfig(actions any) any {
	actionMap, ok := actions.(map[string]any)
	if !ok {
		return actions
	}
	for _, key := range []string{"primary", "secondary", "row"} {
		if list, ok := actionMap[key]; ok {
			actionMap[key] = normalizeActionList(list)
		}
	}
	return actionMap
}

func normalizeActionList(actions any) any {
	list, ok := actions.([]any)
	if !ok {
		return actions
	}
	for _, item := range list {
		action, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if invoke, ok := action["invoke"]; ok {
			action["action"] = invoke
			delete(action, "invoke")
		}
		if visibility, ok := action["visibility"].(map[string]any); ok {
			if roles, ok := visibility["roles"]; ok {
				action["permissions"] = roles
			}
			delete(action, "visibility")
		}
		if confirm, ok := action["confirm"]; ok {
			action["confirmation"] = confirm
			delete(action, "confirm")
		}
	}
	return list
}

func normalizeColumns(columns any) any {
	list, ok := columns.([]any)
	if !ok {
		return columns
	}
	for _, item := range list {
		col, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if linkTo, ok := col["link_to"].(map[string]any); ok {
			if linkType, ok := linkTo["type"].(string); ok && linkType == "route" {
				col["link_to"] = "detail"
			}
		}
	}
	return list
}

func normalizeDetailHeaderConfig(config any) any {
	cfg, ok := config.(map[string]any)
	if !ok {
		return config
	}
	if titleTpl, ok := cfg["title_tpl"]; ok {
		cfg["title"] = titleTpl
		delete(cfg, "title_tpl")
	}
	if subtitleTpl, ok := cfg["subtitle_tpl"]; ok {
		cfg["subtitle"] = subtitleTpl
		delete(cfg, "subtitle_tpl")
	}
	if avatarExpr, ok := cfg["avatar_expr"].(map[string]any); ok {
		if ref, ok := avatarExpr["ref"].(string); ok {
			cfg["avatar"] = fmt.Sprintf("{{%s}}", ref)
		}
		delete(cfg, "avatar_expr")
	}
	if stats, ok := cfg["stats"].([]any); ok {
		for _, item := range stats {
			stat, ok := item.(map[string]any)
			if !ok {
				continue
			}
			if valueExpr, ok := stat["value_expr"].(map[string]any); ok {
				if ref, ok := valueExpr["ref"].(string); ok {
					stat["value"] = fmt.Sprintf("{{%s}}", ref)
				}
				delete(stat, "value_expr")
			}
			if visibility, ok := stat["visibility"].(map[string]any); ok {
				if roles, ok := visibility["roles"]; ok {
					stat["permissions"] = roles
				}
				delete(stat, "visibility")
			}
		}
	}
	return cfg
}

func normalizeFilterConfig(config any) any {
	cfg, ok := config.(map[string]any)
	if !ok {
		return config
	}
	if layout, ok := cfg["layout"].(map[string]any); ok {
		if webLayout, ok := layout["web"]; ok {
			cfg["layout"] = webLayout
		}
	}
	return cfg
}

func normalizeFields(fields []map[string]any) []map[string]any {
	if len(fields) == 0 {
		return fields
	}
	normalized := make([]map[string]any, 0, len(fields))
	for _, field := range fields {
		fieldCopy := cloneMap(field)
		if rules, ok := fieldCopy["display_rules"].([]any); ok {
			fieldCopy["display_rules"] = normalizeDisplayRules(rules)
		}
		normalized = append(normalized, fieldCopy)
	}
	return normalized
}

func normalizeDisplayRules(rules []any) []any {
	normalized := make([]any, 0, len(rules))
	for _, item := range rules {
		rule, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if when, ok := rule["when"].(map[string]any); ok {
			if condition, ok := conditionFromWhen(when); ok {
				rule["condition"] = condition
			}
			delete(rule, "when")
		}
		normalized = append(normalized, rule)
	}
	return normalized
}

func conditionFromWhen(when map[string]any) (string, bool) {
	op, ok := when["op"].(string)
	if !ok || op == "" {
		return "", false
	}
	lhs := renderExprSide(when["lhs"])
	rhs := renderExprSide(when["rhs"])
	if lhs == "" || rhs == "" {
		return "", false
	}
	return fmt.Sprintf("%s %s %s", lhs, op, rhs), true
}

func renderExprSide(side any) string {
	switch value := side.(type) {
	case map[string]any:
		if ref, ok := value["ref"].(string); ok {
			return ref
		}
		if dateMath, ok := value["date_math"].(string); ok {
			return dateMath
		}
	case string:
		return value
	}
	return ""
}

func normalizeStateMachine(stateMachine map[string]any) map[string]any {
	if stateMachine == nil {
		return nil
	}
	normalized := cloneMap(stateMachine)
	if transitions, ok := normalized["transitions"].([]any); ok {
		for _, item := range transitions {
			transition, ok := item.(map[string]any)
			if !ok {
				continue
			}
			if confirm, ok := transition["confirm"]; ok {
				transition["confirmation"] = normalizeConfirmation(confirm)
				delete(transition, "confirm")
			}
			if visibility, ok := transition["visibility"].(map[string]any); ok {
				if roles, ok := visibility["roles"]; ok {
					transition["permissions"] = roles
				}
				delete(transition, "visibility")
			}
			if guards, ok := transition["guards"].([]any); ok {
				transition["guards"] = normalizeGuards(guards)
			}
			if form, ok := transition["form"].(map[string]any); ok {
				if fields, ok := form["fields"].([]any); ok {
					transition["form"] = normalizeTransitionFields(fields)
				}
			}
		}
	}
	return normalized
}

func normalizeConfirmation(confirm any) any {
	confirmation, ok := confirm.(map[string]any)
	if !ok {
		return confirm
	}
	if msgTpl, ok := confirmation["message_tpl"]; ok {
		confirmation["message"] = msgTpl
		delete(confirmation, "message_tpl")
	}
	return confirmation
}

func normalizeGuards(guards []any) []any {
	for _, item := range guards {
		guard, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if guardType, ok := guard["type"].(string); ok {
			switch guardType {
			case "field_check":
				if expr, ok := guard["expr"].(map[string]any); ok {
					if lhs, ok := expr["lhs"].(map[string]any); ok {
						if ref, ok := lhs["ref"].(string); ok {
							guard["field_check"] = stripRecordPrefix(ref)
						}
					}
					delete(guard, "expr")
				}
			case "api_check":
				guard["type"] = "role_check"
			}
		}
	}
	return guards
}

func normalizeTransitionFields(fields []any) []any {
	normalized := make([]any, 0, len(fields))
	for _, item := range fields {
		field, ok := item.(map[string]any)
		if !ok {
			continue
		}
		if label, ok := field["display_name"]; ok {
			field["label"] = label
			delete(field, "display_name")
		}
		normalized = append(normalized, field)
	}
	return normalized
}

func mergeRootProps(props map[string]any, resolved *spec.ResolvedSpec) map[string]any {
	merged := cloneMap(props)
	if resolved == nil {
		return merged
	}
	if resolved.App.AppName != "" {
		merged["app_name"] = resolved.App.AppName
	}
	if resolved.App.Theme.Mode != "" || resolved.App.Theme.PrimaryColor != "" {
		merged["theme"] = resolved.App.Theme
	}
	if resolved.App.Auth.Provider != "" {
		merged["auth"] = resolved.App.Auth
	}
	if resolved.App.API.BaseURL != "" {
		merged["api"] = resolved.App.API
	}
	if resolved.App.Behaviors.Notifications.Position != "" {
		merged["behaviors"] = resolved.App.Behaviors
	}
	if resolved.App.Accessibility.AriaLabels != "" {
		merged["accessibility"] = resolved.App.Accessibility
	}
	return merged
}

func cloneMap(input map[string]any) map[string]any {
	if input == nil {
		return map[string]any{}
	}
	clone := make(map[string]any, len(input))
	for key, value := range input {
		clone[key] = value
	}
	return clone
}

func stripRecordPrefix(ref string) string {
	if len(ref) >= 7 && ref[:7] == "record." {
		return ref[7:]
	}
	return ref
}
