<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppItemAlertRuleCreateRequest
{
    public function __construct(
        public string $type,
        public ?string $modelOutput = null,
        public ?int $staleDays = null,
        public ?float $threshold = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'type' => $this->type,
        ];
        if ($this->modelOutput !== null) {
            $body['modelOutput'] = $this->modelOutput;
        }
        if ($this->staleDays !== null) {
            $body['staleDays'] = $this->staleDays;
        }
        if ($this->threshold !== null) {
            $body['threshold'] = $this->threshold;
        }

        return $body;
    }
}
