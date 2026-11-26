<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Admin\ClientSetup\PrivacyRule;

final readonly class PrivacyRulesReplaceRequest
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

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'applyMode' => $this->applyMode,
            'companySlug' => $this->companySlug,
            'enabled' => $this->enabled,
            'rules' => array_map(static fn (PrivacyRule $item): array => $item->serialise(), $this->rules),
        ];

        return $body;
    }
}
