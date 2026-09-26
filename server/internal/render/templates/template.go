package templates

import (
	"star/internal/github"
)

type RenderOptions struct {
	Format       string   // "png" or "gif"
	Theme        string   // "dark" or "light"
	MetricLabels []string // Optional 3 metrics to display e.g. ["STARS", "FORKS", "DAYS"]
}

type Template interface {
	Name() string
	Render(data *github.RepoData, opts RenderOptions) ([]byte, error)
}
