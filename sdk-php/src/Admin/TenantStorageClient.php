<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * TenantStorageClient owns tenant-scoped storage location registration.
 * Locations are server-prefixed: the SDK submits clientLocation and the
 * server returns a serverAssignedPrefix that the SDK must use for raw
 * landing writes. Tenant is derived from the auth context; wrong-tenant
 * reads collapse to an empty list indistinguishable from "no locations".
 */
final class TenantStorageClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
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
            "/tenant-storage-locations",
            prefix: "/api/v1"
        ) ?? ["locations" => []];
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
            "/tenant-storage-locations",
            $request,
            prefix: "/api/v1"
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $id): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/tenant-storage-locations/" . rawurlencode($id),
            prefix: "/api/v1"
        ) ?? [];
    }

    /**
     * Revoke removes a tenant storage location. The server is the authority
     * for whether the prefix is immediately unusable; the SDK must not assume
     * partial deletes are atomic.
     */
    public function revoke(string $id): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "DELETE",
            "/tenant-storage-locations/" . rawurlencode($id),
            prefix: "/api/v1"
        );
    }
}
