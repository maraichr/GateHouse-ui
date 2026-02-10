package engine

import "testing"

func TestBuildCapabilitiesReportIncludesAllKinds(t *testing.T) {
	report := BuildCapabilitiesReport()
	if len(report.EngineKinds) != len(AllComponentKinds()) {
		t.Fatalf("engine kinds mismatch: got %d want %d", len(report.EngineKinds), len(AllComponentKinds()))
	}

	react := report.Renderers["react"]
	flutter := report.Renderers["flutter"]
	if react.Total == 0 || flutter.Total == 0 {
		t.Fatalf("expected non-empty renderer summaries")
	}
	if react.Blockers != 0 {
		t.Fatalf("react blockers should be zero, got %d", react.Blockers)
	}
	if flutter.Blockers != 0 {
		t.Fatalf("flutter blockers should be zero, got %d", flutter.Blockers)
	}
}
