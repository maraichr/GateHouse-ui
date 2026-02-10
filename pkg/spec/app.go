package spec

type AppSpec struct {
	App           AppMeta          `yaml:"app" json:"app"`
	Studio        *StudioConfig    `yaml:"studio" json:"studio,omitempty"`
	Auth          AuthConfig       `yaml:"auth" json:"auth"`
	API           APIConfig        `yaml:"api" json:"api"`
	Shell         ShellConfig      `yaml:"shell" json:"shell"`
	Navigation    NavigationConfig `yaml:"navigation" json:"navigation"`
	Entities      []Entity         `yaml:"entities" json:"entities"`
	Journeys      []Journey        `yaml:"journeys" json:"journeys,omitempty"`
	Pages         []Page           `yaml:"pages" json:"pages,omitempty"`
	Behaviors     BehaviorConfig   `yaml:"behaviors" json:"behaviors,omitempty"`
	Responsive    ResponsiveConfig `yaml:"responsive" json:"responsive,omitempty"`
	Accessibility A11yConfig       `yaml:"accessibility" json:"accessibility,omitempty"`
}

type AppMeta struct {
	Name        string      `yaml:"name" json:"name"`
	DisplayName string      `yaml:"display_name" json:"display_name"`
	Version     string      `yaml:"version" json:"version"`
	Description string      `yaml:"description" json:"description,omitempty"`
	Theme       ThemeConfig `yaml:"theme" json:"theme"`
	I18n        I18nConfig  `yaml:"i18n" json:"i18n"`
}

type ThemeConfig struct {
	Mode           string     `yaml:"mode" json:"mode"`
	PrimaryColor   string     `yaml:"primary_color" json:"primary_color"`
	SecondaryColor string     `yaml:"secondary_color" json:"secondary_color"`
	AccentColor    string     `yaml:"accent_color" json:"accent_color"`
	DangerColor    string     `yaml:"danger_color" json:"danger_color"`
	SuccessColor   string     `yaml:"success_color" json:"success_color"`
	BorderRadius   string     `yaml:"border_radius" json:"border_radius"`
	Density        string     `yaml:"density" json:"density"`
	FontFamily     string     `yaml:"font_family" json:"font_family"`
	FontScale      string     `yaml:"font_scale" json:"font_scale,omitempty"`
	MotionMode     string     `yaml:"motion_mode" json:"motion_mode,omitempty"`
	InfoColor      string     `yaml:"info_color" json:"info_color,omitempty"`
	WarningColor   string     `yaml:"warning_color" json:"warning_color,omitempty"`
	Elevation      string     `yaml:"elevation" json:"elevation,omitempty"`
	SurfaceStyle   string     `yaml:"surface_style" json:"surface_style,omitempty"`
	HeaderStyle    string     `yaml:"header_style" json:"header_style,omitempty"`
	ChartPalette   []string   `yaml:"chart_palette" json:"chart_palette,omitempty"`
	Logo           LogoConfig `yaml:"logo" json:"logo,omitempty"`
}

type LogoConfig struct {
	Light   string `yaml:"light" json:"light,omitempty"`
	Dark    string `yaml:"dark" json:"dark,omitempty"`
	Favicon string `yaml:"favicon" json:"favicon,omitempty"`
}

type I18nConfig struct {
	DefaultLocale    string   `yaml:"default_locale" json:"default_locale"`
	SupportedLocales []string `yaml:"supported_locales" json:"supported_locales,omitempty"`
	DateFormat       string   `yaml:"date_format" json:"date_format"`
	TimeFormat       string   `yaml:"time_format" json:"time_format"`
	Currency         string   `yaml:"currency" json:"currency"`
	Timezone         string   `yaml:"timezone" json:"timezone"`
}
