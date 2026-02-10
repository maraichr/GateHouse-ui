package engine

// SupportLevel describes renderer support for a component kind.
type SupportLevel string

const (
	SupportSupported       SupportLevel = "supported"
	SupportHandledByParent SupportLevel = "handled_by_parent"
	SupportPlaceholder     SupportLevel = "placeholder"
	SupportMissing         SupportLevel = "missing"
)

// RendererCapability summarizes support for one component kind on one runtime.
type RendererCapability struct {
	Kind  string       `json:"kind"`
	Level SupportLevel `json:"level"`
	Notes string       `json:"notes,omitempty"`
}

// RendererSummary aggregates capability health for one runtime.
type RendererSummary struct {
	Name      string               `json:"name"`
	Total     int                  `json:"total"`
	Supported int                  `json:"supported"`
	Warnings  int                  `json:"warnings"`
	Blockers  int                  `json:"blockers"`
	Items     []RendererCapability `json:"items"`
}

// CapabilitiesReport is used by /_renderer/capabilities and parity checks.
type CapabilitiesReport struct {
	EngineKinds []string                     `json:"engine_kinds"`
	Renderers   map[string]RendererSummary   `json:"renderers"`
	Matrix      map[string]map[string]string `json:"matrix"` // kind -> renderer -> level
}

var flutterOverrides = map[ComponentKind]RendererCapability{
	KindFilterPanel: {
		Kind:  string(KindFilterPanel),
		Level: SupportHandledByParent,
		Notes: "EntityListWidget integrates filter UI directly.",
	},
	KindSearchBar: {
		Kind:  string(KindSearchBar),
		Level: SupportHandledByParent,
		Notes: "EntityListWidget integrates search UI directly.",
	},
	KindFormStep: {
		Kind:  string(KindFormStep),
		Level: SupportHandledByParent,
		Notes: "Step rendering is managed by SteppedFormWidget.",
	},
	KindFormSection: {
		Kind:  string(KindFormSection),
		Level: SupportHandledByParent,
		Notes: "Section rendering is managed by form widgets.",
	},
}

// BuildCapabilitiesReport returns a canonical parity matrix for renderer runtimes.
func BuildCapabilitiesReport() CapabilitiesReport {
	kinds := AllComponentKinds()
	engineKinds := make([]string, 0, len(kinds))
	matrix := make(map[string]map[string]string, len(kinds))

	react := RendererSummary{Name: "react"}
	flutter := RendererSummary{Name: "flutter"}

	for _, kind := range kinds {
		kindName := string(kind)
		engineKinds = append(engineKinds, kindName)

		reactCap := RendererCapability{
			Kind:  kindName,
			Level: SupportSupported,
		}
		flutterCap := RendererCapability{
			Kind:  kindName,
			Level: SupportSupported,
		}
		if ov, ok := flutterOverrides[kind]; ok {
			flutterCap = ov
		}

		react.Items = append(react.Items, reactCap)
		flutter.Items = append(flutter.Items, flutterCap)

		matrix[kindName] = map[string]string{
			"react":   string(reactCap.Level),
			"flutter": string(flutterCap.Level),
		}
	}

	finalizeSummary := func(summary *RendererSummary) {
		summary.Total = len(summary.Items)
		for _, item := range summary.Items {
			switch item.Level {
			case SupportSupported:
				summary.Supported++
			case SupportHandledByParent:
				summary.Supported++
				summary.Warnings++
			case SupportPlaceholder:
				summary.Warnings++
				summary.Blockers++
			case SupportMissing:
				summary.Blockers++
			}
		}
	}

	finalizeSummary(&react)
	finalizeSummary(&flutter)

	return CapabilitiesReport{
		EngineKinds: engineKinds,
		Renderers: map[string]RendererSummary{
			"react":   react,
			"flutter": flutter,
		},
		Matrix: matrix,
	}
}
