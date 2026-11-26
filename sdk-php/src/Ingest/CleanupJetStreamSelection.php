<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupJetStreamSelection names a stream and the consumers a cleanup drains.
 */
final readonly class CleanupJetStreamSelection
{
    /**
     * @param list<string>|null $consumers
     */
    public function __construct(
        public string $stream,
        public ?array $consumers = null,
        public ?string $executionStatus = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'stream'),
            Fields::optionalStrings($payload, 'consumers') ?? [],
            Fields::optionalString($payload, 'executionStatus'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'stream' => $this->stream,
        ];
        if ($this->consumers !== null) {
            $body['consumers'] = $this->consumers;
        }
        if ($this->executionStatus !== null) {
            $body['executionStatus'] = $this->executionStatus;
        }

        return $body;
    }
}
