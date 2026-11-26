<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class ModelDetail
{
    public function __construct(
        public string $createdAt,
        public string $description,
        public int $latestVersion,
        public string $modelUuid,
        public string $name,
        public string $updatedAt,
        public ?QueuedRunFailure $queuedRunFailure = null,
        public ?Version $version = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $queuedRunFailure = Fields::optionalObject($payload, 'queuedRunFailure');
        $version = Fields::optionalObject($payload, 'version');

        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'description'),
            Fields::integer($payload, 'latestVersion'),
            Fields::string($payload, 'modelUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'updatedAt'),
            $queuedRunFailure === null ? null : QueuedRunFailure::fromPayload($queuedRunFailure),
            $version === null ? null : Version::fromPayload($version),
        );
    }
}
