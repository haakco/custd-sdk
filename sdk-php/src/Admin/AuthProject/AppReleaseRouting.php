<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseRouting is how the host serves a release. Unset fields take the server's defaults. */
final readonly class AppReleaseRouting
{
    /**
     * @param list<AppReleaseSpaFallback> $spaFallbacks
     * @param list<AppReleaseHeaderRule> $headers
     * @param list<AppReleaseCacheRule> $cache
     * @param list<AppReleaseShareableRoute> $shareableRoutes
     */
    public function __construct(
        public ?string $indexFile = null,
        public ?string $notFoundPage = null,
        public array $spaFallbacks = [],
        public array $headers = [],
        public array $cache = [],
        public array $shareableRoutes = [],
        public ?AppReleaseSiteCard $siteCard = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $siteCard = Fields::optionalObject($payload, 'siteCard');

        return new self(
            Fields::optionalString($payload, 'indexFile'),
            Fields::optionalString($payload, 'notFoundPage'),
            array_map(AppReleaseSpaFallback::fromPayload(...), Fields::optionalObjects($payload, 'spaFallbacks') ?? []),
            array_map(AppReleaseHeaderRule::fromPayload(...), Fields::optionalObjects($payload, 'headers') ?? []),
            array_map(AppReleaseCacheRule::fromPayload(...), Fields::optionalObjects($payload, 'cache') ?? []),
            array_map(AppReleaseShareableRoute::fromPayload(...), Fields::optionalObjects($payload, 'shareableRoutes') ?? []),
            $siteCard === null ? null : AppReleaseSiteCard::fromPayload($siteCard),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'indexFile' => $this->indexFile,
            'notFoundPage' => $this->notFoundPage,
            'spaFallbacks' => array_map(static fn (AppReleaseSpaFallback $rule): array => $rule->serialise(), $this->spaFallbacks),
            'headers' => array_map(static fn (AppReleaseHeaderRule $rule): array => $rule->serialise(), $this->headers),
            'cache' => array_map(static fn (AppReleaseCacheRule $rule): array => $rule->serialise(), $this->cache),
            'shareableRoutes' => array_map(static fn (AppReleaseShareableRoute $route): array => $route->serialise(), $this->shareableRoutes),
            'siteCard' => $this->siteCard?->serialise(),
        ];

        return array_filter($body, static fn (mixed $value): bool => $value !== null && $value !== []);
    }
}
