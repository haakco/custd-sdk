<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestJetStreamState
{
    public function __construct(
        public bool $available,
        public int $pending,
        public int $ackPending,
        public int $redelivered,
        public bool $consumerActive,
        public int $retentionSecondsLeft,
        public IngestJetStreamStreamState $streamState,
        public IngestJetStreamConsumerState $consumerState,
        public ?string $stream = null,
        public ?string $consumer = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::integer($payload, 'pending'),
            Fields::integer($payload, 'ackPending'),
            Fields::integer($payload, 'redelivered'),
            Fields::boolean($payload, 'consumerActive'),
            Fields::integer($payload, 'retentionSecondsLeft'),
            IngestJetStreamStreamState::fromPayload(Fields::object($payload, 'streamState')),
            IngestJetStreamConsumerState::fromPayload(Fields::object($payload, 'consumerState')),
            Fields::optionalString($payload, 'stream'),
            Fields::optionalString($payload, 'consumer'),
        );
    }
}
