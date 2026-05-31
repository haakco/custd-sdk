<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class OAuthClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
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
