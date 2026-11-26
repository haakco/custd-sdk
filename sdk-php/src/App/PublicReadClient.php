<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeReport;
use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeWork;
use HaakCo\Custd\Admin\SiteDomain\SiteAIOwnerHandoff;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatReceipt;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatReport;
use HaakCo\Custd\Admin\SiteDomain\SiteReport;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPage;

/**
 * PublicReadClient sends the Custd routes that take no client credential: a hosted app's discovery
 * document, a Site's browser configuration, a shared site report (its share token is the only
 * authority), a published status page and its email subscriptions, the auth-domain monitoring inventory
 * (its monitoring key is the credential), a job or private-network monitor's reports (the monitor's write
 * token is the credential) and the redemption of an AI settings owner handoff.
 */
final class PublicReadClient
{
    private const STATUS_PAGES = '/api/v1/public-status-pages/';
    private const HEARTBEAT_REPORTS = '/api/v1/site-heartbeat-reports/';
    private const PRIVATE_UPTIME_REPORTS = '/api/v1/site-private-uptime-reports/';

    private readonly AppHttp $http;

    /** @var callable|null */
    private $transport;

    public function __construct(string $apiBaseUrl, ?callable $transport = null)
    {
        $this->http = new AppHttp($apiBaseUrl, $transport);
        $this->transport = $transport;
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

    /** The status page published under its public key. */
    public function statusPage(string $key): SiteStatusPage
    {
        return SiteStatusPage::fromPayload($this->http->object('GET', self::statusPagePath($key), [], null, '', []));
    }

    /**
     * Ask for status updates by email. Custd mails a confirmation link; the answer is the same whether or not
     * the page exists, so it cannot be used to discover pages.
     */
    public function subscribeToStatusPage(string $key, string $email): void
    {
        $this->http->send('POST', self::statusPagePath($key) . '/subscribe', [], ['email' => $email], '', []);
    }

    /** Confirm a subscription with the token from its confirmation email. */
    public function confirmStatusPageSubscription(string $key, #[\SensitiveParameter] string $token): void
    {
        $this->http->send('POST', self::statusPagePath($key) . '/confirm-subscription', [], ['token' => $token], '', []);
    }

    /** End a subscription with the token from any update email. */
    public function unsubscribeFromStatusPage(string $key, #[\SensitiveParameter] string $token): void
    {
        $this->http->send('POST', self::statusPagePath($key) . '/unsubscribe', [], ['token' => $token], '', []);
    }

    /**
     * Report one scheduled job run with the heartbeat monitor's report path and write token, and return the
     * first accepted receipt for that run.
     */
    public function submitSiteHeartbeat(string $reportPath, #[\SensitiveParameter] string $writeToken, SiteHeartbeatReport $report): SiteHeartbeatReceipt
    {
        $path = self::monitorPath($reportPath, self::HEARTBEAT_REPORTS, $writeToken);

        return SiteHeartbeatReceipt::fromPayload($this->http->object('POST', $path, [], $report->toPayload(), $writeToken, []));
    }

    /** Report one check a private-network probe ran, with the monitor's report path and write token. */
    public function submitPrivateUptime(string $reportPath, #[\SensitiveParameter] string $writeToken, PrivateUptimeReport $report): void
    {
        $path = self::monitorPath($reportPath, self::PRIVATE_UPTIME_REPORTS, $writeToken);
        $this->http->send('POST', $path, [], $report->toPayload(), $writeToken, []);
    }

    /** Read whether the private-network monitor has a check waiting, with its report path and write token. */
    public function getPrivateUptimeWork(string $reportPath, #[\SensitiveParameter] string $writeToken): PrivateUptimeWork
    {
        $path = self::monitorPath($reportPath, self::PRIVATE_UPTIME_REPORTS, $writeToken);

        return PrivateUptimeWork::fromPayload($this->http->object('GET', $path, [], null, $writeToken, []));
    }

    /**
     * Open an AI settings owner session from a handoff a broker issued. $hubOrigin is the broker's registered
     * hub origin the handoff was issued for; the code is posted as the browser form the route expects.
     */
    public function redeemSiteAIOwnerHandoff(SiteAIOwnerHandoff $handoff, string $hubOrigin): SiteAIOwnerSession
    {
        $origin = SiteAIOwnerSession::originOf($handoff->redeemUrl);
        if ($handoff->code === '' || trim($hubOrigin) === '') {
            throw new \InvalidArgumentException('custd: an AI owner handoff needs its code and the hub origin');
        }
        $session = new AppHttp($origin, $this->transport);
        $answer = $session->exchange('POST', SiteAIOwnerSession::PATH . '/redeem', [], http_build_query(['code' => $handoff->code]), '', [
            'Content-Type' => 'application/x-www-form-urlencoded', 'Origin' => $hubOrigin,
        ]);
        if ($answer['status'] !== 303) {
            Http::successBody($answer);
            throw new \UnexpectedValueException("custd: the AI owner redeem answered HTTP {$answer['status']}, not 303");
        }

        return new SiteAIOwnerSession($session, $origin, SiteAIOwnerSession::handleFrom($answer['headers'] ?? []));
    }

    /**
     * Resume an owner session opened on an earlier request from its origin and handle, and the binding its
     * last settings read returned (empty reads it again before the first write).
     */
    public function resumeSiteAIOwnerSession(string $origin, #[\SensitiveParameter] string $handle, string $binding = ''): SiteAIOwnerSession
    {
        $origin = SiteAIOwnerSession::checkedOrigin($origin);
        if ($handle === '') {
            throw new \InvalidArgumentException('custd: an AI owner session needs its handle');
        }

        return new SiteAIOwnerSession(new AppHttp($origin, $this->transport), $origin, $handle, $binding);
    }

    private static function statusPagePath(string $key): string
    {
        if (trim($key) === '') {
            throw new \InvalidArgumentException('custd: a public status page needs its key');
        }

        return self::STATUS_PAGES . rawurlencode($key);
    }

    /**
     * The monitor's own report path, checked against its route so a stored path cannot send the write token
     * anywhere else.
     */
    private static function monitorPath(string $reportPath, string $prefix, string $writeToken): string
    {
        $segments = str_starts_with($reportPath, $prefix) ? explode('/', substr($reportPath, strlen($prefix))) : [];
        $valid = count($segments) === 2 && preg_match('/^[A-Za-z0-9_-]+$/', $segments[0]) === 1
            && preg_match('/^[A-Za-z0-9-]+$/', $segments[1]) === 1;
        if (!$valid || strlen($writeToken) !== 64) {
            throw new \InvalidArgumentException("custd: a monitor report needs its {$prefix}<tenant>/<monitor> path and 64-character write token");
        }

        return $reportPath;
    }
}
