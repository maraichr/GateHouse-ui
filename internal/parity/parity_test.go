package parity

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBuildReport(t *testing.T) {
	dir := t.TempDir()

	reactPath := filepath.Join(dir, "renderer.tsx")
	flutterPath := filepath.Join(dir, "renderer.dart")

	if err := os.WriteFile(reactPath, []byte(`
const COMPONENT_MAP = {
  app_shell: AppShell,
  sidebar: Sidebar,
};
`), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(flutterPath, []byte(`
final componentMap = {
  'app_shell': (node, _, children) => AppShellWidget(),
};
`), 0o644); err != nil {
		t.Fatal(err)
	}

	report, err := BuildReport(reactPath, flutterPath)
	if err != nil {
		t.Fatalf("BuildReport failed: %v", err)
	}
	if report.Runtimes["react"].Blockers == 0 {
		t.Fatalf("expected react blockers in reduced fixture")
	}
	if report.Runtimes["flutter"].Blockers == 0 {
		t.Fatalf("expected flutter blockers in reduced fixture")
	}
}
