<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** MatchPredicate is one selector predicate. */
final readonly class MatchPredicate
{
    /** @param list<string>|null $anyOf */
    public function __construct(
        public string $selector,
        public ?string $exact = null,
        public ?array $anyOf = null,
        public ?bool $nonEmpty = null,
        public ?string $pattern = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'selector'),
            Fields::optionalString($payload, 'exact'),
            Fields::optionalStrings($payload, 'anyOf'),
            Fields::optionalBoolean($payload, 'nonEmpty'),
            Fields::optionalString($payload, 'pattern'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['selector' => $this->selector];
        if ($this->exact !== null) {
            $payload['exact'] = $this->exact;
        }
        if ($this->anyOf !== null) {
            $payload['anyOf'] = $this->anyOf;
        }
        if ($this->nonEmpty !== null) {
            $payload['nonEmpty'] = $this->nonEmpty;
        }
        if ($this->pattern !== null) {
            $payload['pattern'] = $this->pattern;
        }

        return $payload;
    }
}
