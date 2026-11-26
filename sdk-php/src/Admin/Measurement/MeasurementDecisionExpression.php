<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementDecisionExpression
{
    /**
     * @param list<MeasurementDecisionExpression>|null $children
     */
    public function __construct(
        public string $kind,
        public ?array $children = null,
        public ?float $value = null,
        public ?string $variableCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            array_map(MeasurementDecisionExpression::fromPayload(...), Fields::optionalObjects($payload, 'children') ?? []),
            Fields::optionalNumber($payload, 'value'),
            Fields::optionalString($payload, 'variableCode'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
        ];
        if ($this->children !== null) {
            $body['children'] = array_map(static fn (MeasurementDecisionExpression $item): array => $item->serialise(), $this->children);
        }
        if ($this->value !== null) {
            $body['value'] = $this->value;
        }
        if ($this->variableCode !== null) {
            $body['variableCode'] = $this->variableCode;
        }

        return $body;
    }
}
