<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteIndexNowState is a domain's IndexNow setup: whether it is enabled, the key file to serve
 * at keyLocation (both null while disabled), whether the key is verified, the tenant's daily URL
 * use and the latest submissions. lastCheckFailure says why the last key check failed.
 */
final readonly class SiteIndexNowState
{
    /** @param list<SiteIndexNowSubmission> $submissions */
    public function __construct(
        public bool $enabled,
        public bool $verified,
        public int $dailyUrlLimit,
        public int $urlsToday,
        public array $submissions,
        public ?string $key = null,
        public ?string $keyLocation = null,
        public ?string $verifiedAt = null,
        public ?string $lastCheckFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'enabled'),
            Fields::boolean($payload, 'verified'),
            Fields::integer($payload, 'dailyUrlLimit'),
            Fields::integer($payload, 'urlsToday'),
            array_map(SiteIndexNowSubmission::fromPayload(...), Fields::objects($payload, 'submissions')),
            Fields::optionalString($payload, 'key'),
            Fields::optionalString($payload, 'keyLocation'),
            Fields::optionalString($payload, 'verifiedAt'),
            Fields::optionalString($payload, 'lastCheckFailure'),
        );
    }
}
