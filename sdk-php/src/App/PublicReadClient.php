<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\SiteDomain\SiteReport;

/**
 * PublicReadClient reads the Custd routes that take no client credential: a hosted app's discovery
 * document, a Site's browser configuration, a shared site report (its share token is the only
 * authority) and the auth-domain monitoring inventory (its monitoring key is the credential).
 */
final class PublicReadClient
{
    private readonly AppHttp $http;

    public function __construct(string $apiBaseUrl, ?callable $transport = null)
    {
        $this->http = new AppHttp($apiBaseUrl, $transport);
    }

    /** The site report a share link opens. */
    public function sharedSiteReport(string $token): SiteReport
    {
        if (trim($token) === '') {
            throw new \InvalidArgumentException('custd: a shared site report needs its share token');
        }

        return SiteReport::fromPayload($this->http->object('GET', '/api/v1/shared-site-reports/' . rawurlencode($token), [], null, '', []));
    }

    /**
     * Read the discovery document a hosted application serves as /.well-known/custd.json.
     */
    public function appDiscovery(string $host): AppDiscovery
    {
        return AppDiscovery::fromPayload($this->http->object('GET', '/api/v1/app-hosts/' . rawurlencode($host) . '/discovery', [], null, '', []));
    }

    /**
     * Get public site config.
     */
    public function siteConfig(string $siteUuid): SiteConfigResponse
    {
        return SiteConfigResponse::fromPayload($this->http->object('GET', '/api/v1/sites/' . rawurlencode($siteUuid) . '/config', [], null, '', []));
    }

    /**
     * Read the realm hostnames the external checker may probe; the monitoring key is its only credential.
     */
    public function authDomainMonitoringInventory(string $monitoringKey): AuthDomainMonitoringInventory
    {
        return AuthDomainMonitoringInventory::fromPayload($this->http->object('GET', '/api/v1/auth-domain-monitoring/inventory', [], null, '', ['X-Custd-Auth-Domain-Monitoring-Key' => $monitoringKey]));
    }
}
