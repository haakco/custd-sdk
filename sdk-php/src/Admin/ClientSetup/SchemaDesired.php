<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class SchemaDesired
{
    public function __construct(
        public bool $enabled,
        public string $eventTypeSlug,
        public string $version,
        public ?string $dialect = null,
        public mixed $schemaJson = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabled' => $this->enabled,
            'eventTypeSlug' => $this->eventTypeSlug,
            'version' => $this->version,
        ];
        if ($this->dialect !== null) {
            $body['dialect'] = $this->dialect;
        }
        if ($this->schemaJson !== null) {
            $body['schemaJson'] = $this->schemaJson;
        }

        return $body;
    }
}
