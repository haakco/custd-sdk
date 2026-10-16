<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RetentionRule declares the return window and predicate for a cohort. */
final readonly class RetentionRule
{
    /** @param list<int> $returnWindowDays */
    public function __construct(
        public string $key,
        public string $activationRule,
        public array $returnWindowDays,
        public MatchPredicate $returnPredicate,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'activationRule'),
            Fields::integerList($payload, 'returnWindowDays'),
            MatchPredicate::fromPayload(Fields::object($payload, 'returnPredicate')),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'key' => $this->key,
            'activationRule' => $this->activationRule,
            'returnWindowDays' => $this->returnWindowDays,
            'returnPredicate' => $this->returnPredicate->serialise(),
        ];
    }
}
