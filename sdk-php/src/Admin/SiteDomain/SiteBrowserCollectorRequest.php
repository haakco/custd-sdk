<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

final readonly class SiteBrowserCollectorRequest
{
    /**
     * @param SiteBrowserCollectorMode::* $mode
     */
    private function __construct(
        public string $mode,
        public ?string $environment,
    ) {
    }

    public static function enable(string $environment): self
    {
        return new self(SiteBrowserCollectorMode::ENABLED, $environment);
    }

    public static function disable(): self
    {
        return new self(SiteBrowserCollectorMode::DISABLED, null);
    }

    /** @return array{mode: string, environment?: string} */
    public function serialise(): array
    {
        $body = ['mode' => $this->mode];

        return $this->environment === null ? $body : $body + ['environment' => $this->environment];
    }
}
