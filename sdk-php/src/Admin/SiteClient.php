<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class SiteClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $site
     * @return array<string, mixed>
     */
    public function create(array $site): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/sites", $site) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function list(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/sites")
            ?? ["sites" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $siteUuid): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/sites/" . rawurlencode($siteUuid))
            ?? [];
    }

    public function delete(string $siteUuid): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "DELETE", "/sites/" . rawurlencode($siteUuid));
    }

    /**
     * @return array<string, mixed>
     */
    public function rotateWriteKey(string $siteUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/sites/" . rawurlencode($siteUuid) . "/rotate-write-key"
        ) ?? [];
    }
}
