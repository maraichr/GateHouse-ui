package serve

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/maraichr/GateHouse-ui/internal/auth"
	"github.com/maraichr/GateHouse-ui/internal/compose"
	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
	"github.com/maraichr/GateHouse-ui/internal/store"
)

// mountReviewerRoutes registers all /_reviewer/* API routes.
func (s *Server) mountReviewerRoutes(r chi.Router) {
	// Public auth routes (no RequireAuth)
	r.Post("/auth/login", s.handleReviewerLogin)
	r.Post("/auth/logout", s.handleReviewerLogout)
	r.Get("/auth/me", s.handleReviewerAuthMe)

	// Specs
	r.Get("/specs", s.handleReviewerListSpecs)
	r.Post("/specs", s.handleReviewerCreateSpec)
	r.Get("/specs/{specID}", s.handleReviewerGetSpec)
	r.Delete("/specs/{specID}", s.handleReviewerDeleteSpec)

	// Drafts
	r.Get("/specs/{specID}/draft", s.handleGetDraft)
	r.Put("/specs/{specID}/draft", s.handleSaveDraft)
	r.Delete("/specs/{specID}/draft", s.handleDiscardDraft)
	r.Put("/specs/{specID}/draft/init", s.handleInitDraft)
	r.Post("/specs/{specID}/publish", s.handlePublishDraft)

	// Versions
	r.Get("/specs/{specID}/versions", s.handleReviewerListVersions)
	r.Post("/specs/{specID}/versions", s.handleReviewerCreateVersion)
	r.Get("/specs/{specID}/versions/{versionID}", s.handleReviewerGetVersion)
	r.Patch("/specs/{specID}/versions/{versionID}/status", s.handleReviewerUpdateVersionStatus)
	r.Get("/specs/{specID}/versions/{versionID}/export", s.handleReviewerExportVersion)
	r.Get("/specs/{specID}/versions/{versionID}/coverage", s.handleReviewerCoverage)

	// Annotations
	r.Get("/specs/{specID}/versions/{versionID}/annotations", s.handleReviewerListAnnotations)
	r.Post("/specs/{specID}/versions/{versionID}/annotations", s.handleReviewerCreateAnnotation)
	r.Patch("/annotations/{annotationID}", s.handleReviewerUpdateAnnotation)
	r.Delete("/annotations/{annotationID}", s.handleReviewerDeleteAnnotation)

	// Approvals
	r.Get("/specs/{specID}/versions/{versionID}/approvals", s.handleReviewerListApprovals)
	r.Post("/specs/{specID}/versions/{versionID}/approvals", s.handleReviewerCreateApproval)

	// Users (admin)
	r.Get("/users", s.handleReviewerListUsers)
	r.Post("/users", s.handleReviewerCreateUser)
	r.Patch("/users/{userID}", s.handleReviewerUpdateUser)

	// Audit
	r.Get("/specs/{specID}/audit", s.handleReviewerAudit)

	// Compositions
	r.Get("/compositions", s.handleReviewerListCompositions)
	r.Post("/compositions", s.handleReviewerCreateComposition)
	r.Get("/compositions/{compID}", s.handleReviewerGetComposition)
	r.Delete("/compositions/{compID}", s.handleReviewerDeleteComposition)
	r.Get("/compositions/{compID}/composed", s.handleReviewerGetComposedSpec)
	r.Get("/compositions/{compID}/coverage", s.handleReviewerComposedCoverage)
	r.Post("/compositions/{compID}/members", s.handleReviewerAddMember)
	r.Delete("/compositions/{compID}/members/{memberID}", s.handleReviewerRemoveMember)
	r.Patch("/compositions/{compID}/members/{memberID}", s.handleReviewerUpdateMember)
	r.Post("/compositions/import", s.handleReviewerImportComposition)
}

// --- Auth ---

