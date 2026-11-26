<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * SocialProvider is one provider (`google` or `github`) in `shared` or `own` mode. `clientId` is
 * required for own mode. `clientSecret` is write-only: send it once for an own provider and leave
 * it null later to keep the stored secret. `clientSecretSet` is read-only.
 */
final readonly class SocialProvider
{
    public function __construct(
        public string $provider,
        public string $mode,
        public ?string $clientId = null,
        public ?string $clientSecret = null,
        public bool $clientSecretSet = false,
    ) {
    }

    /** @return array<string, string> */
    public function toPayload(): array
    {
        $payload = ['provider' => $this->provider, 'mode' => $this->mode];
        if ($this->clientId !== null) {
            $payload['clientId'] = $this->clientId;
        }
        if ($this->clientSecret !== null) {
            $payload['clientSecret'] = $this->clientSecret;
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'mode'),
            Fields::optionalString($payload, 'clientId'),
            Fields::optionalString($payload, 'clientSecret'),
            Fields::optionalBoolean($payload, 'clientSecretSet') ?? false,
        );
    }
}
