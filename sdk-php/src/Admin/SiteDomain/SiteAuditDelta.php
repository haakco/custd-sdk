<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAuditDelta is what the latest audit changed: findings it raised for the first time, raised
 * again after a fix, and found fixed. run is one of the RUN_* values; failure says why a failed
 * run failed.
 */
final readonly class SiteAuditDelta
{
    public const RUN_NOT_AUDITED = 'not_audited';
    public const RUN_FAILED = 'failed';
    public const RUN_TRUNCATED = 'truncated';
    public const RUN_COMPLETE = 'complete';

    /**
     * @param list<SiteFinding> $new
     * @param list<SiteFinding> $reopened
     * @param list<SiteFinding> $fixed
     */
    public function __construct(
        public string $domainUuid,
        public string $run,
        public array $new,
        public array $reopened,
        public array $fixed,
        public ?string $auditedAt = null,
        public ?string $failure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'run'),
            array_map(SiteFinding::fromPayload(...), Fields::objects($payload, 'new')),
            array_map(SiteFinding::fromPayload(...), Fields::objects($payload, 'reopened')),
            array_map(SiteFinding::fromPayload(...), Fields::objects($payload, 'fixed')),
            Fields::optionalString($payload, 'auditedAt'),
            Fields::optionalString($payload, 'failure'),
        );
    }
}
