<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

use HaakCo\Custd\Fields;

final readonly class SubjectExportResponse
{
    /**
     * @param list<SubjectExportStoreProgress> $perStoreProgress
     * @param SubjectExportScope::* $scope
     * @param SubjectExportStatus::* $state
     */
    public function __construct(
        public string $expiresAt,
        public string $id,
        public string $idempotencyKey,
        public string $opaqueSubjectId,
        public array $perStoreProgress,
        public string $requestedAt,
        public string $scope,
        public string $state,
        public ?string $completedAt = null,
        public ?string $error = null,
        public ?string $lastActionSafeNext = null,
        public ?string $lastProgressAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'expiresAt'),
            Fields::string($payload, 'id'),
            Fields::string($payload, 'idempotencyKey'),
            Fields::string($payload, 'opaqueSubjectId'),
            array_map(SubjectExportStoreProgress::fromPayload(...), Fields::objects($payload, 'perStoreProgress')),
            Fields::string($payload, 'requestedAt'),
            Fields::string($payload, 'scope'),
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'error'),
            Fields::optionalString($payload, 'lastActionSafeNext'),
            Fields::optionalString($payload, 'lastProgressAt'),
        );
    }
}
