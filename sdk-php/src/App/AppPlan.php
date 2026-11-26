<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppPlan
{
    /**
     * @param list<AppPlanPart> $parts
     */
    public function __construct(
        public string $name,
        public array $parts,
        public int $revision,
        public ?string $deadline = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'name'),
            array_map(AppPlanPart::fromPayload(...), Fields::objects($payload, 'parts')),
            Fields::integer($payload, 'revision'),
            Fields::optionalString($payload, 'deadline'),
        );
    }
}
