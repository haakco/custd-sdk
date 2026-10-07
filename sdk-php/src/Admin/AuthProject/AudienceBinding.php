<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * AudienceBinding is one application audience the environment admits and its
 * provider registration settings.
 *
 * This is the binding a consumer's edge admits against; the contract derives the
 * audience group `custd-group-<environmentID>-<audienceSlug>` from it. It is
 * both a desired-state input and a status output.
 */
final readonly class AudienceBinding
{
    /**
     * @param list<string>|null $redirectUris
     * @param list<string>|null $postLogoutRedirectUris
     * @param list<string>|null $allowedOrigins
     */
    public function __construct(
        public string $audience,
        public bool $publicClient,
        public ?array $redirectUris = null,
        public ?array $postLogoutRedirectUris = null,
        public ?array $allowedOrigins = null,
    ) {
        if (trim($audience) === "") {
            throw new \InvalidArgumentException("custd: audience binding audience is required");
        }
        self::assertStringList($redirectUris, "redirectUris");
        self::assertStringList($postLogoutRedirectUris, "postLogoutRedirectUris");
        self::assertStringList($allowedOrigins, "allowedOrigins");
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "audience" => $this->audience,
            "publicClient" => $this->publicClient,
            "redirectUris" => $this->redirectUris,
            "postLogoutRedirectUris" => $this->postLogoutRedirectUris,
            "allowedOrigins" => $this->allowedOrigins,
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "audience"),
            Fields::boolean($payload, "publicClient"),
            Fields::optionalStrings($payload, "redirectUris"),
            Fields::optionalStrings($payload, "postLogoutRedirectUris"),
            Fields::optionalStrings($payload, "allowedOrigins"),
        );
    }

    /** @param list<string>|null $values */
    private static function assertStringList(?array $values, string $field): void
    {
        if ($values === null) {
            return;
        }
        if (!array_is_list($values)) {
            throw new \InvalidArgumentException("custd: audience binding {$field} must be a list");
        }
        foreach ($values as $value) {
            if (!is_string($value)) {
                throw new \InvalidArgumentException("custd: audience binding {$field} must contain strings");
            }
        }
    }
}
