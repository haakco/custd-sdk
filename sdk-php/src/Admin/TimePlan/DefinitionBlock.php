<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class DefinitionBlock implements Dto
{
    /** @param list<string>|null $tags */
    public function __construct(
        public string $uuid = "",
        public string $semanticKey = "",
        public string $title = "",
        public string $description = "",
        public string $category = "",
        public ?array $tags = null,
        public string $basis = "",
        public int $durationMs = 0,
        public int $numerator = 0,
        public int $denominator = 0,
        public int $weight = 0,
    ) {
        if ($tags !== null && (!array_is_list($tags) || !array_reduce(
            $tags,
            static fn (bool $valid, mixed $tag): bool => $valid && is_string($tag),
            true,
        ))) {
            throw new \InvalidArgumentException("custd: time-plan tags must be a list of strings");
        }
        if (!in_array($basis, ["absolute", "horizon_fraction", "remainder_weight"], true)) {
            throw new \InvalidArgumentException("custd: time-plan block basis is invalid");
        }
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $tags = $payload["tags"] ?? null;
        if ($tags !== null && (!is_array($tags) || !array_is_list($tags) || !array_reduce(
            $tags,
            static fn (bool $valid, mixed $tag): bool => $valid && is_string($tag),
            true,
        ))) {
            throw new \UnexpectedValueException("custd: time-plan tags must be a list of strings");
        }
        /** @var list<string>|null $tags */
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "semanticKey"),
            Payload::string($payload, "title"),
            Payload::optionalString($payload, "description") ?? "",
            Payload::optionalString($payload, "category") ?? "",
            $tags,
            Payload::string($payload, "basis"),
            Payload::optionalInteger($payload, "durationMs") ?? 0,
            Payload::optionalInteger($payload, "numerator") ?? 0,
            Payload::optionalInteger($payload, "denominator") ?? 0,
            Payload::optionalInteger($payload, "weight") ?? 0,
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "uuid" => $this->uuid, "semanticKey" => $this->semanticKey, "title" => $this->title,
            "description" => $this->description, "category" => $this->category, "tags" => $this->tags,
            "basis" => $this->basis, "durationMs" => $this->durationMs, "numerator" => $this->numerator,
            "denominator" => $this->denominator, "weight" => $this->weight,
        ];
    }
}
