package store

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
)

// TimeToFirstSpecKPI tracks time from project creation to first published version.
type TimeToFirstSpecKPI struct {
	ProjectsWithVersion int     `json:"projects_with_version"`
	AverageMinutes      float64 `json:"average_minutes"`
	P50Minutes          float64 `json:"p50_minutes"`
	P90Minutes          float64 `json:"p90_minutes"`
}

type specLeadTimeRow struct {
	SpecCreatedAt time.Time `db:"spec_created_at"`
	FirstVersion  time.Time `db:"first_version_at"`
}

// GetTimeToFirstSpecKPI calculates creation-to-first-version lead time across projects.
func (db *DB) GetTimeToFirstSpecKPI(ctx context.Context) (*TimeToFirstSpecKPI, error) {
	rows, _ := db.Pool.Query(ctx, `
		SELECT
			s.created_at AS spec_created_at,
			MIN(v.created_at) AS first_version_at
		FROM specs s
		JOIN spec_versions v ON v.spec_id = s.id
		GROUP BY s.id, s.created_at
	`)
	data, err := pgx.CollectRows(rows, pgx.RowToStructByName[specLeadTimeRow])
	if err != nil {
		return nil, fmt.Errorf("querying time-to-first-spec KPI: %w", err)
	}

	durations := make([]float64, 0, len(data))
	for _, row := range data {
		mins := row.FirstVersion.Sub(row.SpecCreatedAt).Minutes()
		if mins < 0 {
			continue
		}
		durations = append(durations, mins)
	}
	if len(durations) == 0 {
		return &TimeToFirstSpecKPI{}, nil
	}

	sort.Float64s(durations)
	var sum float64
	for _, d := range durations {
		sum += d
	}

	return &TimeToFirstSpecKPI{
		ProjectsWithVersion: len(durations),
		AverageMinutes:      sum / float64(len(durations)),
		P50Minutes:          percentileSorted(durations, 50),
		P90Minutes:          percentileSorted(durations, 90),
	}, nil
}

func percentileSorted(values []float64, p int) float64 {
	if len(values) == 0 {
		return 0
	}
	if p <= 0 {
		return values[0]
	}
	if p >= 100 {
		return values[len(values)-1]
	}
	idx := int(float64(len(values)-1) * (float64(p) / 100.0))
	return values[idx]
}
