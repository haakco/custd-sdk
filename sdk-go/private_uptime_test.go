package custd

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSubmitPrivateUptime(t *testing.T) {
	token := strings.Repeat("a", 64)
	path := "/api/v1/site-private-uptime-reports/acme/monitor"
	report := PrivateUptimeReport{ReportUUID: "fixture", ObservedAt: time.Now().UTC(), StatusCode: 200, ResponseMs: 12}
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.Method != http.MethodPost || r.URL.Path != path || r.Header.Get("Authorization") != "Bearer "+token {
			t.Error("private uptime request did not use the bound report route and credential")
		}
		var got PrivateUptimeReport
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil || got != report {
			t.Errorf("unexpected report: %+v, error %v", got, err)
		}
		if calls > 1 {
			http.Redirect(w, r, "/other", http.StatusTemporaryRedirect)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	t.Cleanup(server.Close)
	destination := PrivateUptimeDestination{BaseURL: server.URL, ReportPath: path, WriteToken: token}
	if err := SubmitPrivateUptime(context.Background(), destination, report); err != nil {
		t.Fatal(err)
	}
	if err := SubmitPrivateUptime(context.Background(), destination, report); err == nil {
		t.Fatal("redirect was accepted as an observation receipt")
	}
	if calls != 2 {
		t.Fatalf("made %d requests, want two", calls)
	}
}
