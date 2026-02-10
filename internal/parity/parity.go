package parity

import (
	"fmt"
	"os"
	"regexp"
	"sort"
	"strings"

	"github.com/maraichr/GateHouse-ui/internal/engine"
)

type RuntimeReport struct {
	Name     string   `json:"name"`
	Kinds    []string `json:"kinds"`
	Missing  []string `json:"missing"`
	Extra    []string `json:"extra"`
	Blockers int      `json:"blockers"`
}

type Report struct {
	EngineKinds []string                 `json:"engine_kinds"`
	Runtimes    map[string]RuntimeReport `json:"runtimes"`
}

var indirectSupport = map[string]map[string]struct{}{
	"flutter": {
		"display_avatar":      {},
		"display_badge":       {},
		"display_currency":    {},
		"display_date":        {},
		"display_enum":        {},
		"display_star_rating": {},
		"display_string":      {},
		"field_address":       {},
		"field_currency":      {},
		"field_date":          {},
		"field_enum":          {},
		"field_reference":     {},
		"field_richtext":      {},
		"field_string":        {},
		"header":              {},
		"two_column":          {},
	},
}

var (
	reactKindPattern   = regexp.MustCompile(`(?m)^\s*([a-z_]+)\s*:`)
	flutterKindPattern = regexp.MustCompile(`(?m)^\s*'([a-z_]+)'\s*:`)
)

func BuildReport(reactRendererPath, flutterRendererPath string) (*Report, error) {
	engineKinds := make([]string, 0, len(engine.AllComponentKinds()))
	for _, kind := range engine.AllComponentKinds() {
		engineKinds = append(engineKinds, string(kind))
	}
	sort.Strings(engineKinds)

	reactKinds, err := extractKinds(reactRendererPath, reactKindPattern)
	if err != nil {
		return nil, fmt.Errorf("extracting react kinds: %w", err)
	}
	flutterKinds, err := extractKinds(flutterRendererPath, flutterKindPattern)
	if err != nil {
		return nil, fmt.Errorf("extracting flutter kinds: %w", err)
	}

	report := &Report{
		EngineKinds: engineKinds,
		Runtimes: map[string]RuntimeReport{
			"react":   buildRuntimeReport("react", engineKinds, reactKinds, nil),
			"flutter": buildRuntimeReport("flutter", engineKinds, flutterKinds, indirectSupport["flutter"]),
		},
	}
	return report, nil
}

func extractKinds(path string, pattern *regexp.Regexp) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", path, err)
	}
	matches := pattern.FindAllStringSubmatch(string(data), -1)
	seen := map[string]struct{}{}
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		k := strings.TrimSpace(m[1])
		if k == "" {
			continue
		}
		seen[k] = struct{}{}
	}
	kinds := make([]string, 0, len(seen))
	for k := range seen {
		kinds = append(kinds, k)
	}
	sort.Strings(kinds)
	return kinds, nil
}

func buildRuntimeReport(name string, engineKinds, runtimeKinds []string, indirect map[string]struct{}) RuntimeReport {
	engineSet := make(map[string]struct{}, len(engineKinds))
	for _, k := range engineKinds {
		engineSet[k] = struct{}{}
	}
	runtimeSet := make(map[string]struct{}, len(runtimeKinds))
	for _, k := range runtimeKinds {
		runtimeSet[k] = struct{}{}
	}

	missing := make([]string, 0)
	for _, k := range engineKinds {
		if _, ok := runtimeSet[k]; !ok {
			if _, ok := indirect[k]; ok {
				continue
			}
			missing = append(missing, k)
		}
	}

	extra := make([]string, 0)
	for _, k := range runtimeKinds {
		if _, ok := engineSet[k]; !ok {
			extra = append(extra, k)
		}
	}
	sort.Strings(missing)
	sort.Strings(extra)

	return RuntimeReport{
		Name:     name,
		Kinds:    runtimeKinds,
		Missing:  missing,
		Extra:    extra,
		Blockers: len(missing),
	}
}
