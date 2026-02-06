package spec

type AuthConfig struct {
	Provider      string            `yaml:"provider" json:"provider"`
	Config        AuthProviderConfig `yaml:"config" json:"config"`
	ClaimsMapping ClaimsMapping     `yaml:"claims_mapping" json:"claims_mapping"`
	Roles         map[string]RoleDefinition `yaml:"roles" json:"roles"`
	Login         LoginConfig       `yaml:"login" json:"login,omitempty"`
	Logout        LogoutConfig      `yaml:"logout" json:"logout,omitempty"`
}

type AuthProviderConfig struct {
	Issuer   string   `yaml:"issuer" json:"issuer,omitempty"`
	ClientID string   `yaml:"client_id" json:"client_id,omitempty"`
	Scopes   []string `yaml:"scopes" json:"scopes,omitempty"`
	PKCE     bool     `yaml:"pkce" json:"pkce,omitempty"`
}

type ClaimsMapping struct {
	UserID      string `yaml:"user_id" json:"user_id"`
	TenantID    string `yaml:"tenant_id" json:"tenant_id,omitempty"`
	DisplayName string `yaml:"display_name" json:"display_name"`
	Email       string `yaml:"email" json:"email"`
	Avatar      string `yaml:"avatar" json:"avatar,omitempty"`
	Roles       string `yaml:"roles" json:"roles"`
}

type RoleDefinition struct {
	DisplayName string `yaml:"display_name" json:"display_name"`
	Description string `yaml:"description" json:"description,omitempty"`
}

type LoginConfig struct {
	RedirectPath string `yaml:"redirect_path" json:"redirect_path"`
	ShowBranding bool   `yaml:"show_branding" json:"show_branding"`
}

type LogoutConfig struct {
	RedirectPath string `yaml:"redirect_path" json:"redirect_path"`
	ClearStorage bool   `yaml:"clear_storage" json:"clear_storage"`
}