func (s *Server) handleReviewerLogin(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if input.Email == "" || input.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password required"})
		return
	}

	user, err := s.store.GetUserByEmail(r.Context(), input.Email)
	if err != nil || user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}
	if user.PasswordHash == "" || !auth.CheckPassword(user.PasswordHash, input.Password) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}

	const sessionDays = 7
	expiresAt := time.Now().Add(time.Duration(sessionDays) * 24 * time.Hour)
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = fwd
	}
	ua := r.Header.Get("User-Agent")

	_, err = s.store.CreateSession(r.Context(), user.ID, token, expiresAt, ip, ua)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}

	auth.SetSessionCookie(w, token, sessionDays*24*3600)
	s.writeAudit(r, user, "auth.login", "user", user.ID, nil)
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleReviewerLogout(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if token := auth.GetSessionToken(r); token != "" {
		_ = s.store.DeleteSession(r.Context(), token)
	}
	auth.ClearSessionCookie(w)
	if user != nil {
		s.writeAudit(r, user, "auth.logout", "user", user.ID, nil)
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleReviewerAuthMe(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}
	writeJSON(w, http.StatusOK, user)
}

// --- Specs ---

func (s *Server) handleReviewerListSpecs(w http.ResponseWriter, r *http.Request) {
	specs, err := s.store.ListSpecs(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if specs == nil {
		specs = []store.Spec{}
	}

	// Enrich with latest version info
	type SpecWithVersion struct {
		store.Spec
		LatestVersion *store.SpecVersionSummary `json:"latest_version,omitempty"`
	}
	var result []SpecWithVersion
	for _, sp := range specs {
		item := SpecWithVersion{Spec: sp}
		versions, _ := s.store.ListVersions(r.Context(), sp.ID, "")
		if len(versions) > 0 {
			item.LatestVersion = &versions[0]
		}
		result = append(result, item)
	}
	if result == nil {
		result = []SpecWithVersion{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"specs": result})
}

func (s *Server) handleReviewerCreateSpec(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	if !auth.RequireRole(r.Context(), "admin", "editor") {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "editor or admin role required"})
		return
	}

	// Check Content-Type: if multipart, this is a YAML file import
	contentType := r.Header.Get("Content-Type")
	if contentType == "application/x-yaml" || contentType == "text/yaml" {
		s.handleReviewerImportYAML(w, r, user)
		return
	}

	var input struct {
		AppName     string          `json:"app_name"`
		DisplayName string          `json:"display_name"`
		Description string          `json:"description"`
		Version     string          `json:"version"`
		SpecData    json.RawMessage `json:"spec_data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	if input.AppName == "" || input.DisplayName == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "app_name and display_name required"})
		return
	}

	sp, err := s.store.CreateSpec(r.Context(), store.CreateSpecInput{
		AppName:     input.AppName,
		DisplayName: input.DisplayName,
		Description: input.Description,
		OwnerID:     user.ID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Grant owner permission
	_ = s.store.SetSpecPermission(r.Context(), sp.ID, user.ID, "owner", user.ID)

	// Create initial version if spec_data provided
	if input.SpecData != nil {
		version := input.Version
		if version == "" {
			version = "1.0.0"
		}
		_, err := s.store.CreateVersion(r.Context(), store.CreateVersionInput{
			SpecID:    sp.ID,
			Version:   version,
			SpecData:  input.SpecData,
			CreatedBy: user.ID,
		})
		if err != nil {
			slog.Warn("failed to create initial version", "error", err)
		}
	}

	s.writeAudit(r, user, "spec.create", "spec", sp.ID, nil)
	writeJSON(w, http.StatusCreated, sp)
}

func (s *Server) handleReviewerImportYAML(w http.ResponseWriter, r *http.Request, user *store.User) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
		return
	}

	// Parse the YAML to get AppSpec
	appSpec, err := parser.ParseBytes(body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec YAML: " + err.Error()})
		return
	}

	// Convert AppSpec to JSON for storage
	specJSON, err := json.Marshal(appSpec)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to marshal spec"})
		return
	}

	appName := appSpec.App.Name
	displayName := appSpec.App.DisplayName
	if displayName == "" {
		displayName = appName
	}

	sp, err := s.store.CreateSpec(r.Context(), store.CreateSpecInput{
		AppName:     appName,
		DisplayName: displayName,
		Description: appSpec.App.Description,
		OwnerID:     user.ID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	_ = s.store.SetSpecPermission(r.Context(), sp.ID, user.ID, "owner", user.ID)

	version := appSpec.App.Version
	if version == "" {
		version = "1.0.0"
	}

	v, err := s.store.CreateVersion(r.Context(), store.CreateVersionInput{
		SpecID:        sp.ID,
		Version:       version,
		SpecData:      specJSON,
		CreatedBy:     user.ID,
		ChangeSummary: "Initial import from YAML",
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "spec.create", "spec", sp.ID, map[string]any{"source": "yaml_import"})
	s.writeAudit(r, user, "version.create", "version", v.ID, nil)

	writeJSON(w, http.StatusCreated, map[string]any{"spec": sp, "version": v})
}

func (s *Server) handleReviewerGetSpec(w http.ResponseWriter, r *http.Request) {
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}

	sp, err := s.store.GetSpec(r.Context(), specID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sp == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "spec not found"})
		return
	}

	latest, _ := s.store.GetLatestVersion(r.Context(), specID)
	writeJSON(w, http.StatusOK, map[string]any{"spec": sp, "latest_version": latest})
}

func (s *Server) handleReviewerDeleteSpec(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAdmin(r.Context()) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin role required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}

	user := auth.UserFromContext(r.Context())
	s.writeAudit(r, user, "spec.delete", "spec", specID, nil)

	if err := s.store.DeleteSpec(r.Context(), specID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// --- Drafts ---

func (s *Server) handleGetDraft(w http.ResponseWriter, r *http.Request) {
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	draft, updatedAt, err := s.store.GetDraft(r.Context(), specID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if draft == nil {
		writeJSON(w, http.StatusOK, map[string]any{"draft": nil, "updated_at": nil})
		return
	}
	var updatedAtStr *string
	if updatedAt != nil {
		s := updatedAt.Format(time.RFC3339)
		updatedAtStr = &s
	}
	writeJSON(w, http.StatusOK, map[string]any{"draft": json.RawMessage(draft), "updated_at": updatedAtStr})
}

func (s *Server) handleSaveDraft(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	if !auth.CanEditSpec(r.Context(), s.store, specID) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "edit permission required"})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
		return
	}
	if !json.Valid(body) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	if err := s.store.SaveDraft(r.Context(), specID, body); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

func (s *Server) handleDiscardDraft(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	if !auth.CanEditSpec(r.Context(), s.store, specID) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "edit permission required"})
		return
	}

	if err := s.store.DiscardDraft(r.Context(), specID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	s.writeAudit(r, user, "draft.discard", "spec", specID, nil)
	writeJSON(w, http.StatusOK, map[string]string{"status": "discarded"})
}

func (s *Server) handleInitDraft(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	if !auth.CanEditSpec(r.Context(), s.store, specID) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "edit permission required"})
		return
	}

	latest, err := s.store.GetLatestVersion(r.Context(), specID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if latest == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "no published version to initialize from"})
		return
	}

	if err := s.store.SaveDraft(r.Context(), specID, latest.SpecData); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	s.writeAudit(r, user, "draft.init", "spec", specID, map[string]any{"from_version": latest.Version})
	writeJSON(w, http.StatusOK, map[string]any{"draft": json.RawMessage(latest.SpecData)})
}

func (s *Server) handlePublishDraft(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	if !auth.CanEditSpec(r.Context(), s.store, specID) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "edit permission required"})
		return
	}

	var input struct {
		Version       string `json:"version"`
		ChangeSummary string `json:"change_summary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	draft, _, err := s.store.GetDraft(r.Context(), specID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if draft == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "no draft to publish"})
		return
	}

	// Basic validation: ensure draft parses as JSON
	var specCheck map[string]any
	if err := json.Unmarshal(draft, &specCheck); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "draft is not valid JSON: " + err.Error()})
		return
	}

	var warnings []string
	if specCheck["app"] == nil {
		warnings = append(warnings, "spec is missing 'app' section")
	}
	if specCheck["entities"] == nil {
		warnings = append(warnings, "spec has no entities defined")
	}

	// Auto-increment version if not provided
	version := input.Version
	if version == "" {
		versions, _ := s.store.ListVersions(r.Context(), specID, "")
		if len(versions) > 0 {
			version = incrementVersion(versions[0].Version)
		} else {
			version = "1.0.0"
		}
	}

	v, err := s.store.CreateVersion(r.Context(), store.CreateVersionInput{
		SpecID:        specID,
		Version:       version,
		SpecData:      draft,
		CreatedBy:     user.ID,
		ChangeSummary: input.ChangeSummary,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	_ = s.store.DiscardDraft(r.Context(), specID)

	s.writeAudit(r, user, "draft.publish", "spec", specID, map[string]any{"version": version})
	writeJSON(w, http.StatusOK, map[string]any{"version": v, "warnings": warnings})
}

// incrementVersion bumps the patch number of a semver string.
func incrementVersion(v string) string {
	parts := [3]int{1, 0, 0}
	n, _ := fmt.Sscanf(v, "%d.%d.%d", &parts[0], &parts[1], &parts[2])
	if n >= 3 {
		parts[2]++
	}
	return fmt.Sprintf("%d.%d.%d", parts[0], parts[1], parts[2])
}

// --- Versions ---

func (s *Server) handleReviewerListVersions(w http.ResponseWriter, r *http.Request) {
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	status := r.URL.Query().Get("status")
	versions, err := s.store.ListVersions(r.Context(), specID, status)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if versions == nil {
		versions = []store.SpecVersionSummary{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"versions": versions})
}

func (s *Server) handleReviewerCreateVersion(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	if !auth.CanEditSpec(r.Context(), s.store, specID) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "edit permission required"})
		return
	}

	var input struct {
		Version       string          `json:"version"`
		SpecData      json.RawMessage `json:"spec_data"`
		ParentID      *uuid.UUID      `json:"parent_id,omitempty"`
		ChangeSummary string          `json:"change_summary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	v, err := s.store.CreateVersion(r.Context(), store.CreateVersionInput{
		SpecID:        specID,
		Version:       input.Version,
		SpecData:      input.SpecData,
		CreatedBy:     user.ID,
		ParentID:      input.ParentID,
		ChangeSummary: input.ChangeSummary,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "version.create", "version", v.ID, map[string]any{"version": input.Version})
	writeJSON(w, http.StatusCreated, v)
}

func (s *Server) handleReviewerGetVersion(w http.ResponseWriter, r *http.Request) {
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	v, err := s.store.GetVersion(r.Context(), versionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if v == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "version not found"})
		return
	}
	writeJSON(w, http.StatusOK, v)
}

func (s *Server) handleReviewerUpdateVersionStatus(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	var input struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	// Check for blocking annotations before approving
	if input.Status == "approved" {
		hasBlocking, _ := s.store.HasBlockingAnnotations(r.Context(), versionID)
		if hasBlocking {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "cannot approve: blocking annotations exist"})
			return
		}
	}

	v, err := s.store.UpdateVersionStatus(r.Context(), versionID, input.Status)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "version.status_change", "version", v.ID, map[string]any{"new_status": input.Status})
	writeJSON(w, http.StatusOK, v)
}

func (s *Server) handleReviewerExportVersion(w http.ResponseWriter, r *http.Request) {
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	v, err := s.store.GetVersion(r.Context(), versionID)
	if err != nil || v == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "version not found"})
		return
	}

	yamlBytes, err := engine.ExportSpecToYAML(v.SpecData)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "export failed: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/x-yaml")
	w.Header().Set("Content-Disposition", "attachment; filename=spec.yaml")
	w.Write(yamlBytes)
}

func (s *Server) handleReviewerCoverage(w http.ResponseWriter, r *http.Request) {
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	v, err := s.store.GetVersion(r.Context(), versionID)
	if err != nil || v == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "version not found"})
		return
	}

	report, err := engine.AnalyzeCoverage(v.SpecData)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "coverage analysis failed: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, report)
}

// --- Annotations ---

func (s *Server) handleReviewerListAnnotations(w http.ResponseWriter, r *http.Request) {
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	annotations, err := s.store.ListAnnotations(r.Context(), versionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if annotations == nil {
		annotations = []store.Annotation{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"annotations": annotations})
}

func (s *Server) handleReviewerCreateAnnotation(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	var input struct {
		ElementPath string     `json:"element_path"`
		ElementType string     `json:"element_type"`
		Body        string     `json:"body"`
		State       string     `json:"state"`
		ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	a, err := s.store.CreateAnnotation(r.Context(), store.CreateAnnotationInput{
		VersionID:   versionID,
		ElementPath: input.ElementPath,
		ElementType: input.ElementType,
		Body:        input.Body,
		State:       input.State,
		AuthorID:    user.ID,
		ParentID:    input.ParentID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "annotation.create", "annotation", a.ID, map[string]any{"element_path": input.ElementPath})
	writeJSON(w, http.StatusCreated, a)
}

func (s *Server) handleReviewerUpdateAnnotation(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	annotationID, err := uuid.Parse(chi.URLParam(r, "annotationID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid annotation ID"})
		return
	}

	var input struct {
		State string `json:"state"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	var resolvedBy *uuid.UUID
	if input.State == "resolved" {
		resolvedBy = &user.ID
	}

	a, err := s.store.UpdateAnnotationState(r.Context(), annotationID, input.State, resolvedBy)
	if err != nil || a == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "update failed"})
		return
	}

	action := "annotation.update"
	if input.State == "resolved" {
		action = "annotation.resolve"
	}
	s.writeAudit(r, user, action, "annotation", a.ID, map[string]any{"state": input.State})
	writeJSON(w, http.StatusOK, a)
}

