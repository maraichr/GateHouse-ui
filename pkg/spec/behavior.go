package spec

type BehaviorConfig struct {
	Notifications     NotificationConfig `yaml:"notifications" json:"notifications,omitempty"`
	DirtyForm         DirtyFormConfig    `yaml:"dirty_form" json:"dirty_form,omitempty"`
	Shortcuts         ShortcutConfig     `yaml:"shortcuts" json:"shortcuts,omitempty"`
	Realtime          RealtimeConfig     `yaml:"realtime" json:"realtime,omitempty"`
	OptimisticUpdates OptimisticConfig   `yaml:"optimistic_updates" json:"optimistic_updates,omitempty"`
	Offline           OfflineConfig      `yaml:"offline" json:"offline,omitempty"`
}

type NotificationConfig struct {
	Position     string `yaml:"position" json:"position"`
	DurationMs   int    `yaml:"duration_ms" json:"duration_ms"`
	OnCreate     string `yaml:"on_create" json:"on_create,omitempty"`
	OnUpdate     string `yaml:"on_update" json:"on_update,omitempty"`
	OnDelete     string `yaml:"on_delete" json:"on_delete,omitempty"`
	OnTransition string `yaml:"on_transition" json:"on_transition,omitempty"`
	OnError      string `yaml:"on_error" json:"on_error,omitempty"`
}

type DirtyFormConfig struct {
	Enabled bool   `yaml:"enabled" json:"enabled"`
	Message string `yaml:"message" json:"message,omitempty"`
}

type ShortcutConfig struct {
	Global       []Shortcut `yaml:"global" json:"global,omitempty"`
	EntityDetail []Shortcut `yaml:"entity_detail" json:"entity_detail,omitempty"`
}

type Shortcut struct {
	Key     string `yaml:"key" json:"key"`
	Action  string `yaml:"action" json:"action"`
	Context string `yaml:"context" json:"context,omitempty"`
}

type RealtimeConfig struct {
	Enabled       bool           `yaml:"enabled" json:"enabled"`
	Provider      string         `yaml:"provider" json:"provider,omitempty"`
	Endpoint      string         `yaml:"endpoint" json:"endpoint,omitempty"`
	Subscriptions []Subscription `yaml:"subscriptions" json:"subscriptions,omitempty"`
}

type Subscription struct {
	Event  string `yaml:"event" json:"event"`
	Action string `yaml:"action" json:"action"`
}

type OptimisticConfig struct {
	Enabled         bool `yaml:"enabled" json:"enabled"`
	RollbackOnError bool `yaml:"rollback_on_error" json:"rollback_on_error"`
}

type OfflineConfig struct {
	Enabled       bool   `yaml:"enabled" json:"enabled"`
	CacheStrategy string `yaml:"cache_strategy" json:"cache_strategy,omitempty"`
}
