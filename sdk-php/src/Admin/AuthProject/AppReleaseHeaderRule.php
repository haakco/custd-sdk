<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseHeaderRule sets framing and extra response headers on a route. */
final readonly class AppReleaseHeaderRule
{
    /**
     * @param list<AppReleaseResponseHeader> $headers
     * @param AppReleaseFramingMode::*|null $framing
     */
    public function __construct(
        public string $route,
        public ?string $framing = null,
        public array $headers = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $framing = Fields::optionalString($payload, 'framing');

        return new self(
            Fields::string($payload, 'route'),
            $framing === null ? null : $framing,
            array_map(AppReleaseResponseHeader::fromPayload(...), Fields::optionalObjects($payload, 'headers') ?? []),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = ['route' => $this->route];
        if ($this->framing !== null) {
            $body['framing'] = $this->framing;
        }
        if ($this->headers !== []) {
            $body['headers'] = array_map(static fn (AppReleaseResponseHeader $header): array => $header->serialise(), $this->headers);
        }

        return $body;
    }
}
