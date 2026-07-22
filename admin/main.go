// Command admin runs a small local HTTP server that manages the D&D
// engagement party guest list via the main app's protected admin API.
package main

import (
	"embed"
	"log"
	"net/http"

	"admin/internal/client"
	"admin/internal/config"
	"admin/internal/handlers"
)

//go:embed static
var staticFS embed.FS

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	server := &handlers.Server{
		Client:    client.New(cfg.TargetURL, cfg.APIKey),
		TargetURL: cfg.TargetURL,
	}

	mux := http.NewServeMux()
	mux.Handle("GET /static/", http.FileServer(http.FS(staticFS)))
	mux.HandleFunc("GET /{$}", server.Index)
	mux.HandleFunc("POST /invitees", server.CreateInvitee)
	mux.HandleFunc("DELETE /invitees/{id}", server.DeleteInvitation)
	mux.HandleFunc("DELETE /guests/{id}", server.DeleteGuest)
	mux.HandleFunc("GET /fragments/invitees/{id}", server.InviteeDetail)
	mux.HandleFunc("POST /link/preview", server.LinkPreview)
	mux.HandleFunc("POST /link/confirm", server.LinkConfirm)
	mux.HandleFunc("POST /reset", server.ResetData)

	log.Printf("admin app listening on :%s (target %s)", cfg.Port, cfg.TargetURL)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
}
