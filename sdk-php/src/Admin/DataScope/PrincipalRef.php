<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * PrincipalRef names the verified principal a data grant belongs to. A human is
 * identified by the stable membership user UUID; a machine by its producer
 * client ID. It never carries an email, a display name, or free actor text.
 *
 * The same shape is the grant request and the grant response, so one DTO serves
 * both.
 */
final readonly class PrincipalRef
{
    /** The closed principal discriminators. */
    public const KINDS = ['human', 'machine'];

    /** The server's OAuth producer client ID bound, which includes already-issued credentials. */
    public const MAX_CLIENT_ID_BYTES = 255;

    public function __construct(
        public string $kind,
        public ?string $userUuid = null,
        public ?string $clientId = null,
    ) {
        if ($this->kind === 'human') {
            if ($this->userUuid === null || $this->clientId !== null || !DataScopeValidation::isUuid($this->userUuid)) {
                throw new \InvalidArgumentException('custd: a human principal requires userUuid and no clientId');
            }

            return;
        }
        if ($this->kind === 'machine') {
            if ($this->clientId === null || $this->userUuid !== null || !self::isValidClientId($this->clientId)) {
                throw new \InvalidArgumentException(
                    'custd: a machine principal requires a clientId of at most '
                    . self::MAX_CLIENT_ID_BYTES . ' bytes and no userUuid'
                );
            }

            return;
        }
        throw new \InvalidArgumentException('custd: data scope principal kind must be "human" or "machine"');
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = ['kind' => $this->kind];
        if ($this->userUuid !== null) {
            $payload['userUuid'] = $this->userUuid;
        }
        if ($this->clientId !== null) {
            $payload['clientId'] = $this->clientId;
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            Fields::optionalString($payload, 'userUuid'),
            Fields::optionalString($payload, 'clientId'),
        );
    }

    private static function isValidClientId(string $value): bool
    {
        return $value !== '' && strlen($value) <= self::MAX_CLIENT_ID_BYTES && $value === trim($value);
    }
}
