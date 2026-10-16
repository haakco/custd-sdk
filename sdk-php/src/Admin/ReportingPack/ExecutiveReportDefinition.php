<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ExecutiveReportDefinition configures an executive report summary. */
final readonly class ExecutiveReportDefinition
{
    /**
     * @param list<string>|null $findings
     * @param list<string>|null $actions
     * @param list<string>|null $supportingWidgetKeys
     */
    public function __construct(
        public string $recipe,
        public string $primaryWidgetKey,
        public string $primaryMetricKey,
        public string $primaryLabel,
        public string $primaryUnit,
        public string $scopeLabel,
        public string $comparisonBasis,
        public ?string $comparisonLabel = null,
        public ?float $targetValue = null,
        public ?string $targetUnit = null,
        public ?array $findings = null,
        public ?array $actions = null,
        public ?array $supportingWidgetKeys = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'recipe'),
            Fields::string($payload, 'primaryWidgetKey'),
            Fields::string($payload, 'primaryMetricKey'),
            Fields::string($payload, 'primaryLabel'),
            Fields::string($payload, 'primaryUnit'),
            Fields::string($payload, 'scopeLabel'),
            Fields::string($payload, 'comparisonBasis'),
            Fields::optionalString($payload, 'comparisonLabel'),
            Fields::optionalNumber($payload, 'targetValue'),
            Fields::optionalString($payload, 'targetUnit'),
            Fields::optionalStrings($payload, 'findings'),
            Fields::optionalStrings($payload, 'actions'),
            Fields::optionalStrings($payload, 'supportingWidgetKeys'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'recipe' => $this->recipe,
            'primaryWidgetKey' => $this->primaryWidgetKey,
            'primaryMetricKey' => $this->primaryMetricKey,
            'primaryLabel' => $this->primaryLabel,
            'primaryUnit' => $this->primaryUnit,
            'scopeLabel' => $this->scopeLabel,
            'comparisonBasis' => $this->comparisonBasis,
        ];
        if ($this->comparisonLabel !== null) {
            $payload['comparisonLabel'] = $this->comparisonLabel;
        }
        if ($this->targetValue !== null) {
            $payload['targetValue'] = $this->targetValue;
        }
        if ($this->targetUnit !== null) {
            $payload['targetUnit'] = $this->targetUnit;
        }
        if ($this->findings !== null) {
            $payload['findings'] = $this->findings;
        }
        if ($this->actions !== null) {
            $payload['actions'] = $this->actions;
        }
        if ($this->supportingWidgetKeys !== null) {
            $payload['supportingWidgetKeys'] = $this->supportingWidgetKeys;
        }

        return $payload;
    }
}
