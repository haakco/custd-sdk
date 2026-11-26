<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionStoreBreakdown
{
    /**
     * @param list<string> $sampleSubjects
     */
    public function __construct(
        public int $candidateCount,
        public int $estimatedAffected,
        public int $legalHoldCount,
        public string $retentionClass,
        public array $sampleSubjects,
        public string $store,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'candidateCount'),
            Fields::integer($payload, 'estimatedAffected'),
            Fields::integer($payload, 'legalHoldCount'),
            Fields::string($payload, 'retentionClass'),
            Fields::strings($payload, 'sampleSubjects'),
            Fields::string($payload, 'store'),
        );
    }
}
