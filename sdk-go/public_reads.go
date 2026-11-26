package custd

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

// AuthDomainMonitoringKeyHeader carries the external checker's monitoring key.
const AuthDomainMonitoringKeyHeader = "X-Custd-Auth-Domain-Monitoring-Key"

// AppDiscoverySignIn is a hosted app's browser sign-in registration. Pages use
// the authorization-code flow with PKCE and send the access token to the app
// item routes as X-Custd-User-Token.
type AppDiscoverySignIn struct {
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorizationEndpoint"`
	TokenEndpoint         string `json:"tokenEndpoint"`
	EndSessionEndpoint    string `json:"endSessionEndpoint"`
	ClientID              string `json:"clientId"`
	Audience              string `json:"audience"`
	RedirectURI           string `json:"redirectUri"`
	PostLogoutRedirectURI string `json:"postLogoutRedirectUri"`
}

// AppDiscoveryDocument is a hosted app's public /.well-known/custd.json: where
// its API is, its public Site key and what it can do.
type AppDiscoveryDocument struct {
	APIBaseURL            string              `json:"apiBaseUrl"`
	Host                  string              `json:"host"`
	SiteUUID              string              `json:"siteUuid"`
	BrowserKey            string              `json:"browserKey"`
	Environment           string              `json:"environment"`
	Capabilities          []string            `json:"capabilities"`
	SignIn                *AppDiscoverySignIn `json:"signIn,omitempty"`
	IdentityMode          string              `json:"identityMode"`
	AllowedOrigins        []string            `json:"allowedOrigins"`
	PageViewSchemaVersion string              `json:"pageViewSchemaVersion,omitempty"`
}

// AuthDomainMonitoringInventory is the realm hostnames the external checker
// probes. A host that leaves Hosts without appearing in RetiredHosts was lost,
// not retired.
type AuthDomainMonitoringInventory struct {
	Hosts        []string `json:"hosts"`
	RetiredHosts []string `json:"retiredHosts"`
}

// GetAppDiscovery reads a hosted app's public discovery document by host. It
// sends no credential; a host that serves no app answers 404.
func (c *CustdClient) GetAppDiscovery(ctx context.Context, host string) (*AppDiscoveryDocument, error) {
	var out AppDiscoveryDocument
	err := c.publicRead(ctx, "/api/v1/app-hosts/"+url.PathEscape(host)+"/discovery", nil, &out)
	return &out, err
}

// GetSharedSiteReport reads the site report a share link opens. The share
// token is the only authority, so no client credential is sent.
func (c *CustdClient) GetSharedSiteReport(ctx context.Context, token string) (*AdminSiteReport, error) {
	if strings.TrimSpace(token) == "" {
		return nil, fmt.Errorf("custd: shared site report requires a share token")
	}
	var out AdminSiteReport
	err := c.publicRead(ctx, "/api/v1/shared-site-reports/"+url.PathEscape(token), nil, &out)
	return &out, err
}

// GetAuthDomainMonitoringInventory returns the realm hostnames the external
// checker may probe. The monitoring key is its only credential.
func (c *CustdClient) GetAuthDomainMonitoringInventory(
	ctx context.Context, monitoringKey string,
) (*AuthDomainMonitoringInventory, error) {
	if strings.TrimSpace(monitoringKey) == "" {
		return nil, fmt.Errorf("custd: auth domain monitoring requires a monitoring key")
	}
	var out AuthDomainMonitoringInventory
	headers := map[string]string{AuthDomainMonitoringKeyHeader: monitoringKey}
	err := c.publicRead(ctx, "/api/v1/auth-domain-monitoring/inventory", headers, &out)
	return &out, err
}

// publicRead issues a GET that carries none of the client's own credentials.
func (c *CustdClient) publicRead(ctx context.Context, path string, headers map[string]string, out any) error {
	request := map[string]string{"X-Custd-Sdk": sdkIdentity}
	for name, value := range headers {
		request[name] = value
	}
	response, err := c.requestApplication(ctx, &HTTPRequest{
		Method: http.MethodGet, URL: strings.TrimRight(c.config.BaseURL, "/") + path, Headers: request,
	})
	if err != nil {
		return err
	}
	if err := c.checkStatus(response.StatusCode, response.Body); err != nil {
		return err
	}
	if err := unmarshalResponse(response.Body, out); err != nil {
		return validationWrap("custd: decode public response", err)
	}
	return nil
}
