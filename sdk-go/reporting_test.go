package custd

import (
	"context"
	"encoding/json"
	"net/http"
	"reflect"
	"strings"
	"testing"
)

func TestReportingDashboardReadsAwthyDashboard(t *testing.T) {
	doer := newCaptureDoer(http.StatusOK, string(readContractFixture(t, "reporting-dashboard-awthy.json")))
	client := newAdminTestClient(t, doer, "http://localhost:8080")

	dashboard, err := client.Reporting.Dashboard(context.Background(), "awthy_managed_audit_reporting")
	if err != nil {
		t.Fatalf("Dashboard returned error: %v", err)
	}
	if dashboard.Key != "awthy_managed_audit_reporting" || len(dashboard.Widgets) != 1 {
		t.Fatalf("dashboard = %#v", dashboard)
	}
	if dashboard.DefaultRange != "14d" || dashboard.RefreshSeconds != 300 || !reflect.DeepEqual(dashboard.RequiredScopes, []string{"reporting:read"}) {
		t.Fatalf("dashboard metadata = %#v", dashboard)
	}
	widget := dashboard.Widgets[0]
	if widget.Template != "awthy_secure_checkout_flow" || !reflect.DeepEqual(widget.Metrics, []string{"flow_completion_rate"}) || !reflect.DeepEqual(widget.Dimensions, []string{"flow_step"}) {
		t.Fatalf("dashboard widget = %#v", widget)
	}
	if doer.requests[0].URL != "http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting" {
		t.Fatalf("url = %s", doer.requests[0].URL)
	}
}

func TestReportingQueryReturnsTrustDiagnostics(t *testing.T) {
	doer := newCaptureDoer(http.StatusOK, string(readContractFixture(t, "reporting-query-awthy-trust.json")))
	client := newAdminTestClient(t, doer, "http://localhost:8080")

	requestFixtureBytes := readContractFixture(t, "reporting-query-max-rows.json")
	var request ReportingQueryRequest
	if err := json.Unmarshal(requestFixtureBytes, &request); err != nil {
		t.Fatalf("decode request fixture: %v", err)
	}
	widget, err := client.Reporting.Query(context.Background(), request)
	if err != nil {
		t.Fatalf("Query returned error: %v", err)
	}
	if widget.Trust == nil || widget.Trust.Status != "healthy" || widget.Trust.RollupState != "healthy" {
		t.Fatalf("trust = %#v", widget.Trust)
	}
	if widget.Count != 2 || !widget.Complete || widget.Truncated || widget.QueryDurationMs != 42 || widget.ParquetURICount != 1 || widget.SnapshotAgeMs != 120000 || widget.EventLagP95Ms != 8000 || widget.DeltaCount != 1 || widget.DeltaPercent != 100 || widget.DeltaLabel != "vs previous period" || widget.SecondaryLabel != "completed checkouts" {
		t.Fatalf("widget metadata = %#v", widget)
	}
	if len(widget.Buckets) != 1 || widget.Buckets[0].Source != "auto" || !widget.Buckets[0].Complete || widget.Buckets[0].QueryDurationMs != 42 || widget.Buckets[0].ParquetURICount != 1 {
		t.Fatalf("bucket metadata = %#v", widget.Buckets)
	}
	if widget.Trust.SchemaVersion != "awthy-audit-event/1.0.0" || widget.Trust.Coverage != "complete" || widget.Trust.PermissionClass != "reporting.read" || len(widget.Trust.QueryWarnings) != 0 {
		t.Fatalf("trust metadata = %#v", widget.Trust)
	}
	var requestBody map[string]any
	if err := json.Unmarshal(doer.requests[0].Body, &requestBody); err != nil {
		t.Fatalf("decode request body: %v", err)
	}
	var requestFixture map[string]any
	if err := json.Unmarshal(requestFixtureBytes, &requestFixture); err != nil {
		t.Fatalf("decode request fixture: %v", err)
	}
	if !reflect.DeepEqual(requestBody, requestFixture) {
		t.Fatalf("request body = %#v, want %#v", requestBody, requestFixture)
	}
	if requestBody["maxRows"] != float64(50) {
		t.Fatalf("maxRows = %#v, want 50", requestBody["maxRows"])
	}
	if _, ok := requestBody["rowLimit"]; ok {
		t.Fatalf("request body contains rowLimit: %#v", requestBody)
	}
}

func TestReportingQueryRejectsUnsafeTrustDiagnostics(t *testing.T) {
	doer := newCaptureDoer(http.StatusOK, string(readContractFixture(t, "reporting-query-unsafe-trust.json")))
	client := newAdminTestClient(t, doer, "http://localhost:8080")

	_, err := client.Reporting.Query(context.Background(), ReportingQueryRequest{
		Template:  "awthy_secure_checkout_flow",
		Metrics:   []string{"flow_completion_rate"},
		RangeDays: 1,
	})
	if err == nil || !strings.Contains(err.Error(), "unsafe reporting trust diagnostics") {
		t.Fatalf("error = %v, want unsafe reporting trust diagnostics", err)
	}
}
