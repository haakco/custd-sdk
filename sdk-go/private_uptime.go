package custd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// PrivateUptimeReport is an observation from a probe inside the monitored network.
type PrivateUptimeReport struct {
	ReportUUID string    `json:"reportUuid"`
	ObservedAt time.Time `json:"observedAt"`
	StatusCode int       `json:"statusCode,omitempty"`
	ResponseMs int       `json:"responseMs"`
	Failure    string    `json:"failure,omitempty"`
}

// PrivateUptimeDestination holds the API origin and the monitor's report path and write token.
type PrivateUptimeDestination struct {
	BaseURL    string
	ReportPath string
	WriteToken string
}

// SubmitPrivateUptime sends a report using only the monitor's write credential.
func SubmitPrivateUptime(ctx context.Context, destination PrivateUptimeDestination, report PrivateUptimeReport) error {
	body, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("custd: encode uptime report: %w", err)
	}
	response, err := privateUptimeRequest(ctx, destination, http.MethodPost, body)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusNoContent {
		return fmt.Errorf("custd: uptime report returned HTTP %d", response.StatusCode)
	}
	return nil
}

// PrivateUptimeWork is the pending check for the configured monitor, if any.
type PrivateUptimeWork struct {
	RequestedAt *time.Time `json:"requestedAt,omitempty"`
}

// GetPrivateUptimeWork reads pending check work using the monitor credential.
func GetPrivateUptimeWork(ctx context.Context, destination PrivateUptimeDestination) (PrivateUptimeWork, error) {
	var work PrivateUptimeWork
	response, err := privateUptimeRequest(ctx, destination, http.MethodGet, nil)
	if err != nil {
		return work, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return work, fmt.Errorf("custd: uptime work returned HTTP %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, 1025))
	if err != nil {
		return work, fmt.Errorf("custd: read uptime work: %w", err)
	}
	if len(body) > 1024 {
		return work, fmt.Errorf("custd: uptime work exceeds 1024 bytes")
	}
	if err := json.Unmarshal(body, &work); err != nil {
		return work, fmt.Errorf("custd: decode uptime work: %w", err)
	}
	return work, nil
}

func privateUptimeRequest(ctx context.Context, destination PrivateUptimeDestination, method string, body []byte) (*http.Response, error) {
	endpoint, err := privateUptimeEndpoint(destination)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("custd: build uptime report request: %w", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Authorization", "Bearer "+destination.WriteToken)
	req.Header.Set("X-Custd-Sdk", sdkIdentity)
	client := &http.Client{
		Timeout:       defaultHTTPTimeout,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	response, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("custd: submit uptime report: %w", err)
	}
	return response, nil
}

func privateUptimeEndpoint(destination PrivateUptimeDestination) (string, error) {
	base, err := url.Parse(destination.BaseURL)
	if err != nil || base.Hostname() == "" || base.User != nil || base.RawQuery != "" ||
		base.ForceQuery || base.Fragment != "" || (base.Path != "" && base.Path != "/") ||
		!isSecureOrLocalHTTP(destination.BaseURL) {
		return "", fmt.Errorf("custd: private uptime requires an HTTPS API origin")
	}
	const prefix = "/api/v1/site-private-uptime-reports/"
	suffix, prefixed := strings.CutPrefix(destination.ReportPath, prefix)
	tenant, monitor, split := strings.Cut(suffix, "/")
	if !prefixed || !split || !validPrivateUptimeSegment(tenant) ||
		!validPrivateUptimeSegment(monitor) || len(destination.WriteToken) != 64 {
		return "", fmt.Errorf("custd: private uptime requires a report path and write credential")
	}
	return strings.TrimRight(destination.BaseURL, "/") + destination.ReportPath, nil
}

func validPrivateUptimeSegment(segment string) bool {
	decoded, err := url.PathUnescape(segment)
	return err == nil && decoded != "" && decoded != "." && decoded != ".." &&
		!strings.ContainsAny(decoded, "/\\?#")
}
