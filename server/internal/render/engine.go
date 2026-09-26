package render

import (
	"fmt"

	"star/internal/github"
	"star/internal/render/templates"
)

var templateRegistry = map[string]templates.Template{
	"counter":       templates.NewCounterTemplate(),
	"ticker":        templates.NewTickerTemplate(),
	"orbit":         templates.NewOrbitTemplate(),
	"constellation": templates.NewConstellationTemplate(),
}

func RenderTemplate(templateName string, data *github.RepoData, opts templates.RenderOptions) ([]byte, error) {
	tmpl, exists := templateRegistry[templateName]
	if !exists {
		return nil, fmt.Errorf("unknown template '%s', available templates: counter, ticker, orbit, constellation", templateName)
	}

	return tmpl.Render(data, opts)
}
