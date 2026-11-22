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
 *
 * `displayName` is the customer-facing application name shown on invitations,
 * hosted sign-in and hosted account settings. `displayNameSource` records which
 * surface owns that name: `application` when the client edits it in Custd's
 * realm branding, `hosting` when the Hosting platform's application label is
 * the source of truth and Custd only mirrors it, so a Custd editor must not
 * overwrite it. Both are null when the caller does not know the field, which
 * leaves the stored value alone.
 */
final readonly class DesiredState
{
    /**
     * The closed set of surfaces that can own the application display name.
     *
     * @var list<string>
     */
    private const DISPLAY_NAME_SOURCES = ["application", "hosting"];

    /**
     * @param list<AudienceBinding>|null $audiences
     * @param list<ProfileField>|null $profileFields
     * @param string|null $displayName Customer-facing application name; `""` clears it and null
     *                                 keeps the stored name.
     * @param string|null $displayNameSource `application` or `hosting`.
     * @param bool $withdrawDisplayName Give the name back: with an empty `$displayName` and a
     *                                 declared `$displayNameSource`, clears the name and releases
     *                                 the owner only when that surface holds it. Another surface's
     *                                 name is left untouched.
     */
    public function __construct(
        public string $identityMode,
        public string $registrationPolicy,
        public bool $loginPaused,
        public ?array $audiences = null,
        public ?array $profileFields = null,
        public ?string $displayName = null,
        public ?string $displayNameSource = null,
        public bool $withdrawDisplayName = false,
    ) {
        AuthProjectClient::assertIdentityMode($identityMode);
        if (trim($registrationPolicy) === "") {
            throw new \InvalidArgumentException("custd: desired-state registrationPolicy is required");
        }
        self::assertDtoList($audiences, AudienceBinding::class, "audiences");
        self::assertDtoList($profileFields, ProfileField::class, "profileFields");
        if ($displayNameSource !== null) {
            self::assertDisplayNameSource($displayNameSource);
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        $payload = [
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
        // Both fields are omitted when unknown, so a consumer that has not been
        // taught the display name sends nothing and the stored name survives.
        if ($this->displayName !== null) {
            $payload["displayName"] = $this->displayName;
        }
        if ($this->displayNameSource !== null) {
            $payload["displayNameSource"] = $this->displayNameSource;
        }
        // Omitted when false, so no existing payload changes shape and an older
        // Custd simply ignores an instruction it has not been taught.
        if ($this->withdrawDisplayName) {
            $payload["withdrawDisplayName"] = true;
        }

        return $payload;
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
            Fields::optionalString($payload, "displayName"),
            Fields::optionalString($payload, "displayNameSource"),
        );
    }

    private static function assertDisplayNameSource(string $source): void
    {
        if (!in_array($source, self::DISPLAY_NAME_SOURCES, true)) {
            throw new \InvalidArgumentException(
                "custd: desired-state displayNameSource must be application or hosting"
            );
        }
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
