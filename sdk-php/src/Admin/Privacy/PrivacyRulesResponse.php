<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Admin\ClientSetup\PrivacyRule;
use HaakCo\Custd\Fields;

final readonly class PrivacyRulesResponse
{
    /**
     * @param list<PrivacyRule> $rules
     */
    public function __construct(
        public string $applyMode,
        public string $companySlug,
        public bool $enabled,
        public array $rules,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'applyMode'),
            Fields::string($payload, 'companySlug'),
            Fields::boolean($payload, 'enabled'),
            array_map(PrivacyRule::fromPayload(...), Fields::objects($payload, 'rules')),
        );
    }
}
