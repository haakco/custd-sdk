<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DefinitionMathDefinitionResult
{
    public function __construct(
        public int $allocatedMs,
        public int $blockCount,
        public bool $exactConservation,
        public int $horizonMs,
        public int $index,
        public bool $passed,
        public bool $runtimeVocabularyClean,
        public string $vectorId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'allocatedMs'),
            Fields::integer($payload, 'blockCount'),
            Fields::boolean($payload, 'exactConservation'),
            Fields::integer($payload, 'horizonMs'),
            Fields::integer($payload, 'index'),
            Fields::boolean($payload, 'passed'),
            Fields::boolean($payload, 'runtimeVocabularyClean'),
            Fields::string($payload, 'vectorId'),
        );
    }
}
