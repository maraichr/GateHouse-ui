package serve

import (
	"log/slog"
	"time"

	"github.com/fsnotify/fsnotify"
)

func (s *Server) watchSpec() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		slog.Error("failed to create watcher", "error", err)
		return
	}
	defer watcher.Close()

	if err := watcher.Add(s.specPath); err != nil {
		slog.Error("failed to watch spec", "path", s.specPath, "error", err)
		return
	}

	slog.Info("watching spec for changes", "path", s.specPath)

	var debounce *time.Timer
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if event.Op&(fsnotify.Write|fsnotify.Create) != 0 {
				if debounce != nil {
					debounce.Stop()
				}
				debounce = time.AfterFunc(200*time.Millisecond, func() {
					slog.Info("spec changed, reloading...")
					if err := s.loadSpec(); err != nil {
						slog.Error("reload failed", "error", err)
						s.sseHub.Broadcast(SSEEvent{
							Type: "error",
							Data: map[string]string{"message": err.Error()},
						})
					} else {
						slog.Info("spec reloaded successfully")
						s.sseHub.Broadcast(SSEEvent{
							Type: "reload",
							Data: map[string]string{"message": "spec updated"},
						})
					}
				})
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			slog.Error("watcher error", "error", err)
		}
	}
}

// watchComposed watches all local spec files in a composition config and recomposes on change.
func (s *Server) watchComposed() {
	if s.aggregator == nil {
		return
	}

	paths := s.aggregator.Config.LocalSpecPaths()
	if len(paths) == 0 {
		slog.Info("no local spec paths to watch in composed mode")
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		slog.Error("failed to create composed watcher", "error", err)
		return
	}
	defer watcher.Close()

	for _, p := range paths {
		if err := watcher.Add(p); err != nil {
			slog.Warn("failed to watch composed spec", "path", p, "error", err)
		}
	}

	slog.Info("watching composed specs for changes", "paths", paths)

	var debounce *time.Timer
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if event.Op&(fsnotify.Write|fsnotify.Create) != 0 {
				if debounce != nil {
					debounce.Stop()
				}
				debounce = time.AfterFunc(300*time.Millisecond, func() {
					slog.Info("composed spec changed, recomposing...", "file", event.Name)
					s.recompose()
				})
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			slog.Error("composed watcher error", "error", err)
		}
	}
}
