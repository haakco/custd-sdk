<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertMeasurement
{
    public function __construct(
        public int $limitBytes,
        public int $measuredValue,
        public int $thresholdPercent,
        public string $warningState,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'limitBytes'),
            Fields::integer($payload, 'measuredValue'),
            Fields::integer($payload, 'thresholdPercent'),
            Fields::string($payload, 'warningState'),
        );
    }
}
