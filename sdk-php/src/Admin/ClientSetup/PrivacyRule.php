<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class PrivacyRule
{
    public function __construct(
        public string $action,
        public bool $enabled,
        public string $fieldPath,
        public ?int $truncateLength = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'action'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'fieldPath'),
            Fields::optionalInteger($payload, 'truncateLength'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'action' => $this->action,
            'enabled' => $this->enabled,
            'fieldPath' => $this->fieldPath,
        ];
        if ($this->truncateLength !== null) {
            $body['truncateLength'] = $this->truncateLength;
        }

        return $body;
    }
}
