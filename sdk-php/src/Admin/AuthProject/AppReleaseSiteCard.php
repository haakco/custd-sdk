<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseSiteCard is the share-preview card for the site's own pages. */
final readonly class AppReleaseSiteCard
{
    public function __construct(
        public string $title,
        public string $cardTemplate,
        public ?string $description = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            Fields::string($payload, 'cardTemplate'),
            Fields::optionalString($payload, 'description'),
        );
    }

    /** @return array<string, string> */
    public function serialise(): array
    {
        $body = ['title' => $this->title, 'cardTemplate' => $this->cardTemplate];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }

        return $body;
    }
}
