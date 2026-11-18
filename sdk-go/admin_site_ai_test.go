package custd

import (
	"context"
	"net/http"
	"testing"
)

func TestSiteAIClient(t *testing.T) {
	const tenantBase = "http://localhost:8080/api/v1/site-domains"
	const settingsResponse = `{"aiMode":"own-key","monthlyCapUsdMicros":10000000,"keyConfigured":true,"currentTermsVersion":"test-v1","acceptedTermsVersion":"test-v1","consentAcceptedAt":"2026-11-18T01:00:00Z"}`
	doer := newCaptureDoer(http.StatusOK, settingsResponse)
	admin := newAdminTestClient(t, doer, "http://localhost:8080").Admin
	ctx := context.Background()
	settings, err := admin.SiteDomains.GetAISettings(ctx)
	if err != nil || settings.CurrentTermsVersion != "test-v1" || settings.ConsentAcceptedAt == nil {
		t.Fatalf("settings = %+v, %v", settings, err)
	}
	settings, err = admin.SiteDomains.SetAISettings(ctx, SiteAISettingsRequest{Mode: SiteAIOwnKey, MonthlyCapUSDMicros: 10_000_000, APIKey: "test-only-key"})
	if err != nil || !settings.KeyConfigured {
		t.Fatalf("updated settings = %+v, %v", settings, err)
	}
	_, err = admin.SiteDomains.SetAIConsent(ctx, SiteAIConsentRequest{Action: SiteAIGrantConsent, TermsVersion: "test-v1"})
	if err != nil {
		t.Fatal(err)
	}
	doer.body = `{"period":"month","aiMode":"own-key","rows":[{"attempts":1,"unknownCostAttempts":1,"capAccountedUsdMicros":315188}]}`
	tenant, err := admin.SiteDomains.GetAIUsage(ctx)
	if err != nil || len(tenant.Rows) != 1 || tenant.Rows[0].CapAccountedUSDMicros != 315188 {
		t.Fatalf("tenant usage = %+v, %v", tenant, err)
	}
	doer.body = `{"period":"day","samplingMonthlyCapUsdMicros":10000000,"rows":[{"tenantSlug":"demo","estimatedCostUsdMicros":601}]}`
	platform, _, err := admin.System.GetSiteAIUsage(ctx, SiteAIUsageDay)
	if err != nil || len(platform.Rows) != 1 || platform.Rows[0].TenantSlug != "demo" || platform.Rows[0].EstimatedCostUSDMicros != 601 {
		t.Fatalf("platform usage = %+v, %v", platform, err)
	}
	assertSiteRequests(t, doer.requests, []string{
		"GET " + tenantBase + "/ai-settings",
		"PUT " + tenantBase + "/ai-settings",
		"PUT " + tenantBase + "/ai-settings/consent",
		"GET " + tenantBase + "/ai-usage",
		"GET http://localhost:8080/api/v1/admin/site-insights/ai-usage?period=day",
	})
	if body := string(doer.requests[1].Body); body != `{"aiMode":"own-key","monthlyCapUsdMicros":10000000,"apiKey":"test-only-key"}` {
		t.Fatalf("settings body = %s", body)
	}
	if body := string(doer.requests[2].Body); body != `{"action":"grant","termsVersion":"test-v1"}` {
		t.Fatalf("consent body = %s", body)
	}
}