func (s *Server) handleReviewerDeleteAnnotation(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	annotationID, err := uuid.Parse(chi.URLParam(r, "annotationID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid annotation ID"})
		return
	}

	s.writeAudit(r, user, "annotation.delete", "annotation", annotationID, nil)
	if err := s.store.DeleteAnnotation(r.Context(), annotationID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// --- Approvals ---

func (s *Server) handleReviewerListApprovals(w http.ResponseWriter, r *http.Request) {
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}
	approvals, err := s.store.ListApprovals(r.Context(), versionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if approvals == nil {
		approvals = []store.Approval{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"approvals": approvals})
}

func (s *Server) handleReviewerCreateApproval(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	versionID, err := uuid.Parse(chi.URLParam(r, "versionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid version ID"})
		return
	}

	var input struct {
		Decision string `json:"decision"`
		Notes    string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	a, err := s.store.CreateApproval(r.Context(), store.CreateApprovalInput{
		VersionID:  versionID,
		ReviewerID: user.ID,
		Decision:   input.Decision,
		Notes:      input.Notes,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "approval.submit", "approval", a.ID, map[string]any{"decision": input.Decision})
	writeJSON(w, http.StatusCreated, a)
}

// --- Users ---

func (s *Server) handleReviewerListUsers(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAdmin(r.Context()) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin role required"})
		return
	}
	users, err := s.store.ListUsers(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if users == nil {
		users = []store.User{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (s *Server) handleReviewerCreateUser(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAdmin(r.Context()) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin role required"})
		return
	}
	var input store.CreateUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	u, err := s.store.CreateUser(r.Context(), input)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, u)
}

func (s *Server) handleReviewerUpdateUser(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAdmin(r.Context()) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin role required"})
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "userID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user ID"})
		return
	}
	var input struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	u, err := s.store.UpdateUserRole(r.Context(), userID, input.Role)
	if err != nil || u == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "update failed"})
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// --- Audit ---

