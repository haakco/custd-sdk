<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteKeywordDemand is Bing's searches for one keyword in the week starting weekOf: exact
 * (weeklyImpressions) and containing it (broadImpressions). A number Bing did not report is null,
 * never 0; lastFailure says why the latest read failed, retried a day later.
 */
final readonly class SiteKeywordDemand
{
    public function __construct(
        public string $keyword,
        public string $checkedAt,
        public ?int $weeklyImpressions = null,
        public ?int $broadImpressions = null,
        public ?string $weekOf = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'keyword'),
            Fields::string($payload, 'checkedAt'),
            Fields::optionalInteger($payload, 'weeklyImpressions'),
            Fields::optionalInteger($payload, 'broadImpressions'),
            Fields::optionalString($payload, 'weekOf'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
