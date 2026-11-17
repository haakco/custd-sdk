<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteRankings;
use HaakCo\Custd\Admin\SiteDomain\SiteTrackedKeyword;
use HaakCo\Custd\Admin\SiteDomain\SiteTrackKeywordRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteUpdateTrackedKeywordRequest;

/**
 * SiteRankingClient tracks a domain's own keyword positions from Search Console. It is reached
 * through SiteDomainClient::rankings(). A system administrator names the tenant with the company
 * slug; a tenant credential leaves it null.
 */
final class SiteRankingClient
{
    /** The problem code of the 400 returned for a bad keyword, country, device or notify position. */
    public const TRACKED_KEYWORD_INVALID_CODE = 'site_tracked_keyword_invalid';

    /** The problem code of the 409 returned once the Site tracks SiteRankings::MAX_KEYWORDS keywords. */
    public const TRACKED_KEYWORD_LIMIT_CODE = 'site_tracked_keyword_limit';

    /** The problem code of the 409 returned when the domain already tracks the keyword in that country and device. */
    public const TRACKED_KEYWORD_DUPLICATE_CODE = 'site_tracked_keyword_duplicate';

    /** The problem code of the 404 returned when the domain does not track the keyword. */
    public const TRACKED_KEYWORD_NOT_FOUND_CODE = 'site_tracked_keyword_not_found';

    /** The problem code of the 400 returned unless days is 1 to SiteRankings::MAX_DAYS. */
    public const RANKINGS_DAYS_INVALID_CODE = 'site_rankings_days_invalid';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read the tracked keywords over the last $days days; null uses SiteRankings::DEFAULT_DAYS. */
    public function getRankings(string $domainUuid, ?int $days = null, ?string $companySlug = null): SiteRankings
    {
        $query = SiteDomainHttp::query(['days' => $days]);

        return SiteRankings::fromPayload(
            $this->http->send('GET', SiteDomainHttp::item($domainUuid) . '/rankings', $query, $companySlug)
        );
    }

    /** Start tracking a keyword (201). Refusals carry the TRACKED_KEYWORD_* codes. */
    public function trackKeyword(
        string $domainUuid,
        SiteTrackKeywordRequest $request,
        ?string $companySlug = null,
    ): SiteTrackedKeyword {
        return SiteTrackedKeyword::fromPayload(
            $this->http->send('POST', self::keywords($domainUuid), [], $companySlug, $request->serialise())
        );
    }

    /** Pause or resume a tracked keyword and set its alert position. */
    public function updateTrackedKeyword(
        string $domainUuid,
        string $keywordUuid,
        SiteUpdateTrackedKeywordRequest $request,
        ?string $companySlug = null,
    ): SiteTrackedKeyword {
        return SiteTrackedKeyword::fromPayload($this->http->send(
            'PUT',
            self::keyword($domainUuid, $keywordUuid),
            [],
            $companySlug,
            $request->serialise()
        ));
    }

    /** Stop tracking a keyword. The route returns 204 No Content. */
    public function untrackKeyword(string $domainUuid, string $keywordUuid, ?string $companySlug = null): void
    {
        $this->http->sendNoContent('DELETE', self::keyword($domainUuid, $keywordUuid), [], $companySlug);
    }

    private static function keywords(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/rankings/keywords';
    }

    private static function keyword(string $domainUuid, string $keywordUuid): string
    {
        return self::keywords($domainUuid) . '/' . rawurlencode($keywordUuid);
    }
}
