<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Problem;

/** CollectEventResult is one event's outcome in a collected batch; a refused event carries its problem. */
final readonly class CollectEventResult
{
    public function __construct(
        public string $eventUuid,
        public bool $success,
        public int $status,
        public ?Problem $error = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $error = Fields::optionalObject($payload, 'error');
        $problem = null;
        if ($error !== null) {
            /** @var array<string, mixed> $fields */
            $fields = json_decode(json_encode($error, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);
            $problem = Problem::fromArray($fields);
        }

        return new self(
            Fields::string($payload, 'eventUuid'),
            Fields::boolean($payload, 'success'),
            Fields::integer($payload, 'status'),
            $problem,
        );
    }
}
