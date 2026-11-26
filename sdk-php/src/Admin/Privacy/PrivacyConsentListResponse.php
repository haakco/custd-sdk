<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyConsentListResponse
{
    /**
     * @param list<PrivacyConsentRecord> $records
     */
    public function __construct(
        public string $companySlug,
        public array $records,
        public string $subjectId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            array_map(PrivacyConsentRecord::fromPayload(...), Fields::objects($payload, 'records')),
            Fields::string($payload, 'subjectId'),
        );
    }
}
