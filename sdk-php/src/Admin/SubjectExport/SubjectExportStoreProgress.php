<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

use HaakCo\Custd\Fields;

final readonly class SubjectExportStoreProgress
{
    public function __construct(
        public int $deletedCount,
        public int $retainedExceptions,
        public string $store,
        public ?string $lastCompletedAt = null,
        public ?string $lastError = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'deletedCount'),
            Fields::integer($payload, 'retainedExceptions'),
            Fields::string($payload, 'store'),
            Fields::optionalString($payload, 'lastCompletedAt'),
            Fields::optionalString($payload, 'lastError'),
        );
    }
}
