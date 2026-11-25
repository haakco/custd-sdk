<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteStatusPage;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPageDraft;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPagePublication;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPageSettings;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusUpdateHistory;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusUpdateRequest;

/**
 * SiteStatusPageClient publishes the public status page of the Site a domain belongs to. It is
 * reached through SiteDomainClient::statusPage(). Every call names the Site by one of its domains.
 * A system administrator names the tenant with the company slug; a tenant credential leaves it null.
 *
 * Customers subscribe, confirm and unsubscribe on the public page itself; nothing here manages
 * subscribers.
 */
final class SiteStatusPageClient
{
    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read the saved draft and the current publication; either is null when absent. */
    public function getSettings(string $domainUuid, ?string $companySlug = null): SiteStatusPageSettings
    {
        return SiteStatusPageSettings::fromPayload($this->http->send('GET', self::path($domainUuid), [], $companySlug));
    }

    /** Show the page as customers would see it, without saving or publishing anything. */
    public function preview(string $domainUuid, SiteStatusPageDraft $draft, ?string $companySlug = null): SiteStatusPage
    {
        return SiteStatusPage::fromPayload(
            $this->http->send('POST', self::path($domainUuid) . '/preview', [], $companySlug, $draft->serialise())
        );
    }

    /**
     * Save the draft and publish it. Republishing keeps the same public key, so a shared link keeps
     * working; build that link with SiteStatusPagePublication::publicUrl().
     */
    public function publish(
        string $domainUuid,
        SiteStatusPageDraft $draft,
        ?string $companySlug = null,
    ): SiteStatusPagePublication {
        return SiteStatusPagePublication::fromPayload(
            $this->http->send('PUT', self::path($domainUuid), [], $companySlug, $draft->serialise())
        );
    }

    /** Take the page off the public link; the draft stays for a later publish. */
    public function unpublish(string $domainUuid, ?string $companySlug = null): void
    {
        $this->http->sendNoContent('DELETE', self::path($domainUuid), [], $companySlug);
    }

    /**
     * Post a message to the published page and email its confirmed subscribers. A retry with the same
     * requestUuid posts and notifies once. Returns the latest 20 updates, newest first.
     */
    public function postUpdate(
        string $domainUuid,
        SiteStatusUpdateRequest $request,
        ?string $companySlug = null,
    ): SiteStatusUpdateHistory {
        return SiteStatusUpdateHistory::fromPayload(
            $this->http->send('POST', self::path($domainUuid) . '/updates', [], $companySlug, $request->serialise())
        );
    }

    private static function path(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/status-page';
    }
}
