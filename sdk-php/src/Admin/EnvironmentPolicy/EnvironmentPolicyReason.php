<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EnvironmentPolicy;

use HaakCo\Custd\Fields;

final readonly class EnvironmentPolicyReason
{
    public function __construct(
        public string $code,
        public string $remedy,
        public string $summary,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'remedy'),
            Fields::string($payload, 'summary'),
        );
    }
}
