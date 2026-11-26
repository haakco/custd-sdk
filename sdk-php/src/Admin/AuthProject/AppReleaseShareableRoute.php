<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseShareableRoute is a route the host serves with a share-preview card. */
final readonly class AppReleaseShareableRoute
{
    public function __construct(
        public string $route,
        public string $kind,
        public string $cardTemplate,
        public string $title,
        public ?string $description = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'route'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'cardTemplate'),
            Fields::string($payload, 'title'),
            Fields::optionalString($payload, 'description'),
        );
    }

    /** @return array<string, string> */
    public function serialise(): array
    {
        $body = ['route' => $this->route, 'kind' => $this->kind, 'cardTemplate' => $this->cardTemplate, 'title' => $this->title];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }

        return $body;
    }
}
