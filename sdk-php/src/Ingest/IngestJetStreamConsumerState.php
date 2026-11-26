<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestJetStreamConsumerState
{
    public function __construct(
        public int $numWaiting,
        public int $maxAckPending,
        public float $ackPendingUtilization,
        public bool $slowConsumer,
        public int $deliveredStreamSequence,
        public int $deliveredConsumerSequence,
        public int $ackFloorStreamSequence,
        public int $ackFloorConsumerSequence,
        public int $sequenceGap,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'numWaiting'),
            Fields::integer($payload, 'maxAckPending'),
            Fields::number($payload, 'ackPendingUtilization'),
            Fields::boolean($payload, 'slowConsumer'),
            Fields::integer($payload, 'deliveredStreamSequence'),
            Fields::integer($payload, 'deliveredConsumerSequence'),
            Fields::integer($payload, 'ackFloorStreamSequence'),
            Fields::integer($payload, 'ackFloorConsumerSequence'),
            Fields::integer($payload, 'sequenceGap'),
        );
    }
}
