package handlers

import (
	"bufio"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"admin/internal/client"
	"admin/internal/templates"
)

// csvBOM is the UTF-8 byte-order mark some spreadsheet tools prepend to
// exported CSV files.
const csvBOM = "\xEF\xBB\xBF"

// maxImportUploadSize bounds the multipart form (and thus the uploaded
// file) accepted by ImportPreview.
const maxImportUploadSize = 10 << 20 // 10 MiB

// parseInviteeCSV reads a guest1,guest2,code CSV (header required, BOM
// tolerated) and returns one ImportRow per data row, with 1-based source
// line numbers (the first data row is line 2). It rejects a missing or
// malformed header, rows with the wrong number of fields, and files with
// no data rows.
func parseInviteeCSV(r io.Reader) ([]client.ImportRow, error) {
	br := bufio.NewReader(r)

	if bom, err := br.Peek(len(csvBOM)); err == nil && string(bom) == csvBOM {
		_, _ = br.Discard(len(csvBOM))
	}

	reader := csv.NewReader(br)
	reader.FieldsPerRecord = 3
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err == io.EOF {
		return nil, fmt.Errorf("file is empty")
	}
	if err != nil {
		return nil, fmt.Errorf("reading header row: %w", err)
	}

	if len(header) != 3 ||
		!strings.EqualFold(strings.TrimSpace(header[0]), "guest1") ||
		!strings.EqualFold(strings.TrimSpace(header[1]), "guest2") ||
		!strings.EqualFold(strings.TrimSpace(header[2]), "code") {
		return nil, fmt.Errorf("header must be exactly guest1,guest2,code")
	}

	var rows []client.ImportRow
	line := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("reading row %d: %w", line+1, err)
		}
		line++
		rows = append(rows, client.ImportRow{
			Line:   line,
			Guest1: strings.TrimSpace(record[0]),
			Guest2: strings.TrimSpace(record[1]),
			Code:   strings.TrimSpace(record[2]),
		})
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("file has no data rows")
	}

	return rows, nil
}

// tokenForRows fingerprints a set of parsed rows so a later confirm request
// can be checked against the exact preview that produced it.
func tokenForRows(rows []client.ImportRow) (string, error) {
	encoded, err := json.Marshal(rows)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(encoded)
	return hex.EncodeToString(sum[:]), nil
}

func renderImportError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.Templates.ExecuteTemplate(w, "import-result", ImportResultView{Error: message})
}

// ImportPreview parses an uploaded CSV, asks the main app to classify each
// row (dry run, no writes), stashes the parsed rows behind a token, and
// renders the preview table.
func (s *Server) ImportPreview(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxImportUploadSize); err != nil {
		renderImportError(w, "Invalid file upload")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		renderImportError(w, "Choose a CSV file to upload")
		return
	}
	defer file.Close()

	rows, err := parseInviteeCSV(file)
	if err != nil {
		renderImportError(w, err.Error())
		return
	}

	report, err := s.Client.ImportInvitees(r.Context(), rows, true)
	if err != nil {
		renderImportError(w, errMessage(err))
		return
	}

	token, err := tokenForRows(rows)
	if err != nil {
		renderImportError(w, "Could not prepare preview for confirmation")
		return
	}

	s.pendingMu.Lock()
	s.pendingRows = rows
	s.pendingToken = token
	s.pendingMu.Unlock()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.Templates.ExecuteTemplate(w, "import-result", NewImportResultView(report, token))
}

// ImportConfirm re-submits the rows behind the previously previewed token
// with dryRun=false. A token that doesn't match the pending preview (or no
// pending preview at all) is rejected rather than applied blind.
func (s *Server) ImportConfirm(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		statusMessage(w, "Invalid form submission")
		return
	}

	token := r.PostFormValue("token")

	s.pendingMu.Lock()
	rows := s.pendingRows
	pendingToken := s.pendingToken
	s.pendingMu.Unlock()

	if token == "" || pendingToken == "" || token != pendingToken {
		statusMessage(w, "Preview is stale — upload again")
		return
	}

	report, err := s.Client.ImportInvitees(r.Context(), rows, false)
	if err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	s.pendingMu.Lock()
	s.pendingRows = nil
	s.pendingToken = ""
	s.pendingMu.Unlock()

	dashboard, err := s.loadDashboard(r.Context())
	if err != nil {
		statusMessage(w, errMessage(err))
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.Templates.ExecuteTemplate(w, "import-success", struct {
		Report    client.ImportReport
		Dashboard dashboardData
	}{Report: *report, Dashboard: dashboard})
}

// ImportRowView adds a display-ready combined guest label to a report row.
type ImportRowView struct {
	client.ImportReportRow
	Guests string
}

// ImportResultView is the payload for the "import-result" fragment: either
// a bare error message (upload/parse/API failure) or a classified preview
// with a confirmation token.
type ImportResultView struct {
	Error  string
	Report *client.ImportReport
	Rows   []ImportRowView
	Token  string
}

func NewImportResultView(report *client.ImportReport, token string) ImportResultView {
	rows := make([]ImportRowView, len(report.Rows))
	for i, row := range report.Rows {
		guests := row.Guest1
		if row.Guest2 != "" {
			guests += " & " + row.Guest2
		}
		rows[i] = ImportRowView{ImportReportRow: row, Guests: guests}
	}
	return ImportResultView{Report: report, Rows: rows, Token: token}
}
