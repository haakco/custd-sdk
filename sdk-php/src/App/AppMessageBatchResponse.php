<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageBatchResponse
{
    /**
     * @param list<AppMessageImportResult> $results
     */
    public function __construct(
        public array $results,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppMessageImportResult::fromPayload(...), Fields::objects($payload, 'results')),
        );
    }
}
