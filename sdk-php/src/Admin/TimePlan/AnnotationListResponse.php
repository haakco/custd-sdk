<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class AnnotationListResponse
{
    /** @param list<Annotation> $annotations */
    public function __construct(public array $annotations = [])
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(array_map(Annotation::fromPayload(...), Payload::objects($payload, "annotations")));
    }
}
