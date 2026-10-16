<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** DashboardInteractionRule links one widget interaction to another widget. */
final readonly class DashboardInteractionRule
{
    public function __construct(
        public string $key,
        public string $sourceWidget,
        public string $targetWidget,
        public string $dimension,
        public string $action,
        public string $linkedFilterGroup,
        public ?string $comparisonPreset = null,
        public string $resetBehavior = '',
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'sourceWidget'),
            Fields::string($payload, 'targetWidget'),
            Fields::string($payload, 'dimension'),
            Fields::string($payload, 'action'),
            Fields::string($payload, 'linkedFilterGroup'),
            Fields::optionalString($payload, 'comparisonPreset'),
            Fields::optionalString($payload, 'resetBehavior') ?? '',
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'sourceWidget' => $this->sourceWidget,
            'targetWidget' => $this->targetWidget,
            'dimension' => $this->dimension,
            'action' => $this->action,
            'linkedFilterGroup' => $this->linkedFilterGroup,
        ];
        if ($this->comparisonPreset !== null) {
            $payload['comparisonPreset'] = $this->comparisonPreset;
        }
        if ($this->resetBehavior !== '') {
            $payload['resetBehavior'] = $this->resetBehavior;
        }

        return $payload;
    }
}
