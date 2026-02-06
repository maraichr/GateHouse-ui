package main

import (
	"flag"
	"log"
	"log/slog"

	"github.com/maraichr/GateHouse-ui/internal/serve"
)

func main() {
	specPath := flag.String("spec", "", "Path to the UI spec YAML file")
	apiURL := flag.String("api-url", "", "Backend API URL to proxy")
	port := flag.Int("port", 3000, "Port to serve on")
	watch := flag.Bool("watch", false, "Watch spec file for changes")
	flag.Parse()

	if *specPath == "" {
		log.Fatal("--spec flag is required")
	}

	cfg := serve.Config{
		SpecPath:   *specPath,
		APIBaseURL: *apiURL,
		Port:       *port,
		Watch:      *watch,
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
