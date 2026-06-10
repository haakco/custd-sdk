<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress;

final class Settings
{
    private const DEFAULT_BASE_URL = "https://custd.k8.haak.co";
    private const DEFAULT_AUDIENCE = "custd";
    private const DEFAULT_SCOPES = ["events.write"];

    /**
     * @param array<int, string> $oauthScopes
     */
    private function __construct(
        private readonly bool $enabled,
        private readonly string $baseUrl,
        private readonly string $companySlug,
        private readonly string $environment,
        private readonly string $token,
        private readonly string $oauthClientId,
        private readonly string $oauthClientSecret,
        private readonly string $oauthTokenUrl,
        private readonly string $oauthAudience,
        private readonly array $oauthScopes,
    ) {
    }

    /**
     * @param array<string, mixed> $input
     */
    public static function fromArray(array $input): self
    {
        return new self(
            self::boolValue($input["enabled"] ?? false),
            self::urlValue($input["base_url"] ?? self::DEFAULT_BASE_URL),
            self::slugValue($input["company_slug"] ?? ""),
            self::slugValue($input["environment"] ?? "wordpress"),
            trim((string) ($input["token"] ?? "")),
            trim((string) ($input["oauth_client_id"] ?? "")),
            trim((string) ($input["oauth_client_secret"] ?? "")),
            self::urlValue($input["oauth_token_url"] ?? ""),
            trim((string) ($input["oauth_audience"] ?? self::DEFAULT_AUDIENCE)),
            self::scopesValue($input["oauth_scopes"] ?? self::DEFAULT_SCOPES),
        );
    }

    /**
     * @param array<string, string> $environment
     */
    public static function fromEnvironment(array $environment): self
    {
        return self::fromArray(self::environmentInput($environment));
    }

    /**
     * @param array<string, mixed> $options
     * @param array<string, string> $environment
     */
    public static function fromWordPressOptions(array $options, array $environment): self
    {
        return self::fromArray(array_merge(self::environmentInput($environment), $options));
    }

    /**
     * @param array<string, string> $environment
     * @return array<string, mixed>
     */
    private static function environmentInput(array $environment): array
    {
        return [
            "enabled" => $environment["CUSTD_WP_ENABLED"] ?? false,
            "base_url" => $environment["CUSTD_WP_BASE_URL"] ?? self::DEFAULT_BASE_URL,
            "company_slug" => $environment["CUSTD_WP_TENANT_SLUG"] ?? "",
            "environment" => $environment["CUSTD_WP_ENVIRONMENT"] ?? "wordpress",
            "token" => $environment["CUSTD_WP_TOKEN"] ?? "",
            "oauth_client_id" => $environment["CUSTD_WP_OAUTH_CLIENT_ID"] ?? "",
            "oauth_client_secret" => $environment["CUSTD_WP_OAUTH_CLIENT_SECRET"] ?? "",
            "oauth_token_url" => $environment["CUSTD_WP_OAUTH_TOKEN_URL"] ?? "",
            "oauth_audience" => $environment["CUSTD_WP_OAUTH_AUDIENCE"] ?? self::DEFAULT_AUDIENCE,
            "oauth_scopes" => $environment["CUSTD_WP_OAUTH_SCOPES"] ?? self::DEFAULT_SCOPES,
        ];
    }

    public function enabled(): bool
    {
        return $this->enabled;
    }

    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    public function companySlug(): string
    {
        return $this->companySlug;
    }

    public function environment(): string
    {
        return $this->environment;
    }

    public function token(): string
    {
        return $this->token;
    }

    public function oauthClientId(): string
    {
        return $this->oauthClientId;
    }

    public function oauthClientSecret(): string
    {
        return $this->oauthClientSecret;
    }

    public function oauthTokenUrl(): string
    {
        return $this->oauthTokenUrl;
    }

    public function oauthAudience(): string
    {
        return $this->oauthAudience;
    }

    /**
     * @return array<int, string>
     */
    public function oauthScopes(): array
    {
        return $this->oauthScopes;
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            "enabled" => $this->enabled,
            "base_url" => $this->baseUrl,
            "company_slug" => $this->companySlug,
            "environment" => $this->environment,
            "oauth_client_id" => $this->oauthClientId,
            "oauth_token_url" => $this->oauthTokenUrl,
            "oauth_audience" => $this->oauthAudience,
            "oauth_scopes" => $this->oauthScopes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toOptionArray(): array
    {
        return array_merge($this->toPublicArray(), [
            "token" => $this->token,
            "oauth_client_secret" => $this->oauthClientSecret,
        ]);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function sanitizeOptionArray(array $input): array
    {
        return self::fromArray($input)->toOptionArray();
    }

    private static function boolValue(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOL);
    }

    private static function urlValue(mixed $value): string
    {
        return rtrim(trim((string) $value), "/");
    }

    private static function slugValue(mixed $value): string
    {
        $slug = strtolower(trim((string) $value));
        $slug = preg_replace('/[^a-z0-9]+/', "-", $slug) ?? "";
        return trim($slug, "-");
    }

    /**
     * @return array<int, string>
     */
    private static function scopesValue(mixed $value): array
    {
        $values = is_array($value) ? $value : explode(",", (string) $value);
        $scopes = array_map(static fn (mixed $scope): string => trim((string) $scope), $values);
        $scopes = array_values(array_filter($scopes, static fn (string $scope): bool => $scope !== ""));
        return $scopes !== [] ? $scopes : self::DEFAULT_SCOPES;
    }

}
