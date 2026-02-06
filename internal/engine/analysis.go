package engine

import (
	"fmt"
	"strings"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

type Analysis struct {
	EntityIndex map[string]*spec.Entity
	FieldIndex  map[string]map[string]*spec.Field
	RouteTable  map[string]RouteEntry
}

type RouteEntry struct {
	Entity     string
	ListPath   string
	DetailPath string
	CreatePath string
	EditPath   string
}

func Analyze(appSpec *spec.AppSpec) *Analysis {
	a := &Analysis{
		EntityIndex: make(map[string]*spec.Entity),
		FieldIndex:  make(map[string]map[string]*spec.Field),
		RouteTable:  make(map[string]RouteEntry),
	}

	for i := range appSpec.Entities {
		entity := &appSpec.Entities[i]
		a.EntityIndex[entity.Name] = entity

		fIdx := make(map[string]*spec.Field)
		for j := range entity.Fields {
			fIdx[entity.Fields[j].Name] = &entity.Fields[j]
		}
		a.FieldIndex[entity.Name] = fIdx

		basePath := toKebab(entity.APIResource)
		a.RouteTable[entity.Name] = RouteEntry{
			Entity:     entity.Name,
			ListPath:   basePath,
			DetailPath: fmt.Sprintf("%s/:id", basePath),
			CreatePath: fmt.Sprintf("%s/new", basePath),
			EditPath:   fmt.Sprintf("%s/:id/edit", basePath),
		}
	}

	return a
}

func toKebab(s string) string {
	s = strings.TrimPrefix(s, "/")
	return "/" + strings.ReplaceAll(strings.ToLower(s), "_", "-")
}
