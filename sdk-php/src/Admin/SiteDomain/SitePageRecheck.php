<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageRecheck is one page queued to be checked again. Once checked it lists the one-page
 * rules the page still breaks and the ones it now passes; checkedAt is null until then.
 */
final readonly class SitePageRecheck
{
    /**
     * @param list<string> $openRules
     * @param list<string> $fixedRules
     * @param SitePageRecheckState::* $state
     */
    public function __construct(
        public string $recheckUuid,
        public string $url,
        public string $state,
        public string $requestedAt,
        public array $openRules,
        public array $fixedRules,
        public ?string $checkedAt = null,
        public ?string $failure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'recheckUuid'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'requestedAt'),
            Fields::strings($payload, 'openRules'),
            Fields::strings($payload, 'fixedRules'),
            Fields::optionalString($payload, 'checkedAt'),
            Fields::optionalString($payload, 'failure'),
        );
    }
}
