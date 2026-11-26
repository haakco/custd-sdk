<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingAction
{
    public function __construct(
        public string $description,
        public ?string $partUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'description'),
            Fields::optionalString($payload, 'partUuid'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'description' => $this->description,
        ];
        if ($this->partUuid !== null) {
            $body['partUuid'] = $this->partUuid;
        }

        return $body;
    }
}
