<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Matches one top-level JSON string field of the home page response. */
final readonly class SiteHttpJsonExpectation
{
    public function __construct(
        public string $field,
        public string $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'field'), Fields::string($payload, 'value'));
    }
}