func (s *Server) handleReviewerAudit(w http.ResponseWriter, r *http.Request) {
	specID, err := uuid.Parse(chi.URLParam(r, "specID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid spec ID"})
		return
	}
	entries, err := s.store.ListAuditBySpec(r.Context(), specID, 200)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if entries == nil {
		entries = []store.AuditEntry{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"audit": entries})
}

// --- Helpers ---

func (s *Server) writeAudit(r *http.Request, user *store.User, action, resourceType string, resourceID uuid.UUID, metadata map[string]any) {
	if user == nil {
		return
	}
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = fwd
	}
	_ = s.store.WriteAudit(r.Context(), store.AuditInput{
		UserID:       user.ID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Metadata:     metadata,
		IPAddress:    ip,
	})
}

// --- Compositions ---

func (s *Server) handleReviewerListCompositions(w http.ResponseWriter, r *http.Request) {
	comps, err := s.store.ListCompositions(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if comps == nil {
		comps = []store.Composition{}
	}

	// Enrich with host spec info and member count
	type CompositionWithInfo struct {
		store.Composition
		HostSpecName string `json:"host_spec_name"`
		MemberCount  int    `json:"member_count"`
	}
	var result []CompositionWithInfo
	for _, c := range comps {
		item := CompositionWithInfo{Composition: c}
		if sp, _ := s.store.GetSpec(r.Context(), c.HostSpecID); sp != nil {
			item.HostSpecName = sp.DisplayName
		}
		if members, _ := s.store.ListCompositionMembers(r.Context(), c.ID); members != nil {
			item.MemberCount = len(members)
		}
		result = append(result, item)
	}
	if result == nil {
		result = []CompositionWithInfo{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"compositions": result})
}

func (s *Server) handleReviewerCreateComposition(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	if !auth.RequireRole(r.Context(), "admin", "editor") {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "editor or admin role required"})
		return
	}

	var input struct {
		Name        string    `json:"name"`
		DisplayName string    `json:"display_name"`
		Description string    `json:"description"`
		HostSpecID  uuid.UUID `json:"host_spec_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if input.Name == "" || input.DisplayName == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name and display_name required"})
		return
	}
	if input.HostSpecID == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "host_spec_id required"})
		return
	}

	c, err := s.store.CreateComposition(r.Context(), store.CreateCompositionInput{
		Name:        input.Name,
		DisplayName: input.DisplayName,
		Description: input.Description,
		HostSpecID:  input.HostSpecID,
		OwnerID:     user.ID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "composition.create", "composition", c.ID, nil)
	writeJSON(w, http.StatusCreated, c)
}

func (s *Server) handleReviewerGetComposition(w http.ResponseWriter, r *http.Request) {
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}

	c, err := s.store.GetComposition(r.Context(), compID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if c == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "composition not found"})
		return
	}

	members, err := s.store.ListCompositionMembers(r.Context(), compID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if members == nil {
		members = []store.CompositionMember{}
	}

	// Get host spec name
	hostSpecName := ""
	if sp, _ := s.store.GetSpec(r.Context(), c.HostSpecID); sp != nil {
		hostSpecName = sp.DisplayName
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"composition":    c,
		"members":        members,
		"host_spec_name": hostSpecName,
	})
}

func (s *Server) handleReviewerDeleteComposition(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAdmin(r.Context()) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin role required"})
		return
	}
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}

	user := auth.UserFromContext(r.Context())
	s.writeAudit(r, user, "composition.delete", "composition", compID, nil)

	if err := s.store.DeleteComposition(r.Context(), compID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) handleReviewerGetComposedSpec(w http.ResponseWriter, r *http.Request) {
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}

	c, err := s.store.GetComposition(r.Context(), compID)
	if err != nil || c == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "composition not found"})
		return
	}

	members, err := s.store.ListCompositionMembers(r.Context(), c.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Get host spec's latest version
	hostVersion, err := s.store.GetLatestVersion(r.Context(), c.HostSpecID)
	if err != nil || hostVersion == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "host spec has no version"})
		return
	}

	hostSpec, _ := s.store.GetSpec(r.Context(), c.HostSpecID)
	hostName := "host"
	if hostSpec != nil {
		hostName = hostSpec.AppName
	}

	// Build member specs
	var memberSpecs []engine.MemberSpec
	type memberInfo struct {
		store.CompositionMember
		SpecName string `json:"spec_name"`
	}
	var membersInfo []memberInfo

	for _, m := range members {
		v, err := s.store.GetLatestVersion(r.Context(), m.SpecID)
		if err != nil || v == nil {
			slog.Warn("member spec has no version", "member", m.ServiceName, "spec_id", m.SpecID)
			continue
		}
		memberSpecs = append(memberSpecs, engine.MemberSpec{
			ServiceName: m.ServiceName,
			NavGroup:    m.NavGroup,
			NavOrder:    m.NavOrder,
			Prefix:      m.Prefix,
			SpecData:    v.SpecData,
		})
		specName := m.ServiceName
		if sp, _ := s.store.GetSpec(r.Context(), m.SpecID); sp != nil {
			specName = sp.DisplayName
		}
		membersInfo = append(membersInfo, memberInfo{CompositionMember: m, SpecName: specName})
	}

	merged, sources, err := engine.MergeAppSpecs(hostVersion.SpecData, hostName, memberSpecs)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "merge failed: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"composed_spec": merged,
		"sources":       sources,
		"host_name":     hostName,
		"members":       membersInfo,
	})
}

func (s *Server) handleReviewerComposedCoverage(w http.ResponseWriter, r *http.Request) {
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}

	c, err := s.store.GetComposition(r.Context(), compID)
	if err != nil || c == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "composition not found"})
		return
	}

	members, _ := s.store.ListCompositionMembers(r.Context(), c.ID)
	hostVersion, _ := s.store.GetLatestVersion(r.Context(), c.HostSpecID)
	if hostVersion == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "host spec has no version"})
		return
	}

	hostSpec, _ := s.store.GetSpec(r.Context(), c.HostSpecID)
	hostName := "host"
	if hostSpec != nil {
		hostName = hostSpec.AppName
	}

	var memberSpecs []engine.MemberSpec
	for _, m := range members {
		v, _ := s.store.GetLatestVersion(r.Context(), m.SpecID)
		if v == nil {
			continue
		}
		memberSpecs = append(memberSpecs, engine.MemberSpec{
			ServiceName: m.ServiceName,
			NavGroup:    m.NavGroup,
			NavOrder:    m.NavOrder,
			Prefix:      m.Prefix,
			SpecData:    v.SpecData,
		})
	}

	merged, sources, err := engine.MergeAppSpecs(hostVersion.SpecData, hostName, memberSpecs)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "merge failed: " + err.Error()})
		return
	}

	mergedJSON, _ := json.Marshal(merged)
	report, err := engine.AnalyzeCoverage(mergedJSON)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "coverage analysis failed: " + err.Error()})
		return
	}

	// Enrich entity coverages with source and compute per-service summaries
	type EnrichedEntityCoverage struct {
		engine.EntityCoverage
		Source string `json:"source"`
	}
	enriched := make([]EnrichedEntityCoverage, 0, len(report.Entities))
	serviceTotals := map[string][]float64{}

	for _, ec := range report.Entities {
		src := sources[ec.Name]
		enriched = append(enriched, EnrichedEntityCoverage{EntityCoverage: ec, Source: src})
		serviceTotals[src] = append(serviceTotals[src], ec.Overall)
	}

	// Compute per-service averages
	type ServiceCoverage struct {
		Service     string  `json:"service"`
		EntityCount int     `json:"entity_count"`
		Average     float64 `json:"average"`
	}
	var serviceCoverages []ServiceCoverage
	for svc, scores := range serviceTotals {
		sum := 0.0
		for _, s := range scores {
			sum += s
		}
		serviceCoverages = append(serviceCoverages, ServiceCoverage{
			Service:     svc,
			EntityCount: len(scores),
			Average:     sum / float64(len(scores)),
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"overall":           report.Overall,
		"entities":          enriched,
		"summary":           report.Summary,
		"gaps":              report.Gaps,
		"sources":           sources,
		"service_coverages": serviceCoverages,
	})
}

func (s *Server) handleReviewerAddMember(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}

	var input struct {
		SpecID      uuid.UUID `json:"spec_id"`
		ServiceName string    `json:"service_name"`
		Prefix      string    `json:"prefix"`
		NavGroup    string    `json:"nav_group"`
		NavOrder    int       `json:"nav_order"`
		Optional    bool      `json:"optional"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if input.ServiceName == "" || input.SpecID == uuid.Nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "spec_id and service_name required"})
		return
	}

	m, err := s.store.AddCompositionMember(r.Context(), store.AddCompositionMemberInput{
		CompositionID: compID,
		SpecID:        input.SpecID,
		ServiceName:   input.ServiceName,
		Prefix:        input.Prefix,
		NavGroup:      input.NavGroup,
		NavOrder:      input.NavOrder,
		Optional:      input.Optional,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.writeAudit(r, user, "composition.add_member", "composition", compID, map[string]any{"member": input.ServiceName})
	writeJSON(w, http.StatusCreated, m)
}

func (s *Server) handleReviewerRemoveMember(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	compID, err := uuid.Parse(chi.URLParam(r, "compID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid composition ID"})
		return
	}
	memberID, err := uuid.Parse(chi.URLParam(r, "memberID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid member ID"})
		return
	}

	s.writeAudit(r, user, "composition.remove_member", "composition", compID, map[string]any{"member_id": memberID})
	if err := s.store.RemoveCompositionMember(r.Context(), memberID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (s *Server) handleReviewerUpdateMember(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	memberID, err := uuid.Parse(chi.URLParam(r, "memberID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid member ID"})
		return
	}

	var input struct {
		NavGroup string `json:"nav_group"`
		NavOrder int    `json:"nav_order"`
		Prefix   string `json:"prefix"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	m, err := s.store.UpdateCompositionMember(r.Context(), memberID, input.NavGroup, input.NavOrder, input.Prefix)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	_ = user // audit uses compID from the member; keep simple
	writeJSON(w, http.StatusOK, m)
}

func (s *Server) handleReviewerImportComposition(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
		return
	}
	if !auth.RequireRole(r.Context(), "admin", "editor") {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "editor or admin role required"})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
		return
	}

	cfg, err := compose.LoadConfigFromBytes(body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid compose config: " + err.Error()})
		return
	}

	// Import each spec from disk paths
	importSpec := func(src compose.ServiceSource) (*store.Spec, error) {
		if src.SpecPath == "" {
			return nil, fmt.Errorf("service %q has no spec_path", src.Name)
		}
		absPath := src.SpecPath
		if !filepath.IsAbs(absPath) {
			// Relative to base_dir query param if provided
			if base := r.URL.Query().Get("base_dir"); base != "" {
				absPath = filepath.Join(base, absPath)
			}
		}
		data, err := os.ReadFile(absPath)
		if err != nil {
			return nil, fmt.Errorf("reading %q: %w", absPath, err)
		}
		appSpec, err := parser.ParseBytes(data)
		if err != nil {
			return nil, fmt.Errorf("parsing %q: %w", src.Name, err)
		}
		specJSON, _ := json.Marshal(appSpec)

		appName := appSpec.App.Name
		displayName := appSpec.App.DisplayName
		if displayName == "" {
			displayName = appName
		}

		sp, err := s.store.CreateSpec(r.Context(), store.CreateSpecInput{
			AppName:     appName,
			DisplayName: displayName,
			Description: appSpec.App.Description,
			OwnerID:     user.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("creating spec for %q: %w", src.Name, err)
		}
		_ = s.store.SetSpecPermission(r.Context(), sp.ID, user.ID, "owner", user.ID)

		version := appSpec.App.Version
		if version == "" {
			version = "1.0.0"
		}
		_, err = s.store.CreateVersion(r.Context(), store.CreateVersionInput{
			SpecID:        sp.ID,
			Version:       version,
			SpecData:      specJSON,
			CreatedBy:     user.ID,
			ChangeSummary: "Imported via composition",
		})
		if err != nil {
			return nil, fmt.Errorf("creating version for %q: %w", src.Name, err)
		}
		return sp, nil
	}

	// Import host spec
	hostSp, err := importSpec(cfg.Host)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "host import failed: " + err.Error()})
		return
	}

	// Create composition
	compName := cfg.Host.Name + "-composition"
	comp, err := s.store.CreateComposition(r.Context(), store.CreateCompositionInput{
		Name:        compName,
		DisplayName: cfg.Host.Name + " Composition",
		HostSpecID:  hostSp.ID,
		OwnerID:     user.ID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "create composition: " + err.Error()})
		return
	}

	// Import service specs and add as members
	specsCreated := 1 // host
	membersCreated := 0
	for _, svc := range cfg.Services {
		sp, err := importSpec(svc)
		if err != nil {
			slog.Warn("skipping service import", "service", svc.Name, "error", err)
			continue
		}
		specsCreated++

		_, err = s.store.AddCompositionMember(r.Context(), store.AddCompositionMemberInput{
			CompositionID: comp.ID,
			SpecID:        sp.ID,
			ServiceName:   svc.Name,
			Prefix:        svc.Prefix,
			NavGroup:      svc.NavGroup,
			NavOrder:      svc.NavOrder,
			Optional:      svc.Optional,
		})
		if err != nil {
			slog.Warn("failed to add member", "service", svc.Name, "error", err)
			continue
		}
		membersCreated++
	}

	s.writeAudit(r, user, "composition.import", "composition", comp.ID, map[string]any{
		"specs_created":   specsCreated,
		"members_created": membersCreated,
	})

	writeJSON(w, http.StatusCreated, map[string]any{
		"composition":     comp,
		"specs_created":   specsCreated,
		"members_created": membersCreated,
	})
}

// writeJSON is defined in mockdata.go — shared across serve package
