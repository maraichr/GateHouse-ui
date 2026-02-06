package spec

type APIConfig struct {
	BaseURL       string            `yaml:"base_url" json:"base_url"`
	VersionPrefix string            `yaml:"version_prefix" json:"version_prefix"`
	TimeoutMs     int               `yaml:"timeout_ms" json:"timeout_ms"`
	Retry         RetryConfig       `yaml:"retry" json:"retry,omitempty"`
	Headers       map[string]string `yaml:"headers" json:"headers,omitempty"`
	Pagination    PaginationConfig  `yaml:"pagination" json:"pagination"`
	ErrorFormat   ErrorFormat       `yaml:"error_format" json:"error_format,omitempty"`
}

type RetryConfig struct {
	MaxAttempts int      `yaml:"max_attempts" json:"max_attempts"`
	Backoff     string   `yaml:"backoff" json:"backoff"`
	RetryOn     []int    `yaml:"retry_on" json:"retry_on,omitempty"`
}

type PaginationConfig struct {
	Style           string `yaml:"style" json:"style"`
	DefaultPageSize int    `yaml:"default_page_size" json:"default_page_size"`
	MaxPageSize     int    `yaml:"max_page_size" json:"max_page_size"`
	CursorParam     string `yaml:"cursor_param" json:"cursor_param,omitempty"`
	PageSizeParam   string `yaml:"page_size_param" json:"page_size_param,omitempty"`
}

type ErrorFormat struct {
	CodeField       string `yaml:"code_field" json:"code_field"`
	MessageField    string `yaml:"message_field" json:"message_field"`
	DetailsField    string `yaml:"details_field" json:"details_field,omitempty"`
	ValidationField string `yaml:"validation_field" json:"validation_field,omitempty"`
}
