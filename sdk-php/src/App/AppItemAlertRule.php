<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemAlertRule
{
    /**
     * @param AppAlertRuleType::* $type
     */
    public function __construct(
        public bool $conditionMet,
        public string $createdAt,
        public int $crossings,
        public string $ruleUuid,
        public string $type,
        public ?string $modelOutput = null,
        public ?int $staleDays = null,
        public ?float $threshold = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'conditionMet'),
            Fields::string($payload, 'createdAt'),
            Fields::integer($payload, 'crossings'),
            Fields::string($payload, 'ruleUuid'),
            Fields::string($payload, 'type'),
            Fields::optionalString($payload, 'modelOutput'),
            Fields::optionalInteger($payload, 'staleDays'),
            Fields::optionalNumber($payload, 'threshold'),
        );
    }
}
