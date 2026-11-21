package custd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// PrivateUptimeReport is one observation from a probe inside the monitored network.
type PrivateUptimeReport struct {
	ReportUUID string    `json:"reportUuid"`
	ObservedAt time.Time `json:"observedAt"`
	StatusCode int       `json:"statusCode,omitempty"`
	ResponseMs int       `json:"responseMs"`
	Failure    string    `json:"failure,omitempty"`
}

// PrivateUptimeDestination identifies one monitor and its write credential.
// Configure it through trusted deployment settings. Never log the token.
type PrivateUptimeDestination struct {
	BaseURL    string
	ReportPath string
	WriteToken string
}

// SubmitPrivateUptime sends an observation using only the monitor's write credential.
func SubmitPrivateUptime(ctx context.Context, destination PrivateUptimeDestination, report PrivateUptimeReport) error {
	endpoint, err := privateUptimeEndpoint(destination)
	if err != nil {
		return err
	}
	body, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("custd: encode private uptime observation: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("custd: build private uptime upload: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+destination.WriteToken)
	req.Header.Set("X-Custd-Sdk", sdkIdentity)
	client := &http.Client{
		Timeout:       defaultHTTPTimeout,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	response, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("custd: upload private uptime observation: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusNoContent {
		return fmt.Errorf("custd: private uptime upload returned HTTP %d", response.StatusCode)
	}
	return nil
}

func privateUptimeEndpoint(destination PrivateUptimeDestination) (string, error) {
	base, err := url.Parse(destination.BaseURL)
	if err != nil || base.Hostname() == "" || base.User != nil || base.RawQuery != "" ||
		base.ForceQuery || base.Fragment != "" || (base.Path != "" && base.Path != "/") ||
		!isSecureOrLocalHTTP(destination.BaseURL) {
		return "", fmt.Errorf("custd: private uptime requires an HTTPS API origin")
	}
	const prefix = "/api/v1/site-private-uptime-reports/"
	tenant, monitor, ok := strings.Cut(strings.TrimPrefix(destination.ReportPath, prefix), "/")
	if !strings.HasPrefix(destination.ReportPath, prefix) || !ok || tenant == "" ||
		monitor == "" || strings.ContainsAny(tenant+monitor, "/?#") || len(destination.WriteToken) != 64 {
		return "", fmt.Errorf("custd: private uptime requires a report path and write credential")
	}
	return strings.TrimRight(destination.BaseURL, "/") + destination.ReportPath, nil
}
