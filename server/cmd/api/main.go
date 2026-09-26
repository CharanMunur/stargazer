package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"star/internal/github"
	"star/internal/render"
	"star/internal/render/templates"
)

type GenerateRequest struct {
	Token    string   `json:"token"`
	Repo     string   `json:"repo"`
	Template string   `json:"template"`
	Format   string   `json:"format"`
	Theme    string   `json:"theme"`
	Metrics  []string `json:"metrics,omitempty"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/generate", handleGenerate)
	mux.HandleFunc("/health", handleHealth)

	// Wrap mux with CORS middleware
	handler := corsMiddleware(mux)

	fmt.Printf("=== Star Card HTTP API Server running on port %s ===\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func handleGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "Only POST method is allowed")
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	// Sanitize and validate inputs
	repoPath := strings.TrimSpace(req.Repo)
	templateName := strings.ToLower(strings.TrimSpace(req.Template))
	format := strings.ToLower(strings.TrimSpace(req.Format))
	theme := strings.ToLower(strings.TrimSpace(req.Theme))

	if repoPath == "" {
		writeJSONError(w, http.StatusBadRequest, "Field 'repo' is required (format: owner/repo)")
		return
	}

	parts := strings.Split(repoPath, "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		writeJSONError(w, http.StatusBadRequest, "Invalid repo format. Must be 'owner/repo'")
		return
	}
	owner, repo := parts[0], parts[1]

	if templateName == "" {
		templateName = "counter"
	}
	if templateName != "counter" && templateName != "ticker" && templateName != "orbit" && templateName != "constellation" {
		writeJSONError(w, http.StatusBadRequest, "Invalid template. Must be 'counter', 'ticker', 'orbit', or 'constellation'")
		return
	}

	if format == "" {
		format = "png"
	}
	if format != "png" && format != "gif" {
		writeJSONError(w, http.StatusBadRequest, "Invalid format. Must be 'png' or 'gif'")
		return
	}

	if theme != "light" {
		theme = "dark"
	}

	// Fetch GitHub repository data
	log.Printf("[API] Processing request for repo=%s/%s template=%s format=%s theme=%s", owner, repo, templateName, format, theme)
	client := github.NewClient(req.Token)

	repoData, err := client.FetchRepoData(owner, repo)
	if err != nil {
		if errors.Is(err, github.ErrUnauthorized) {
			writeJSONError(w, http.StatusUnauthorized, err.Error())
			return
		}
		if errors.Is(err, github.ErrNotFound) {
			writeJSONError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, github.ErrRateLimited) {
			writeJSONError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("GitHub API error: %v", err))
		return
	}

	// Render Image Bytes
	renderOpts := templates.RenderOptions{
		Format:       format,
		Theme:        theme,
		MetricLabels: req.Metrics,
	}

	imageBytes, err := render.RenderTemplate(templateName, repoData, renderOpts)
	if err != nil {
		log.Printf("[API Error] Render failed: %v", err)
		writeJSONError(w, http.StatusInternalServerError, fmt.Sprintf("Rendering error: %v", err))
		return
	}

	// Send Binary Image Response
	if format == "gif" {
		w.Header().Set("Content-Type", "image/gif")
	} else {
		w.Header().Set("Content-Type", "image/png")
	}
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(imageBytes)))
	w.WriteHeader(http.StatusOK)
	w.Write(imageBytes)
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: msg})
}
