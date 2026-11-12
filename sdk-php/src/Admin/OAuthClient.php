<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class OAuthClient
{
    /**
     * The purpose of a credential that manages one existing Site's Site Insights domains. Pass it
     * as purposeProfile together with siteUuid to create().
     */
    public const PURPOSE_SITE_INSIGHTS = 'site_insights';

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport,
    ) {
        $this->token = $token;
    }

    /**
     * @param array<string, mixed> $client
     * @return array<string, mixed>
     */
    public function create(array $client): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/oauth-clients", $client) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function list(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/oauth-clients")
            ?? ["clients" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $clientId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/oauth-clients/" . rawurlencode($clientId)
        ) ?? [];
    }

    public function delete(string $clientId): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "DELETE",
            "/oauth-clients/" . rawurlencode($clientId)
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function rotateSecret(string $clientId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/oauth-clients/" . rawurlencode($clientId) . "/rotate-secret"
        ) ?? [];
    }
}
