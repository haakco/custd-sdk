<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

final readonly class SiteAIConsentRequest
{
    private function __construct(private ?string $termsVersion)
    {
    }

    public static function grant(string $termsVersion): self
    {
        return new self($termsVersion);
    }

    public static function revoke(): self
    {
        return new self(null);
    }

    /** @return array{action: 'grant'|'revoke', termsVersion?: string} */
    public function serialise(): array
    {
        return $this->termsVersion === null
            ? ['action' => 'revoke']
            : ['action' => 'grant', 'termsVersion' => $this->termsVersion];
    }
}
