<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWarming is the average home page response time measured while warming was
 * off and while it was on. Either is null until measured.
 */
final readonly class SiteWarming
{
    public function __construct(
        public ?string $lastWarmedAt = null,
        public ?int $unwarmedResponseMs = null,
        public ?int $warmedResponseMs = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'lastWarmedAt'),
            Fields::optionalInteger($payload, 'unwarmedResponseMs'),
            Fields::optionalInteger($payload, 'warmedResponseMs'),
        );
    }
}
