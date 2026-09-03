<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class AnnotationSchema implements Dto
{
    /**
     * @param list<string>|null $allowedTypes
     * @param list<string>|null $fields
     */
    public function __construct(
        public ?array $allowedTypes = null,
        public ?array $fields = null,
    ) {
        self::validateValues($allowedTypes, ["note", "marker", "decision", "action"], "allowedTypes", 4);
        self::validateValues(
            $fields,
            ["text", "markerLabel", "decisionStatus", "assigneeRef", "dueDate", "actionStatus"],
            "fields",
            6,
        );
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            self::values($payload, "allowedTypes"),
            self::values($payload, "fields"),
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "allowedTypes" => $this->allowedTypes,
            "fields" => $this->fields,
        ]);
    }

    /**
     * @param list<string>|null $values
     * @param list<string> $allowed
     */
    private static function validateValues(?array $values, array $allowed, string $field, int $maxItems): void
    {
        if ($values === null) {
            return;
        }
        if (count($values) > $maxItems || count($values) !== count(array_unique($values))) {
            throw new \InvalidArgumentException("custd: time-plan {$field} contains too many or duplicate values");
        }
        foreach ($values as $value) {
            if (!is_string($value) || !in_array($value, $allowed, true)) {
                throw new \InvalidArgumentException("custd: time-plan {$field} contains an unsupported value");
            }
        }
    }

    /** @param array<string, mixed> $payload
     *  @return list<string>|null
     */
    private static function values(array $payload, string $key): ?array
    {
        $value = $payload[$key] ?? null;
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value) || !array_reduce(
            $value,
            static fn (bool $valid, mixed $item): bool => $valid && is_string($item),
            true,
        )) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be a list of strings");
        }
        /** @var list<string> $value */
        return $value;
    }
}
