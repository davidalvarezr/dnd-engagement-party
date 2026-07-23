package handlers

import (
	"strings"
	"testing"
)

func TestParseInviteeCSVGoodHeader(t *testing.T) {
	input := "guest1,guest2,code\n" +
		"Alice Example,Bob Example,\n" +
		"Carol Example,,00000000-0000-4000-8000-00000000000d\n"

	rows, err := parseInviteeCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("parseInviteeCSV() error = %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("len(rows) = %d, want 2", len(rows))
	}
	if rows[0].Line != 2 || rows[0].Guest1 != "Alice Example" || rows[0].Guest2 != "Bob Example" || rows[0].Code != "" {
		t.Errorf("rows[0] = %+v", rows[0])
	}
	if rows[1].Line != 3 || rows[1].Guest1 != "Carol Example" || rows[1].Guest2 != "" {
		t.Errorf("rows[1] = %+v", rows[1])
	}
	if rows[1].Code != "00000000-0000-4000-8000-00000000000d" {
		t.Errorf("rows[1].Code = %q", rows[1].Code)
	}
}

func TestParseInviteeCSVStripsBOM(t *testing.T) {
	input := csvBOM + "guest1,guest2,code\nAlice Example,,\n"

	rows, err := parseInviteeCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("parseInviteeCSV() error = %v", err)
	}
	if len(rows) != 1 || rows[0].Guest1 != "Alice Example" {
		t.Errorf("rows = %+v", rows)
	}
}

func TestParseInviteeCSVRejectsWrongHeader(t *testing.T) {
	input := "name,partner,invite_code\nAlice Example,,\n"

	_, err := parseInviteeCSV(strings.NewReader(input))
	if err == nil {
		t.Fatal("expected an error for the wrong header")
	}
}

func TestParseInviteeCSVRejectsWrongFieldCount(t *testing.T) {
	input := "guest1,guest2,code\nAlice Example,Bob Example\n"

	_, err := parseInviteeCSV(strings.NewReader(input))
	if err == nil {
		t.Fatal("expected an error for a row with the wrong number of fields")
	}
}

func TestParseInviteeCSVAllowsEmptyGuest2(t *testing.T) {
	input := "guest1,guest2,code\nAlice Example,,\n"

	rows, err := parseInviteeCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("parseInviteeCSV() error = %v", err)
	}
	if len(rows) != 1 || rows[0].Guest2 != "" {
		t.Errorf("rows = %+v", rows)
	}
}

func TestParseInviteeCSVRejectsEmptyFile(t *testing.T) {
	_, err := parseInviteeCSV(strings.NewReader(""))
	if err == nil {
		t.Fatal("expected an error for a completely empty file")
	}
}

func TestParseInviteeCSVRejectsHeaderOnlyFile(t *testing.T) {
	_, err := parseInviteeCSV(strings.NewReader("guest1,guest2,code\n"))
	if err == nil {
		t.Fatal("expected an error for a file with no data rows")
	}
}
