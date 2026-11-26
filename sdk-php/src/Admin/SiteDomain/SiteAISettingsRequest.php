<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use SensitiveParameter;

/** Replace settings; omitting the key can retain an existing own key. */
final readonly class SiteAISettingsRequest
{
    /**
     * @param SiteAIMode::* $aiMode
     */
    public function __construct(
        public string $aiMode,
        public int $monthlyCapUsdMicros,
        #[SensitiveParameter] private ?string $apiKey = null,
    ) {
    }

    /** @return array{aiMode: string, monthlyCapUsdMicros: int, apiKey?: string} */
    public function serialise(): array
    {
        $body = ['aiMode' => $this->aiMode, 'monthlyCapUsdMicros' => $this->monthlyCapUsdMicros];

        return $this->apiKey === null ? $body : $body + ['apiKey' => $this->apiKey];
    }
}
