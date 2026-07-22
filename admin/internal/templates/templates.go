// Package templates embeds and parses the admin app's HTML templates.
package templates

import (
	"embed"
	"html/template"
)

//go:embed *.html
var files embed.FS

var Templates = template.Must(template.ParseFS(files, "*.html"))
