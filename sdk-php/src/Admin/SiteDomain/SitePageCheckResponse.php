<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageCheckResponse is what the one-page checks found on a draft, with the draft's facts. The
 * draft tools are null unless asked for: slug from the draft's first h1, else its title; redirect
 * from previousUrl (format SiteGeneratedFix::FORMAT_REDIRECT); phrase. scope echoes the request's
 * scope; with SitePageCheckRequest::SCOPE_CONTENT, checkedRules lists the rules checked, and a rule
 * among them with no finding passed. Both are null otherwise.
 */
final readonly class SitePageCheckResponse
{
    /**
     * @param list<SitePageFinding> $findings
     * @param list<string>|null $checkedRules
     * @param SitePageCheckScope::*|null $scope
     */
    public function __construct(
        public SitePageFacts $page,
        public array $findings,
        public ?string $slug = null,
        public ?SiteGeneratedFix $redirect = null,
        public ?SitePhraseUse $phrase = null,
        public ?string $scope = null,
        public ?array $checkedRules = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $redirect = Fields::optionalObject($payload, 'redirect');
        $phrase = Fields::optionalObject($payload, 'phrase');

        return new self(
            SitePageFacts::fromPayload(Fields::object($payload, 'page')),
            array_map(SitePageFinding::fromPayload(...), Fields::objects($payload, 'findings')),
            Fields::optionalString($payload, 'slug'),
            $redirect === null ? null : SiteGeneratedFix::fromPayload($redirect),
            $phrase === null ? null : SitePhraseUse::fromPayload($phrase),
            Fields::optionalString($payload, 'scope'),
            Fields::optionalStrings($payload, 'checkedRules'),
        );
    }
}
