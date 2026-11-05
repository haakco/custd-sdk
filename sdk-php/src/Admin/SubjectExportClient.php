<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * SubjectExportClient owns per-tenant subject export requests. The download
 * surface returns a short-lived signed URL the SDK must surface only to the
 * caller; it must not be logged or echoed into error messages.
 */
final class SubjectExportClient
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
            "/subject-exports",
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
            "/subject-exports"
        ) ?? ["exports" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $requestId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/subject-exports/" . rawurlencode($requestId)
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function cancel(string $requestId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/subject-exports/" . rawurlencode($requestId) . "/cancel"
        ) ?? [];
    }

    /**
     * Download returns a short-lived signed URL. The downloadUrl field is
     * sensitive; callers must not log the URL or echo it into error messages.
     *
     * @return array<string, mixed>
     */
    public function download(string $requestId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/subject-exports/" . rawurlencode($requestId) . "/download"
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function force(string $requestId): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/subject-exports/" . rawurlencode($requestId) . "/force"
        ) ?? [];
    }
}
