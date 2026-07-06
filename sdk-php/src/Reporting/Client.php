<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

final class Client
{
    /** @var callable|null */
    private $httpClient;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        ?callable $httpClient = null
    ) {
        $this->httpClient = $httpClient;
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(string $key): array
    {
        return $this->request("GET", "/api/v1/reporting/dashboards/" . rawurlencode($key));
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function query(array $query): array
    {
        $widget = $this->request("POST", "/api/v1/reporting/query", $query);
        if (self::containsUnsafeTrustKey($widget["trust"] ?? null)) {
            throw new \RuntimeException("custd: unsafe reporting trust diagnostics");
        }
        return $widget;
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        if ($this->httpClient === null) {
            throw new \RuntimeException("custd: reporting requires an admin_http_client transport");
        }
        $request = $this->httpClient;
        $response = $request($method, $this->baseUrl . $path, $body, $this->token);
        $status = (int) ($response["status"] ?? 0);
        if ($status >= 400) {
            throw new \RuntimeException("custd: reporting request failed with status {$status}");
        }
        $responseBody = $response["body"] ?? "";
        if ($status === 204 || $responseBody === "") {
            return [];
        }
        $decoded = json_decode((string) $responseBody, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new \RuntimeException("custd: reporting response body must be JSON object");
        }
        return $decoded;
    }

    private static function containsUnsafeTrustKey(mixed $value): bool
    {
        if (!is_array($value)) {
            return false;
        }
        $forbidden = [
            "rawpayload",
            "sql",
            "token",
            "secret",
            "stack",
            "email",
            "ipaddress",
            "hostname",
            "orderid",
            "carttoken",
        ];
        foreach ($value as $key => $child) {
            if (in_array(strtolower((string) $key), $forbidden, true) || self::containsUnsafeTrustKey($child)) {
                return true;
            }
        }
        return false;
    }
}
