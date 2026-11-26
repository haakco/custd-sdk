<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class ModelList
{
    /**
     * @param list<Model> $models
     */
    public function __construct(
        public array $models,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Model::fromPayload(...), Fields::objects($payload, 'models')),
        );
    }
}
