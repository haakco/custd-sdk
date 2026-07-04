<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Admin\Http;

final class Client
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $dataSpace
     * @return array<string, mixed>
     */
    public function createDataSpace(array $dataSpace): array
    {
        return $this->request("POST", "/data-spaces", $dataSpace) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function listDataSpaces(): array
    {
        return $this->request("GET", "/data-spaces") ?? ["dataSpaces" => []];
    }

    public function revokeDataSpace(string $slug): void
    {
        $this->request("DELETE", "/data-spaces/" . rawurlencode($slug));
    }

    /**
     * @param array<string, mixed> $producer
     * @return array<string, mixed>
     */
    public function provisionProducer(array $producer): array
    {
        return $this->request("POST", "/producer-provisioning", $producer) ?? [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listProducers(?string $companySlug = null): array
    {
        $path = "/producer-provisioning";
        if ($companySlug !== null && $companySlug !== "") {
            $path .= "?companySlug=" . rawurlencode($companySlug);
        }
        return $this->request("GET", $path) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function rotateProducerSecret(string $clientId): array
    {
        return $this->request(
            "POST",
            "/producer-provisioning/" . rawurlencode($clientId) . "/rotate-secret"
        ) ?? [];
    }

    public function revokeProducer(string $clientId): void
    {
        $this->request("DELETE", "/producer-provisioning/" . rawurlencode($clientId));
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|array<int, array<string, mixed>>|null
     */
    private function request(string $method, string $path, ?array $body = null): ?array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, $body, "/api/v1");
    }
}
