<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

final readonly class PrivacyErasureCreateRequest
{
    public function __construct(
        public string $companySlug,
        public bool $forceNow,
        public string $reason,
        public string $redactionId,
        public PrivacyErasureSelector $selector,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'forceNow' => $this->forceNow,
            'reason' => $this->reason,
            'redactionId' => $this->redactionId,
            'selector' => $this->selector->serialise(),
        ];

        return $body;
    }
}
