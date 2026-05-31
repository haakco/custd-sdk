<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class TenantClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $tenant
     * @return array<string, mixed>
     */
    public function create(array $tenant): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/tenants", $tenant) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function list(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/tenants") ?? ["tenants" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $slug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/tenants/" . rawurlencode($slug)
        ) ?? [];
    }

    public function delete(string $slug): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "DELETE",
            "/tenants/" . rawurlencode($slug)
        );
    }
}
