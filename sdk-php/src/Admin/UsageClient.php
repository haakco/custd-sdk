<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Usage\Report;

/**
 * UsageClient reads attributed usage for the authenticated tenant through
 * GET /api/v1/admin/usage/me.
 *
 * The system-admin `/usage` and `/usage/export` surfaces are deliberately not
 * exposed here: a tenant client must not depend on system-admin filtering.
 */
final class UsageClient
{
    /** The row cap the service applies when a request omits a limit. */
    public const DEFAULT_LIMIT = 500;

    /** The most rows the usage endpoint returns in one request. */
    public const MAX_LIMIT = 5000;

    /**
     * RFC3339 timestamps only, matching the service's time.Parse(time.RFC3339):
     * seconds and an explicit Z or numeric offset.
     */
    private const RFC3339_PATTERN = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/';

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * Return the attributed usage for the token's own tenant. The tenant is
     * derived from the credential, so the caller never supplies a company slug.
     *
     * @param array{
     *     meterSlug?: string,
     *     start?: string,
     *     end?: string,
     *     limit?: int
     * } $query
     */
    public function get(array $query = []): Report
    {
        $payload = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/usage/me" . self::queryString($query)
        ) ?? [];

        return Report::fromPayload($payload);
    }

    /**
     * Build the query string and reject locally what the service would reject
     * anyway, so an invalid window never costs a round trip.
     *
     * @param array<string, mixed> $query
     */
    private static function queryString(array $query): string
    {
        $start = $query["start"] ?? null;
        $end = $query["end"] ?? null;
        $limit = $query["limit"] ?? null;
        if ($limit !== null && (!is_int($limit) || $limit < 1 || $limit > self::MAX_LIMIT)) {
            throw new \InvalidArgumentException("custd: usage limit must be between 1 and " . self::MAX_LIMIT);
        }
        $startInstant = $start === null ? null : self::parseInstant($start, "start");
        $endInstant = $end === null ? null : self::parseInstant($end, "end");
        if ($startInstant !== null && $endInstant !== null && $startInstant >= $endInstant) {
            throw new \InvalidArgumentException("custd: usage start must be before end");
        }

        $params = [];
        if (is_string($end)) {
            $params["end"] = $end;
        }
        if (is_int($limit)) {
            $params["limit"] = (string) $limit;
        }
        $meter = $query["meterSlug"] ?? null;
        if (is_string($meter)) {
            $params["meter"] = $meter;
        }
        if (is_string($start)) {
            $params["start"] = $start;
        }

        return $params === [] ? "" : "?" . http_build_query($params);
    }

    private static function parseInstant(mixed $value, string $field): \DateTimeImmutable
    {
        if (!is_string($value) || preg_match(self::RFC3339_PATTERN, $value) !== 1) {
            throw new \InvalidArgumentException("custd: usage {$field} must be an RFC3339 timestamp");
        }

        return new \DateTimeImmutable($value);
    }
}
