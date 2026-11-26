<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DescriptiveLabelCatalogue
{
    /**
     * @param list<DescriptiveLabel> $labels
     */
    public function __construct(
        public array $labels,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DescriptiveLabel::fromPayload(...), Fields::objects($payload, 'labels')),
        );
    }
}
