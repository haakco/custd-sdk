<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class MeasurementProjectClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $project
     * @return array<string, mixed>
     */
    public function create(array $project): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/measurement/projects",
            $project,
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
            "/measurement/projects",
        ) ?? ["projects" => []];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(string $projectSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/measurement/projects/" . rawurlencode($projectSlug),
        ) ?? [];
    }

    /**
     * @param array<string, mixed> $observation
     * @return array<string, mixed>
     */
    public function submitObservation(string $projectSlug, array $observation): array
    {
        return $this->submitObservations($projectSlug, ["rows" => [$observation]]);
    }

    /**
     * @param array{rows: array<int, array<string, mixed>>} $request
     * @return array<string, mixed>
     */
    public function submitObservations(string $projectSlug, array $request): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/measurement/projects/" . rawurlencode($projectSlug) . "/observations:bulk",
            $request,
        ) ?? [];
        self::validateResults($response["results"] ?? null, count($request["rows"] ?? []));
        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function importCSVString(string $projectSlug, string $csv, int $expectedRows): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/measurement/projects/" . rawurlencode($projectSlug) . "/observations:csv",
            ["csv" => $csv],
        ) ?? [];
        self::validateResults($response["results"] ?? null, $expectedRows);
        return $response;
    }

    /**
     * @param mixed $results
     */
    private static function validateResults(mixed $results, int $submittedRows): void
    {
        if (!is_array($results) || count($results) !== $submittedRows) {
            $count = is_array($results) ? count($results) : 0;
            throw new \RuntimeException(
                "custd: measurement result count {$count} does not match submitted row count {$submittedRows}"
            );
        }
        foreach ($results as $index => $result) {
            if (!is_array($result)) {
                continue;
            }
            if (($result["success"] ?? false) === true && ($result["observationUuid"] ?? "") === "") {
                throw new \RuntimeException("custd: measurement result {$index} missing observationUuid");
            }
        }
    }
}
