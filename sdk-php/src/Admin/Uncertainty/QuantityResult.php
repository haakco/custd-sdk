<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class QuantityResult
{
    public function __construct(
        public string $name,
        public ?QuantityError $error = null,
        public ?QuantitySummary $summary = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $error = Fields::optionalObject($payload, 'error');
        $summary = Fields::optionalObject($payload, 'summary');

        return new self(
            Fields::string($payload, 'name'),
            $error === null ? null : QuantityError::fromPayload($error),
            $summary === null ? null : QuantitySummary::fromPayload($summary),
        );
    }
}
