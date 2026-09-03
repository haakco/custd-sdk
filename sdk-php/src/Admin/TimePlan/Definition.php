<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Definition implements Dto
{
    /**
     * @param list<ThresholdCue>|null $thresholdCues
     * @param list<DefinitionBlock>|null $blocks
     */
    public function __construct(
        public int $horizonMs = 0,
        public ?string $defaultStartsAt = null,
        public ?string $defaultEndsAt = null,
        public string $redistributionMode = "",
        public bool $autoAdvance = false,
        public ?AnnotationSchema $annotationSchema = null,
        public ?array $thresholdCues = null,
        public ?array $blocks = null,
    ) {
        self::assertDtoList($thresholdCues, ThresholdCue::class, "thresholdCues");
        self::validateThresholdCues($thresholdCues);
        self::assertDtoList($blocks, DefinitionBlock::class, "blocks");
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $annotationSchema = $payload["annotationSchema"] ?? null;
        if ($annotationSchema !== null && (!is_array($annotationSchema) || array_is_list($annotationSchema))) {
            throw new \UnexpectedValueException("custd: time-plan annotationSchema must be an object");
        }
        $thresholdCues = $payload["thresholdCues"] ?? null;
        if ($thresholdCues !== null && (!is_array($thresholdCues) || !array_is_list($thresholdCues))) {
            throw new \UnexpectedValueException("custd: time-plan thresholdCues must be a list");
        }
        /** @var list<array<string, mixed>>|null $thresholdCues */
        return new self(
            Payload::integer($payload, "horizonMs"),
            Payload::optionalString($payload, "defaultStartsAt"),
            Payload::optionalString($payload, "defaultEndsAt"),
            Payload::string($payload, "redistributionMode"),
            Payload::boolean($payload, "autoAdvance"),
            $annotationSchema === null ? null : AnnotationSchema::fromPayload($annotationSchema),
            $thresholdCues === null
                ? null
                : array_map(ThresholdCue::fromPayload(...), $thresholdCues),
            array_map(DefinitionBlock::fromPayload(...), Payload::objects($payload, "blocks")),
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "horizonMs" => $this->horizonMs, "defaultStartsAt" => $this->defaultStartsAt,
            "defaultEndsAt" => $this->defaultEndsAt, "redistributionMode" => $this->redistributionMode,
            "autoAdvance" => $this->autoAdvance,
            "annotationSchema" => $this->annotationSchema?->toPayload(),
            "thresholdCues" => $this->thresholdCues === null
                ? null
                : array_map(Payload::value(...), $this->thresholdCues),
            "blocks" => array_map(Payload::value(...), $this->blocks ?? []),
        ];
    }

    /** @param list<mixed>|null $values */
    private static function assertDtoList(?array $values, string $type, string $field): void
    {
        if ($values === null) {
            return;
        }
        if (!array_is_list($values)) {
            throw new \InvalidArgumentException("custd: time-plan {$field} must be a list");
        }
        foreach ($values as $value) {
            if (!$value instanceof $type) {
                throw new \InvalidArgumentException("custd: time-plan {$field} must contain {$type} DTOs");
            }
        }
    }

    /** @param list<ThresholdCue>|null $values */
    private static function validateThresholdCues(?array $values): void
    {
        if ($values === null) {
            return;
        }
        if (count($values) > 16) {
            throw new \InvalidArgumentException("custd: time-plan thresholdCues cannot contain more than 16 values");
        }
        $seen = [];
        foreach ($values as $value) {
            $key = $value->remainingMs !== null
                ? "ms:{$value->remainingMs}"
                : "bps:{$value->remainingFractionBps}";
            if (isset($seen[$key])) {
                throw new \InvalidArgumentException("custd: time-plan thresholdCues must not contain duplicate triggers");
            }
            $seen[$key] = true;
        }
    }
}
