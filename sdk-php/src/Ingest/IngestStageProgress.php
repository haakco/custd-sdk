<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestStageProgress
{
    public function __construct(
        public string $classification,
        public int $depth,
        public ?float $drainRatePerSecond = null,
        public ?int $etaSeconds = null,
        public ?int $retentionExpirySeconds = null,
        public ?string $note = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'classification'),
            Fields::integer($payload, 'depth'),
            Fields::optionalNumber($payload, 'drainRatePerSecond'),
            Fields::optionalInteger($payload, 'etaSeconds'),
            Fields::optionalInteger($payload, 'retentionExpirySeconds'),
            Fields::optionalString($payload, 'note'),
        );
    }
}
