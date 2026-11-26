<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class PublishedVersionDetails
{
    /**
     * @param list<Allocation> $allocations
     */
    public function __construct(
        public array $allocations,
        public string $allocatorVersion,
        public int $blockCount,
        public string $definitionHash,
        public int $horizonMs,
        public string $planUuid,
        public string $publishedAt,
        public string $schemaVersion,
        public string $uuid,
        public int $versionNumber,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Allocation::fromPayload(...), Fields::objects($payload, 'allocations')),
            Fields::string($payload, 'allocatorVersion'),
            Fields::integer($payload, 'blockCount'),
            Fields::string($payload, 'definitionHash'),
            Fields::integer($payload, 'horizonMs'),
            Fields::string($payload, 'planUuid'),
            Fields::string($payload, 'publishedAt'),
            Fields::string($payload, 'schemaVersion'),
            Fields::string($payload, 'uuid'),
            Fields::integer($payload, 'versionNumber'),
        );
    }
}
