<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/** CollectBatchResult reports every event of a collected batch; a partial rejection is a valid answer. */
final readonly class CollectBatchResult
{
    /**
     * @param list<CollectEventResult> $results
     * @param list<string> $acceptedEventIds
     */
    public function __construct(
        public bool $success,
        public array $results = [],
        public array $acceptedEventIds = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'success'),
            array_map(CollectEventResult::fromPayload(...), Fields::objects($payload, 'results')),
            Fields::optionalStrings($payload, 'acceptedEventIds') ?? [],
        );
    }
}
