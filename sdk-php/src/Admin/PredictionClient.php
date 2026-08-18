<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * PredictionClient owns the tenant-scoped configurable signal prediction
 * lifecycle. The company slug is sent explicitly on every request.
 */
final class PredictionClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /** @return array<string, mixed> */
    public function listDefinitions(string $companySlug, ?int $pageSize = null, ?string $pageToken = null): array
    {
        return $this->request("GET", $this->collection("/definitions", $companySlug, $pageSize, $pageToken)) ?? [];
    }

    /** @return array<string, mixed> */
    public function getDefinition(string $companySlug, string $definitionUuid): array
    {
        return $this->request("GET", $this->resource("/definitions/{$definitionUuid}", $companySlug)) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function createDefinition(string $companySlug, array $body): array
    {
        return $this->request("POST", $this->collection("/definitions", $companySlug), $body) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function updateDefinition(string $companySlug, string $definitionUuid, array $body): array
    {
        return $this->request("PATCH", $this->resource("/definitions/{$definitionUuid}", $companySlug), $body) ?? [];
    }

    /** @return array<string, mixed> */
    public function getVersion(string $companySlug, string $definitionUuid, string $versionUuid): array
    {
        return $this->request(
            "GET",
            $this->resource("/definitions/{$definitionUuid}/versions/{$versionUuid}", $companySlug),
        ) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function publishVersion(string $companySlug, string $definitionUuid, array $body): array
    {
        return $this->request("POST", $this->resource("/definitions/{$definitionUuid}/publish", $companySlug), $body) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function activateVersion(string $companySlug, string $definitionUuid, array $body): array
    {
        return $this->request("POST", $this->resource("/definitions/{$definitionUuid}/activate", $companySlug), $body) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function rollbackVersion(string $companySlug, string $definitionUuid, array $body): array
    {
        return $this->request("POST", $this->resource("/definitions/{$definitionUuid}/rollback", $companySlug), $body) ?? [];
    }

    /** @param array<string, mixed> $body */
    public function pauseDefinition(string $companySlug, string $definitionUuid, array $body = []): void
    {
        $this->request("POST", $this->resource("/definitions/{$definitionUuid}/pause", $companySlug), $body);
    }

    public function resumeDefinition(string $companySlug, string $definitionUuid): void
    {
        $this->request("POST", $this->resource("/definitions/{$definitionUuid}/resume", $companySlug));
    }

    public function archiveDefinition(string $companySlug, string $definitionUuid): void
    {
        $this->request("POST", $this->resource("/definitions/{$definitionUuid}/archive", $companySlug));
    }

    /** @param array<string, mixed> $body */
    public function runNow(string $companySlug, string $definitionUuid, array $body = []): void
    {
        $this->request("POST", $this->resource("/definitions/{$definitionUuid}/run-now", $companySlug), $body);
    }

    /** @return array<string, mixed>|array<int, array<string, mixed>> */
    public function listRuns(string $companySlug, string $definitionUuid, ?int $pageSize = null): array
    {
        return $this->request("GET", $this->collection("/definitions/{$definitionUuid}/runs", $companySlug, $pageSize)) ?? [];
    }

    /** @return array<string, mixed>|array<int, array<string, mixed>> */
    public function listOutcomes(string $companySlug, string $definitionUuid, ?int $pageSize = null): array
    {
        return $this->request("GET", $this->collection("/definitions/{$definitionUuid}/outcomes", $companySlug, $pageSize)) ?? [];
    }

    /** @return array<string, mixed> */
    public function getEvaluation(string $companySlug, string $definitionUuid): array
    {
        return $this->request("GET", $this->resource("/definitions/{$definitionUuid}/evaluations", $companySlug)) ?? [];
    }

    /** @return array<string, mixed>|array<int, array<string, mixed>> */
    public function listThresholdEvents(string $companySlug, string $definitionUuid, ?int $pageSize = null): array
    {
        return $this->request("GET", $this->collection("/definitions/{$definitionUuid}/threshold-events", $companySlug, $pageSize)) ?? [];
    }

    /** @return array<string, mixed>|array<int, array<string, mixed>> */
    public function listSignalSources(string $companySlug, ?int $pageSize = null, ?string $pageToken = null): array
    {
        return $this->request("GET", $this->collection("/sources", $companySlug, $pageSize, $pageToken)) ?? [];
    }

    /** @return array<string, mixed> */
    public function getSignalSource(string $companySlug, string $sourceUuid): array
    {
        return $this->request("GET", $this->resource("/sources/{$sourceUuid}", $companySlug)) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function createSignalSource(string $companySlug, array $body): array
    {
        return $this->request("POST", $this->collection("/sources", $companySlug), $body) ?? [];
    }

    public function activateSignalSource(string $companySlug, string $sourceUuid): void
    {
        $this->request("POST", $this->resource("/sources/{$sourceUuid}/activate", $companySlug));
    }

    public function archiveSignalSource(string $companySlug, string $sourceUuid): void
    {
        $this->request("POST", $this->resource("/sources/{$sourceUuid}/archive", $companySlug));
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|null
     */
    private function request(string $method, string $path, ?array $body = null): ?array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, $body);
    }

    private function collection(string $path, string $companySlug, ?int $pageSize = null, ?string $pageToken = null): string
    {
        $query = ["companySlug" => $companySlug];
        if ($pageSize !== null) {
            $query["pageSize"] = $pageSize;
        }
        if ($pageToken !== null) {
            $query["pageToken"] = $pageToken;
        }
        return "/measurement/predictions" . $path . "?" . http_build_query($query, "", "&", PHP_QUERY_RFC3986);
    }

    private function resource(string $path, string $companySlug): string
    {
        $segments = explode("/", $path);
        foreach ($segments as $index => $segment) {
            if ($index > 0) {
                $segments[$index] = rawurlencode($segment);
            }
        }
        return $this->collection(implode("/", $segments), $companySlug);
    }
}
