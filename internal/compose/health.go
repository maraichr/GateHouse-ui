package compose

import (
	"context"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// HealthChecker periodically polls remote services and triggers recomposition
// when a service's health status changes.
type HealthChecker struct {
	aggregator *Aggregator
	interval   time.Duration
	timeout    time.Duration
	onChange   func() // called when health state changes (triggers recompose + SSE)
	cancel     context.CancelFunc
	wg         sync.WaitGroup
}

// NewHealthChecker creates a health checker that polls remote services.
func NewHealthChecker(agg *Aggregator, onChange func()) *HealthChecker {
	return &HealthChecker{
		aggregator: agg,
		interval:   30 * time.Second,
		timeout:    5 * time.Second,
		onChange:   onChange,
	}
}

// Start begins background health polling. Call Stop() to terminate.
func (hc *HealthChecker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	hc.cancel = cancel
	hc.wg.Add(1)

	go func() {
		defer hc.wg.Done()
		ticker := time.NewTicker(hc.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				hc.checkAll()
			}
		}
	}()

	slog.Info("health checker started", "interval", hc.interval, "services", len(hc.aggregator.Services))
}

// Stop terminates the health checker goroutine.
func (hc *HealthChecker) Stop() {
	if hc.cancel != nil {
		hc.cancel()
		hc.wg.Wait()
	}
}

func (hc *HealthChecker) checkAll() {
	changed := false

	for _, state := range hc.aggregator.Services {
		if state.Source.SpecURL == "" {
			continue // local-only service, no health check needed
		}

		healthURL := state.Source.HealthURL
		if healthURL == "" {
			// Default: check the spec URL itself
			healthURL = state.Source.SpecURL
		}

		healthy := hc.probe(healthURL)
		if healthy != state.Healthy {
			slog.Info("service health changed",
				"service", state.Source.Name,
				"was_healthy", state.Healthy,
				"now_healthy", healthy,
			)
			state.Healthy = healthy
			changed = true
		}
	}

	if changed && hc.onChange != nil {
		hc.onChange()
	}
}

func (hc *HealthChecker) probe(url string) bool {
	client := &http.Client{Timeout: hc.timeout}
	resp, err := client.Get(url)
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode >= 200 && resp.StatusCode < 400
}
