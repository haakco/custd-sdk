<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
 * are forward-only: there is no cancel or retry surface because the server
 * contract has none. force is the bounded operator action.
 */
final class PrivacyErasureClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function create(array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/privacy/erasures",
            $request
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function list(): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/privacy/erasures"
        ) ?? ["erasures" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/privacy/erasures/" . rawurlencode($requestUuid)
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function force(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/privacy/erasures/" . rawurlencode($requestUuid) . "/force"
        ) ?? [];
    }
}
