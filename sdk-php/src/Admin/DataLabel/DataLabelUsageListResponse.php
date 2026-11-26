<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelUsageListResponse
{
    /**
     * @param list<DataLabelUsage> $usage
     */
    public function __construct(
        public array $usage,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DataLabelUsage::fromPayload(...), Fields::objects($payload, 'usage')),
        );
    }
}
