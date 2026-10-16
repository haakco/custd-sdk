<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackValidateResponse is the result of POST /reporting-packs/validate. */
final readonly class ReportingPackValidateResponse
{
    public function __construct(
        public bool $valid,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        return new self(Fields::boolean(Fields::jsonObject($payload, 'reporting pack validate response'), 'valid'));
    }
}
