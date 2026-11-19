<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteFinding is one problem an audit found on a verified domain, with the fix. recheckable says a
 * one-page recheck decides its rule, so requestPageRecheck can confirm the fix; it reads false from
 * a server before 3.51.
 */
final readonly class SiteFinding
{
    public function __construct(
        public string $findingUuid,
        public string $rule,
        public string $severity,
        public string $title,
        public string $url,
        public string $evidence,
        public string $fix,
        public string $source,
        public SiteRemedy $remedy,
        public SiteFindingHistory $history,
        public bool $recheckable = false,
        public ?SiteFindingSuggestion $suggestion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $suggestion = Fields::optionalObject($payload, 'suggestion');

        return new self(
            Fields::string($payload, 'findingUuid'),
            Fields::string($payload, 'rule'),
            Fields::string($payload, 'severity'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'evidence'),
            Fields::string($payload, 'fix'),
            Fields::string($payload, 'source'),
            SiteRemedy::fromPayload(Fields::object($payload, 'remedy')),
            SiteFindingHistory::fromPayload(Fields::object($payload, 'history')),
            Fields::optionalBoolean($payload, 'recheckable') ?? false,
            $suggestion === null ? null : SiteFindingSuggestion::fromPayload($suggestion),
        );
    }
}
