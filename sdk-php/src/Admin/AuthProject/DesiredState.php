<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Admin\AuthProjectClient;
use HaakCo\Custd\Fields;

/**
 * DesiredState is the environment configuration an apply writes.
 *
 * A consumer builds it from these fields alone: `audiences` carries the audience
 * binding, and the remaining fields carry the rest. The legal scalar
 * vocabularies are read from the environment's capability operation, not fixed
 * here. It is both a desired-state input and part of the status output.
 */
final readonly class DesiredState
{
    /**
     * @param list<AudienceBinding>|null $audiences
     * @param list<ProfileField>|null $profileFields
     */
    public function __construct(
        public string $identityMode,
        public string $registrationPolicy,
        public bool $loginPaused,
        public ?array $audiences = null,
        public ?array $profileFields = null,
    ) {
        AuthProjectClient::assertIdentityMode($identityMode);
        if (trim($registrationPolicy) === "") {
            throw new \InvalidArgumentException("custd: desired-state registrationPolicy is required");
        }
        self::assertDtoList($audiences, AudienceBinding::class, "audiences");
        self::assertDtoList($profileFields, ProfileField::class, "profileFields");
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "identityMode" => $this->identityMode,
            "registrationPolicy" => $this->registrationPolicy,
            "loginPaused" => $this->loginPaused,
            "audiences" => $this->audiences === null
                ? null
                : array_map(static fn (AudienceBinding $binding): array => $binding->toPayload(), $this->audiences),
            "profileFields" => $this->profileFields === null
                ? null
                : array_map(static fn (ProfileField $field): array => $field->toPayload(), $this->profileFields),
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $audiences = Fields::optionalObjects($payload, "audiences");
        $profileFields = Fields::optionalObjects($payload, "profileFields");

        return new self(
            Fields::string($payload, "identityMode"),
            Fields::string($payload, "registrationPolicy"),
            Fields::boolean($payload, "loginPaused"),
            $audiences === null ? null : array_map(AudienceBinding::fromPayload(...), $audiences),
            $profileFields === null ? null : array_map(ProfileField::fromPayload(...), $profileFields),
        );
    }

    /**
     * @param list<AudienceBinding>|list<ProfileField>|null $values
     * @param class-string $type
     */
    private static function assertDtoList(?array $values, string $type, string $field): void
    {
        if ($values === null) {
            return;
        }
        if (!array_is_list($values)) {
            throw new \InvalidArgumentException("custd: desired-state {$field} must be a list");
        }
        foreach ($values as $value) {
            if (!$value instanceof $type) {
                throw new \InvalidArgumentException("custd: desired-state {$field} must contain {$type} DTOs");
            }
        }
    }
}
