<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ActivationRule declares when a cohort identity activates. */
final readonly class ActivationRule
{
    public function __construct(
        public string $key,
        public string $identity,
        public MatchPredicate $predicate,
        public int $cohortWindowDays,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'identity'),
            MatchPredicate::fromPayload(Fields::object($payload, 'predicate')),
            Fields::integer($payload, 'cohortWindowDays'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'key' => $this->key,
            'identity' => $this->identity,
            'predicate' => $this->predicate->serialise(),
            'cohortWindowDays' => $this->cohortWindowDays,
        ];
    }
}
