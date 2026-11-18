<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

final readonly class SiteBrowserCollectorRequest
{
    private function __construct(
        public SiteBrowserCollectorMode $mode,
        public ?string $environment,
    ) {
    }

    public static function enable(string $environment): self
    {
        return new self(SiteBrowserCollectorMode::Enabled, $environment);
    }

    public static function disable(): self
    {
        return new self(SiteBrowserCollectorMode::Disabled, null);
    }

    /** @return array{mode: string, environment?: string} */
    public function serialise(): array
    {
        $body = ['mode' => $this->mode->value];

        return $this->environment === null ? $body : $body + ['environment' => $this->environment];
    }
}
