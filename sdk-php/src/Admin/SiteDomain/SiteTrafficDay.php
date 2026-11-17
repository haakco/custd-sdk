<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTrafficDay is one UTC day; coverage is a COVERAGE_* value. requests, bytes and notFound are null
 * when no hour of the day was read; a present 0 is a real 0.
 */
final readonly class SiteTrafficDay
{
    public const COVERAGE_COMPLETE = 'complete';
    public const COVERAGE_PARTIAL = 'partial';
    public const COVERAGE_MISSING = 'missing';

    public function __construct(
        public string $date,
        public string $coverage,
        public int $hoursRead,
        public int $hoursPartial,
        public int $hoursFailed,
        public int $hoursMissing,
        public ?int $requests = null,
        public ?int $bytes = null,
        public ?int $notFound = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'date'),
            Fields::string($payload, 'coverage'),
            Fields::integer($payload, 'hoursRead'),
            Fields::integer($payload, 'hoursPartial'),
            Fields::integer($payload, 'hoursFailed'),
            Fields::integer($payload, 'hoursMissing'),
            Fields::optionalInteger($payload, 'requests'),
            Fields::optionalInteger($payload, 'bytes'),
            Fields::optionalInteger($payload, 'notFound'),
        );
    }
}
