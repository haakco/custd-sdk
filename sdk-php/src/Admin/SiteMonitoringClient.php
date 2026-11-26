<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeCredential;
use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeMonitor;
use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeRequest;
use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeWork;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatCredential;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatList;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteMaintenanceWindow;
use HaakCo\Custd\Admin\SiteDomain\SiteMaintenanceWindowList;
use HaakCo\Custd\Admin\SiteDomain\SiteMaintenanceWindowRequest;

/**
 * SiteMonitoringClient keeps a domain's scheduled-job heartbeats, its private-network uptime agent and
 * its maintenance windows. It is reached through SiteDomainClient::monitoring(). A system administrator
 * names the tenant with the company slug where a route accepts one; a tenant credential leaves it null.
 * Credentials (heartbeat and agent tokens) are in the create and rotate answers only, once.
 */
final class SiteMonitoringClient
{
    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    public function listHeartbeats(string $domainUuid, ?string $companySlug = null): SiteHeartbeatList
    {
        return SiteHeartbeatList::fromPayload($this->http->send('GET', self::heartbeats($domainUuid), [], $companySlug));
    }

    public function createHeartbeat(string $domainUuid, SiteHeartbeatRequest $request, ?string $companySlug = null): SiteHeartbeatCredential
    {
        return SiteHeartbeatCredential::fromPayload(
            $this->http->send('POST', self::heartbeats($domainUuid), [], $companySlug, $request->serialise())
        );
    }

    /** Replace a heartbeat's report token; the previous token stops working. */
    public function rotateHeartbeat(string $domainUuid, string $monitorUuid, ?string $companySlug = null): SiteHeartbeatCredential
    {
        return SiteHeartbeatCredential::fromPayload(
            $this->http->send('POST', self::heartbeat($domainUuid, $monitorUuid) . '/credential', [], $companySlug)
        );
    }

    public function deleteHeartbeat(string $domainUuid, string $monitorUuid, ?string $companySlug = null): void
    {
        $this->http->sendNoContent('DELETE', self::heartbeat($domainUuid, $monitorUuid), [], $companySlug);
    }

    public function getPrivateUptime(string $domainUuid, ?string $companySlug = null): PrivateUptimeMonitor
    {
        return PrivateUptimeMonitor::fromPayload($this->http->send('GET', self::privateUptime($domainUuid), [], $companySlug));
    }

    public function createPrivateUptime(string $domainUuid, PrivateUptimeRequest $request, ?string $companySlug = null): PrivateUptimeCredential
    {
        return PrivateUptimeCredential::fromPayload(
            $this->http->send('POST', self::privateUptime($domainUuid), [], $companySlug, $request->serialise())
        );
    }

    /** Request a new observation from the private network probe. */
    public function requestPrivateUptime(string $domainUuid, ?string $companySlug = null): PrivateUptimeWork
    {
        return PrivateUptimeWork::fromPayload(
            $this->http->send('POST', self::privateUptime($domainUuid) . '/check', [], $companySlug)
        );
    }

    /** Replace the private agent's report token; the previous token stops working. */
    public function rotatePrivateUptime(string $domainUuid, string $monitorUuid, ?string $companySlug = null): PrivateUptimeCredential
    {
        return PrivateUptimeCredential::fromPayload(
            $this->http->send('POST', self::privateUptimeMonitor($domainUuid, $monitorUuid) . '/credential', [], $companySlug)
        );
    }

    public function deletePrivateUptime(string $domainUuid, string $monitorUuid, ?string $companySlug = null): void
    {
        $this->http->sendNoContent('DELETE', self::privateUptimeMonitor($domainUuid, $monitorUuid), [], $companySlug);
    }

    public function listMaintenance(string $domainUuid, ?string $companySlug = null): SiteMaintenanceWindowList
    {
        return SiteMaintenanceWindowList::fromPayload($this->http->send('GET', self::maintenance($domainUuid), [], $companySlug));
    }

    public function scheduleMaintenance(
        string $domainUuid,
        SiteMaintenanceWindowRequest $request,
        ?string $companySlug = null,
    ): SiteMaintenanceWindow {
        return SiteMaintenanceWindow::fromPayload(
            $this->http->send('POST', self::maintenance($domainUuid), [], $companySlug, $request->serialise())
        );
    }

    public function cancelMaintenance(string $domainUuid, string $windowUuid, ?string $companySlug = null): SiteMaintenanceWindow
    {
        return SiteMaintenanceWindow::fromPayload(
            $this->http->send('DELETE', self::maintenance($domainUuid) . '/' . rawurlencode($windowUuid), [], $companySlug)
        );
    }

    private static function heartbeats(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/heartbeats';
    }

    private static function heartbeat(string $domainUuid, string $monitorUuid): string
    {
        return self::heartbeats($domainUuid) . '/' . rawurlencode($monitorUuid);
    }

    private static function privateUptime(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/private-uptime';
    }

    private static function privateUptimeMonitor(string $domainUuid, string $monitorUuid): string
    {
        return self::privateUptime($domainUuid) . '/' . rawurlencode($monitorUuid);
    }

    private static function maintenance(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/maintenance';
    }
}
