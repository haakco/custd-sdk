<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAISettings
{
    public function __construct(
        public SiteAIMode $aiMode,
        public int $monthlyCapUsdMicros,
        public bool $keyConfigured,
        public bool $keyRefused,
        public ?string $currentTermsVersion,
        public ?string $acceptedTermsVersion,
        public ?string $consentAcceptedAt,
        public bool $ownKeyAvailable = false,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteAIMode::from(Fields::string($payload, 'aiMode')),
            Fields::integer($payload, 'monthlyCapUsdMicros'),
            Fields::boolean($payload, 'keyConfigured'),
            Fields::optionalBoolean($payload, 'keyRefused') ?? false,
            Fields::optionalString($payload, 'currentTermsVersion'),
            Fields::optionalString($payload, 'acceptedTermsVersion'),
            Fields::optionalString($payload, 'consentAcceptedAt'),
            Fields::optionalBoolean($payload, 'ownKeyAvailable') ?? false,
        );
    }
}
