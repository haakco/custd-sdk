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
 * leaves the stored value alone. A status always reports the source and reports
 * an unnamed realm as `""`, which this class reads as a null name: applied again,
 * the reported source alone clears the name that is already clear.
 *
 * The remaining sections are sent only when set: `entryPath` is the realm's public entry path,
 * `brandAccent` its `#rrggbb` sign-in accent, `signInMethods` narrows the sign-in methods it offers,
 * `applicationSessionPolicy` is `offer_remember_me` or `short_only`, `hosting` serves the environment
 * as a hosted application and `socialSignIn` is the social providers it offers.
 *
 * What an unset section means follows Custd's apply. `entryPath`, `brandAccent` and `signInMethods`
 * have no keep: Custd stores an omitted, empty or null value as unset, so an apply that leaves them
 * unset clears them. A status reports an unset value as `""` or an empty list, and this class reads
 * that as null and never sends it, so a desired state read from a status and applied again is a
 * no-op, and it compares equal to one that never named the section. A null
 * `applicationSessionPolicy`, `hosting` or `socialSignIn` keeps the stored section.
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
     * @param list<string>|null $signInMethods
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
        public ?string $entryPath = null,
        public ?string $brandAccent = null,
        public ?array $signInMethods = null,
        public ?string $applicationSessionPolicy = null,
        public ?Hosting $hosting = null,
        public ?SocialSignIn $socialSignIn = null,
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

        return $this->withSections($payload);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function withSections(array $payload): array
    {
        $sections = [
            "entryPath" => $this->entryPath,
            "brandAccent" => $this->brandAccent,
            "signInMethods" => $this->signInMethods,
            "applicationSessionPolicy" => $this->applicationSessionPolicy,
            "hosting" => $this->hosting?->toPayload(),
            "socialSignIn" => $this->socialSignIn?->toPayload(),
        ];
        foreach ($sections as $key => $value) {
            if ($value !== null && $value !== "" && $value !== []) {
                $payload[$key] = $value;
            }
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $audiences = Fields::optionalObjects($payload, "audiences");
        $profileFields = Fields::optionalObjects($payload, "profileFields");
        $hosting = Fields::optionalObject($payload, "hosting");
        $socialSignIn = Fields::optionalObject($payload, "socialSignIn");

        return new self(
            Fields::string($payload, "identityMode"),
            Fields::string($payload, "registrationPolicy"),
            Fields::boolean($payload, "loginPaused"),
            $audiences === null ? null : array_map(AudienceBinding::fromPayload(...), $audiences),
            $profileFields === null ? null : array_map(ProfileField::fromPayload(...), $profileFields),
            self::unsetWhenEmpty(Fields::optionalString($payload, "displayName")),
            Fields::optionalString($payload, "displayNameSource"),
            false,
            self::unsetWhenEmpty(Fields::optionalString($payload, "entryPath")),
            self::unsetWhenEmpty(Fields::optionalString($payload, "brandAccent")),
            self::unsetWhenEmpty(Fields::optionalStrings($payload, "signInMethods")),
            Fields::optionalString($payload, "applicationSessionPolicy"),
            $hosting === null ? null : Hosting::fromPayload($hosting),
            $socialSignIn === null ? null : SocialSignIn::fromPayload($socialSignIn),
        );
    }

    /**
     * Custd reports an unset name, entry path, accent or method list as empty; null is this class's unset.
     *
     * @template T of string|list<string>
     * @param T|null $value
     * @return T|null
     */
    private static function unsetWhenEmpty(string|array|null $value): string|array|null
    {
        return $value === "" || $value === [] ? null : $value;
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
