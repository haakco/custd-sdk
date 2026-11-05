<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class SchemaClient
{
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
     * @return array<string, mixed>
     */
    public function list(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/schemas")
            ?? ["schemas" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $eventTypeSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/schemas/" . rawurlencode($eventTypeSlug),
        ) ?? [];
    }

    /**
     * @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    public function register(array $schema): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/schemas", $schema) ?? [];
    }

    /**
     * @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    public function createVersion(string $eventTypeSlug, array $schema): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/schemas/" . rawurlencode($eventTypeSlug) . "/versions",
            $schema,
        ) ?? [];
    }
}
