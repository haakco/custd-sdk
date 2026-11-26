<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStageProgress
{
    public function __construct(
        public ?string $classification = null,
        public ?int $depth = null,
        public ?float $drainRatePerSecond = null,
        public ?int $etaSeconds = null,
        public ?string $note = null,
        public ?int $retentionExpirySeconds = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'classification'),
            Fields::optionalInteger($payload, 'depth'),
            Fields::optionalNumber($payload, 'drainRatePerSecond'),
            Fields::optionalInteger($payload, 'etaSeconds'),
            Fields::optionalString($payload, 'note'),
            Fields::optionalInteger($payload, 'retentionExpirySeconds'),
        );
    }
}
