<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageCheckResponse is what the one-page checks found on a draft, with the draft's facts. The
 * draft tools are null unless asked for: slug from the draft's first h1, else its title; redirect
 * from previousUrl (format SiteGeneratedFix::FORMAT_REDIRECT); phrase.
 */
final readonly class SitePageCheckResponse
{
    /** @param list<SitePageFinding> $findings */
    public function __construct(
        public SitePageFacts $page,
        public array $findings,
        public ?string $slug = null,
        public ?SiteGeneratedFix $redirect = null,
        public ?SitePhraseUse $phrase = null,
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
        );
    }
}
