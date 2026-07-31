<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * RetentionClient owns per-tenant retention policies. Effective-tenant
 * authority is enforced server-side; wrong-tenant requests return 404.
 */
final class RetentionClient
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
            "/retention/policies"
        ) ?? ["policies" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $tenantSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/retention/policies/" . rawurlencode($tenantSlug)
        ) ?? ["policies" => []];
    }

    /**
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function upsert(string $tenantSlug, array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "PUT",
            "/retention/policies/" . rawurlencode($tenantSlug),
            $request
        ) ?? [];
    }

    public function delete(string $tenantSlug): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "DELETE",
            "/retention/policies/" . rawurlencode($tenantSlug)
        );
    }

    /**
     * Preview asks the server to compute a deletion estimate without applying
     * it. The estimate is server-issued; the SDK must surface it verbatim and
     * never round or re-derive the per-store counts.
     *
     * @return array<string, mixed>
     */
    public function preview(string $tenantSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/retention/policies/" . rawurlencode($tenantSlug) . "/preview"
        ) ?? [];
    }

    /**
     * Apply submits the destructive retention run. The server is the authority
     * for whether deletion actually happens; the SDK must not pre-announce state.
     *
     * @return array<string, mixed>
     */
    public function apply(string $tenantSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/retention/policies/" . rawurlencode($tenantSlug) . "/apply"
        ) ?? [];
    }

    /**
     * ListRuns returns the retention runs for a single tenant. Empty runs list
     * is the canonical "no runs yet" response, not an error.
     *
     * @return array<string, mixed>
     */
    public function listRuns(string $tenantSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/retention/policies/" . rawurlencode($tenantSlug) . "/runs"
        ) ?? ["runs" => []];
    }
}
