package spec

type A11yConfig struct {
	AriaLabels         string             `yaml:"aria_labels" json:"aria_labels,omitempty"`
	KeyboardNavigation bool               `yaml:"keyboard_navigation" json:"keyboard_navigation"`
	FocusManagement    bool               `yaml:"focus_management" json:"focus_management"`
	ScreenReader       ScreenReaderConfig `yaml:"screen_reader" json:"screen_reader,omitempty"`
	ColorContrast      string             `yaml:"color_contrast" json:"color_contrast,omitempty"`
	ReducedMotion      string             `yaml:"reduced_motion" json:"reduced_motion,omitempty"`
}

type ScreenReaderConfig struct {
	AnnouncePageChanges    bool `yaml:"announce_page_changes" json:"announce_page_changes"`
	AnnounceNotifications  bool `yaml:"announce_notifications" json:"announce_notifications"`
}
