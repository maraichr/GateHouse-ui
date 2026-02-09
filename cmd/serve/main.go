package main

import (
	"flag"
	"log"
	"log/slog"
	"os"

	"github.com/maraichr/GateHouse-ui/internal/serve"
)

func main() {
	specPath := flag.String("spec", "", "Path to the UI spec YAML file")
	apiURL := flag.String("api-url", "", "Backend API URL to proxy")
	dataPath := flag.String("data", "", "Path to mock data JSON file")
	examplesDir := flag.String("examples-dir", "", "Directory containing example subdirs (each with spec.yaml + data.json)")
	composeFile := flag.String("compose", "", "Path to composition config YAML (multi-service mode)")
	databaseURL := flag.String("database", "", "PostgreSQL connection URL (enables spec reviewer)")
	port := flag.Int("port", 3000, "Port to serve on")
	watch := flag.Bool("watch", false, "Watch spec file for changes")
	target := flag.String("target", "react", "Renderer target (react|flutter)")
	flag.Parse()

	// Allow DATABASE_URL env var as fallback
	if *databaseURL == "" {
		*databaseURL = os.Getenv("DATABASE_URL")
	}

	if *specPath == "" && *examplesDir == "" && *composeFile == "" && *databaseURL == "" {
		log.Fatal("--spec, --examples-dir, --compose, or --database flag is required")
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = "admin@gatehouse.local"
	}

	cfg := serve.Config{
		SpecPath:    *specPath,
		APIBaseURL:  *apiURL,
		DataPath:    *dataPath,
		ExamplesDir: *examplesDir,
		ComposeFile: *composeFile,
		DatabaseURL: *databaseURL,
		AdminEmail:  adminEmail,
		Port:        *port,
		Watch:       *watch,
		Target:      *target,
	}

	srv, err := serve.NewServer(cfg)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	slog.Info("GateHouse UI Renderer", "mode", "serve")
	if err := srv.Start(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
