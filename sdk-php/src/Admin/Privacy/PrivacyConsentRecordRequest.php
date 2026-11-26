<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

final readonly class PrivacyConsentRecordRequest
{
    public function __construct(
        public string $companySlug,
        public bool $granted,
        public string $purpose,
        public string $source,
        public string $subjectId,
        public ?string $expiresAt = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'granted' => $this->granted,
            'purpose' => $this->purpose,
            'source' => $this->source,
            'subjectId' => $this->subjectId,
        ];
        if ($this->expiresAt !== null) {
            $body['expiresAt'] = $this->expiresAt;
        }

        return $body;
    }
}
