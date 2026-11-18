<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\AccessLogHourReplay;
use HaakCo\Custd\Admin\SiteDomain\SiteAIVisibility;
use HaakCo\Custd\Admin\SiteDomain\SiteTraffic;

/**
 * SiteAccessLogClient reads a domain's traffic from its access logs and asks for an hour of logs
 * to be read again. It is reached through SiteDomainClient::accessLogs(). Days are UTC
 * YYYY-MM-DD; null leaves the range to the server. A system administrator names the tenant with
 * the company slug.
 */
final class SiteAccessLogClient
{
    /** The problem code of the 400 returned unless hourStart starts a finished UTC hour of the last 28 days. */
    public const ACCESS_LOG_HOUR_INVALID_CODE = 'access_log_hour_invalid';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read requests, 404s, slow paths, countries, referrers and crawlers over the days $from..$to. */
    public function getTraffic(
        string $domainUuid,
        ?string $from = null,
        ?string $to = null,
        ?string $companySlug = null,
    ): SiteTraffic {
        return SiteTraffic::fromPayload($this->read($domainUuid, '/traffic', $from, $to, $companySlug));
    }

    /** Read how AI crawlers read the domain and how often AI assistants refer visitors to it. */
    public function getAIVisibility(
        string $domainUuid,
        ?string $from = null,
        ?string $to = null,
        ?string $companySlug = null,
    ): SiteAIVisibility {
        return SiteAIVisibility::fromPayload($this->read($domainUuid, '/ai-visibility', $from, $to, $companySlug));
    }

    /**
     * Queue one finished UTC hour of access logs to be read again (202), for every domain. System
     * administrators only. A bad hour throws {@see self::ACCESS_LOG_HOUR_INVALID_CODE}.
     */
    public function replayAccessLogHour(\DateTimeInterface $hourStart): AccessLogHourReplay
    {
        $utc = \DateTimeImmutable::createFromInterface($hourStart)->setTimezone(new \DateTimeZone('UTC'));

        return AccessLogHourReplay::fromPayload($this->http->send(
            'POST',
            '/admin/access-log-hours/replay',
            [],
            null,
            ['hourStart' => $utc->format('Y-m-d\TH:i:s\Z')]
        ));
    }

    private function read(string $domainUuid, string $route, ?string $from, ?string $to, ?string $companySlug): \stdClass
    {
        return $this->http->send(
            'GET',
            SiteDomainHttp::item($domainUuid) . $route,
            SiteDomainHttp::query(['from' => $from, 'to' => $to]),
            $companySlug
        );
    }
}
