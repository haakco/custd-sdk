<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** A verified domain's browser collector. A disabled collector has no key or origin. */
final readonly class SiteBrowserCollector
{
    /**
     * @param SiteBrowserCollectorMode::* $mode
     */
    public function __construct(
        public string $siteUuid,
        public string $mode,
        public ?string $browserKey,
        public ?string $environment,
        public ?string $allowedOrigin,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $mode = Fields::string($payload, 'mode');

        return new self(
            Fields::string($payload, 'siteUuid'),
            $mode,
            $mode === SiteBrowserCollectorMode::ENABLED ? Fields::string($payload, 'browserKey') : null,
            $mode === SiteBrowserCollectorMode::ENABLED ? Fields::string($payload, 'environment') : null,
            $mode === SiteBrowserCollectorMode::ENABLED ? Fields::string($payload, 'allowedOrigin') : null,
        );
    }
}
