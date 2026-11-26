<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

final readonly class SubjectExportCreateRequest
{
    public function __construct(
        public string $idempotencyKey,
        public string $opaqueSubjectId,
        public string $scope,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'idempotencyKey' => $this->idempotencyKey,
            'opaqueSubjectId' => $this->opaqueSubjectId,
            'scope' => $this->scope,
        ];

        return $body;
    }
}
