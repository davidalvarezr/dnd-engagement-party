// Package templates parses the admin app's HTML templates.
//
// The admin app is never deployed — it always runs from source via `go run
// .` (see RUNNING.md) — so templates are reparsed from disk on every call
// rather than embedded, letting template edits show up on a page refresh
// with no rebuild or restart.
package templates

import (
	"html/template"
	"path/filepath"
	"runtime"
)

// dir is this package's own directory on disk, resolved from the source
// file's location rather than the process's working directory — Templates
// is called both from `go run .` (cwd admin/) and `go test` (cwd
// internal/handlers), so a cwd-relative glob wouldn't work in both.
var dir = filepath.Dir(func() string {
	_, file, _, _ := runtime.Caller(0)
	return file
}())

func Templates() *template.Template {
	return template.Must(template.ParseGlob(filepath.Join(dir, "*.html")))
}
