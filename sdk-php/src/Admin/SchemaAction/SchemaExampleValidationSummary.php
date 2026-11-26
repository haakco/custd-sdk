<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaExampleValidationSummary
{
    /**
     * @param list<string> $issueCodes
     */
    public function __construct(
        public int $deltas,
        public int $discovered,
        public array $issueCodes,
        public int $run,
        public int $sameAccept,
        public int $sameReject,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'deltas'),
            Fields::integer($payload, 'discovered'),
            Fields::strings($payload, 'issueCodes'),
            Fields::integer($payload, 'run'),
            Fields::integer($payload, 'sameAccept'),
            Fields::integer($payload, 'sameReject'),
        );
    }
}
