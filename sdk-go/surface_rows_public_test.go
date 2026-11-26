package custd

import "context"

var publicReadSurfaceRows = []surfaceRow{
	{
		id:   "admin-api GET /api/v1/app-hosts/{host}/discovery",
		path: "/api/v1/app-hosts/a1/discovery",
		call: func(e *surfaceEnv) error {
			_, err := e.client.GetAppDiscovery(context.Background(), "a1")
			return err
		},
	},
	{
		id:   "admin-api GET /api/v1/shared-site-reports/{token}",
		path: "/api/v1/shared-site-reports/a1",
		call: func(e *surfaceEnv) error {
			_, err := e.client.GetSharedSiteReport(context.Background(), "a1")
			return err
		},
	},
	{
		id:   "admin-api GET /api/v1/auth-domain-monitoring/inventory",
		path: "/api/v1/auth-domain-monitoring/inventory",
		call: func(e *surfaceEnv) error {
			_, err := e.client.GetAuthDomainMonitoringInventory(context.Background(), "k1")
			return err
		},
	},
}
