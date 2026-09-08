<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class AuditClient
{
    private const FILTER_QUERY_KEYS = [
        "scope", "companySlug", "affectedTenantSlug", "since", "until", "actorKind", "actorReference", "action",
        "resourceType", "resourceId", "outcome", "correlationId",
    ];
    private const LIST_QUERY_KEYS = [...self::FILTER_QUERY_KEYS, "limit", "cursor"];

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function listEvents(array $options = []): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/audit/events" . self::query($options),
        ) ?? ["events" => [], "nextCursor" => ["cursor" => ""]];
        return self::safeList($response);
    }

    /**
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function getEvent(string $eventId, array $options = []): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/audit/events/" . rawurlencode($eventId) . self::lookupQuery($options),
        ) ?? [];
        return self::safeEvent($response);
    }

    /**
     * Return the server-generated bounded CSV or JSON export without decoding
     * it. The response contains the raw body and normalized response headers.
     *
     * @param array<string, mixed> $options
     * @return array{body:string, headers:array<string, string>}
     */
    public function exportEvents(array $options = [], string $format = "json"): array
    {
        if ($format !== "csv" && $format !== "json") {
            throw new \InvalidArgumentException("custd: audit export format must be csv or json");
        }
        $query = self::query($options, false);
        $separator = $query === "" ? "?" : "&";
        return Http::binaryRequest(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/audit/events/export" . $query . $separator . "format=" . $format,
        );
    }

    /** @return array<string, mixed> */
    public function listReportingPackEvents(string $packKey): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/reporting-packs/audit-events?packKey=" . rawurlencode($packKey),
        ) ?? ["events" => []];
        $events = $response["events"] ?? [];
        if (!is_array($events)) {
            throw new \UnexpectedValueException("custd: reporting-pack audit list response events must be an array");
        }
        $safeEvents = [];
        foreach (array_values($events) as $event) {
            if (!is_array($event)) {
                throw new \UnexpectedValueException("custd: reporting-pack audit event response must be an object");
            }
            $safeEvents[] = array_intersect_key($event, array_flip([
                "action", "actorReference", "actorDisplayName", "resourceType", "resourceId", "packKey", "createdAt",
            ]));
        }
        return ["events" => $safeEvents];
    }

    /** @param array<string, mixed> $options */
    private static function query(array $options, bool $includePagination = true): string
    {
        $query = [];
        foreach ($includePagination ? self::LIST_QUERY_KEYS : self::FILTER_QUERY_KEYS as $key) {
            if (array_key_exists($key, $options) && $options[$key] !== null && $options[$key] !== "") {
                if (!is_scalar($options[$key])) {
                    throw new \InvalidArgumentException("custd: audit query value {$key} must be scalar");
                }
                $query[$key] = $options[$key];
            }
        }
        return $query === [] ? "" : "?" . http_build_query($query, "", "&", PHP_QUERY_RFC3986);
    }

    /** @param array<string, mixed> $options */
    private static function lookupQuery(array $options): string
    {
        $lookup = [];
        foreach (["scope", "companySlug"] as $key) {
            if (array_key_exists($key, $options) && $options[$key] !== null && $options[$key] !== "") {
                if (!is_scalar($options[$key])) {
                    throw new \InvalidArgumentException("custd: audit query value {$key} must be scalar");
                }
                $lookup[$key] = $options[$key];
            }
        }
        return $lookup === [] ? "" : "?" . http_build_query($lookup, "", "&", PHP_QUERY_RFC3986);
    }

    /**
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private static function safeList(array $response): array
    {
        $events = $response["events"] ?? [];
        if (!is_array($events)) {
            throw new \UnexpectedValueException("custd: audit list response events must be an array");
        }
        $safeEvents = array_map(static function (mixed $event): array {
            if (!is_array($event)) {
                throw new \UnexpectedValueException("custd: audit event response must be an object");
            }
            return self::safeEvent($event);
        }, array_values($events));
        $safe = [
            "events" => $safeEvents,
            "nextCursor" => is_array($response["nextCursor"] ?? null)
                ? ["cursor" => (string) (($response["nextCursor"]["cursor"] ?? ""))]
                : ["cursor" => ""],
        ];
        if (is_string($response["coverageBeginsAt"] ?? null)) {
            $safe["coverageBeginsAt"] = $response["coverageBeginsAt"];
        }
        $retention = self::safeRetention($response["retention"] ?? null);
        if ($retention !== null) {
            $safe["retention"] = $retention;
        }
        return $safe;
    }

    /**
     * @param array<string, mixed> $event
     * @return array<string, mixed>
     */
    private static function safeEvent(array $event): array
    {
        $eventId = $event["eventId"] ?? null;
        if (!is_string($eventId) || preg_match(
            "/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i",
            $eventId,
        ) !== 1) {
            throw new \UnexpectedValueException("custd: audit event response eventId must be a UUID");
        }
        $safe = [];
        foreach ([
            "eventId", "tenantSlug", "actorKind", "actorReference", "actorDisplayName", "action", "resourceType",
            "resourceId", "outcome", "correlationId", "operationId", "createdAt",
        ] as $key) {
            if (array_key_exists($key, $event)) {
                $safe[$key] = $event[$key];
            }
        }
        if (is_array($event["actorRoles"] ?? null)) {
            $safe["actorRoles"] = array_values(array_filter($event["actorRoles"], "is_string"));
        }
        if (is_array($event["changes"] ?? null)) {
            $safeChanges = [];
            foreach ($event["changes"] as $change) {
                if (!is_array($change) || !is_string($change["field"] ?? null)) {
                    continue;
                }
                $safeChange = ["field" => $change["field"]];
                if (array_key_exists("before", $change)) {
                    $safeChange["before"] = $change["before"];
                }
                if (array_key_exists("after", $change)) {
                    $safeChange["after"] = $change["after"];
                }
                $safeChanges[] = $safeChange;
            }
            $safe["changes"] = $safeChanges;
        }
        if (is_array($event["details"] ?? null) && !array_is_list($event["details"])) {
            $safe["details"] = $event["details"];
        }
        $network = self::safeNetwork($event["network"] ?? null);
        if ($network !== null) {
            $safe["network"] = $network;
        }
        return $safe;
    }

    /**
     * @param mixed $value
     * @return array<string, string>|null
     */
    private static function safeNetwork(mixed $value): ?array
    {
        if (!is_array($value)) {
            return null;
        }
        $ipState = $value["ipAddressState"] ?? null;
        $userAgentState = $value["userAgentState"] ?? null;
        $states = ["available", "redacted", "not_recorded"];
        if (!is_string($ipState) || !in_array($ipState, $states, true) ||
            !is_string($userAgentState) || !in_array($userAgentState, $states, true)) {
            return null;
        }
        $network = ["ipAddressState" => $ipState, "userAgentState" => $userAgentState];
        if (is_string($value["ipAddress"] ?? null)) {
            $network["ipAddress"] = $value["ipAddress"];
        }
        if (is_string($value["userAgent"] ?? null)) {
            $network["userAgent"] = $value["userAgent"];
        }
        return $network;
    }

    /**
     * @param mixed $value
     * @return array<string, int>|null
     */
    private static function safeRetention(mixed $value): ?array
    {
        if (!is_array($value) || !is_int($value["eventMaxAgeSeconds"] ?? null) ||
            !is_int($value["ipAddressMaxAgeSeconds"] ?? null) || !is_int($value["userAgentMaxAgeSeconds"] ?? null)) {
            return null;
        }
        return [
            "eventMaxAgeSeconds" => $value["eventMaxAgeSeconds"],
            "ipAddressMaxAgeSeconds" => $value["ipAddressMaxAgeSeconds"],
            "userAgentMaxAgeSeconds" => $value["userAgentMaxAgeSeconds"],
        ];
    }
}
