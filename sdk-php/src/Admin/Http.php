<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Problem;

final class Http
{
    private const MAX_BINARY_RESPONSE_BYTES = 64 * 1024 * 1024;

    /**
     * @param callable|null $transport Receives method, URL, body, token and
     *     an optional array of extra request headers. Existing four-argument
     *     transports remain valid because PHP ignores extra callback
     *     arguments.
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|null
     */
    public static function request(
        string $baseUrl,
        string $token,
        ?callable $transport,
        string $method,
        string $path,
        ?array $body = null,
        string $prefix = "/api/v1/admin",
        ?string $idempotencyKey = null,
    ): ?array {
        $url = rtrim($baseUrl, "/") . $prefix . $path;
        $headers = [];
        if ($idempotencyKey !== null && trim($idempotencyKey) !== "") {
            $headers["Idempotency-Key"] = trim($idempotencyKey);
        }
        $result = $transport
            ? $transport($method, $url, $body, $token, $headers)
            : self::curlRequest($method, $url, $body, $token, $headers);
        $status = self::status($result);
        if ($status >= 400) {
            $workflowError = self::workflowError($result["body"], $status);
            if ($workflowError !== null) {
                throw $workflowError;
            }
            $message = self::errorMessage($result["body"], $status);
            throw new \RuntimeException("custd: {$message}");
        }
        if ($status === 204 || $result["body"] === "") {
            return null;
        }
        $decoded = json_decode($result["body"], true, flags: JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : null;
    }

    private static function workflowError(string $body, int $status): ?AdminWorkflowException
    {
        $decoded = json_decode(trim($body), true);
        if (!is_array($decoded)) {
            return null;
        }
        $reason = is_string($decoded["error"] ?? null) ? $decoded["error"] : "";
        $code = is_string($decoded["code"] ?? null) ? $decoded["code"] : "";
        $safeNextAction = is_string($decoded["safe_next_action"] ?? null)
            ? $decoded["safe_next_action"]
            : "";
        if ($reason === "" || ($code === "" && $safeNextAction === "")) {
            return null;
        }
        return new AdminWorkflowException($status, $reason, $code, $safeNextAction);
    }

    /**
     * Fetch an authenticated binary response without attempting JSON decoding.
     *
     * @param callable|null $transport
     * @param array<string, mixed>|null $body
     * @return array{body:string, headers:array<string, string>}
     */
    public static function binaryRequest(
        string $baseUrl,
        string $token,
        ?callable $transport,
        string $method,
        string $path,
        ?array $body = null,
        string $prefix = "/api/v1/admin"
    ): array {
        $url = rtrim($baseUrl, "/") . $prefix . $path;
        $result = $transport
            ? $transport($method, $url, $body, $token)
            : self::curlBinaryRequest($method, $url, $body, $token);
        $status = self::status($result);
        if ($status >= 400) {
            throw new \RuntimeException("custd: " . self::errorMessage($result["body"], $status));
        }
        return [
            "body" => $result["body"],
            "headers" => self::headers($result),
        ];
    }

    /**
     * Surface a server error body as a human-readable message. Supports both
     * RFC 9457 problem+json (type/title/status/detail/code) and the custd
     * shorthand error/message shape used by the lifecycle admin endpoints.
     * Falls back to the status-only message when neither shape decodes.
     */
    private static function errorMessage(string $body, int $status): string
    {
        $trimmed = trim($body);
        if ($trimmed === "") {
            return "admin request failed with status {$status}";
        }
        $decoded = json_decode($trimmed, true);
        if (!is_array($decoded)) {
            return "admin request failed with status {$status}";
        }
        // Custd workflow errors use {error: reason, code: machine code,
        // safe_next_action: guidance}. Handle them before RFC Problem parsing
        // because `code` alone is also a valid Problem field.
        $reason = is_string($decoded["error"] ?? null) ? $decoded["error"] : "";
        $code = is_string($decoded["code"] ?? null) ? $decoded["code"] : "";
        $safeNext = is_string($decoded["safeNextAction"] ?? null)
            ? $decoded["safeNextAction"]
            : (is_string($decoded["safe_next_action"] ?? null) ? $decoded["safe_next_action"] : "");
        if ($reason !== "") {
            $message = $code !== ""
                ? "{$reason} [status {$status}, code {$code}]"
                : "{$reason} [status {$status}]";
            if ($safeNext !== "") {
                $message .= ", safeNextAction {$safeNext}";
            }
            return $message;
        }
        $problem = Problem::fromArray($decoded);
        if ($problem !== null) {
            return $problem->message();
        }
        return "admin request failed with status {$status}";
    }

    /**
     * @param array<string, mixed>|null $body
     * @param array<string, string> $extraHeaders
     * @return array{status:int, body:string}
     */
    private static function curlRequest(
        string $method,
        string $url,
        ?array $body,
        string $token,
        array $extraHeaders = [],
    ): array {
        $ch = curl_init($url);
        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token,
        ];
        foreach ($extraHeaders as $name => $value) {
            $headers[] = $name . ": " . $value;
        }
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
        ];
        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        if ($response === false) {
            throw new \RuntimeException("custd: admin request failed: " . curl_error($ch));
        }
        return [
            "status" => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            "body" => is_string($response) ? $response : "",
        ];
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array{status:int, body:string, headers:array<string, string>}
     */
    private static function curlBinaryRequest(string $method, string $url, ?array $body, string $token): array
    {
        $ch = curl_init($url);
        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token,
        ];
        /** @var array<string, string> $responseHeaders */
        $responseHeaders = [];
        $responseBody = "";
        $tooLarge = false;
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HEADERFUNCTION => static function ($unused, string $line) use (&$responseHeaders): int {
                $length = strlen($line);
                $separator = strpos($line, ":");
                if ($separator === false) {
                    return $length;
                }
                $name = strtolower(trim(substr($line, 0, $separator)));
                $value = trim(substr($line, $separator + 1));
                if ($name !== "") {
                    $responseHeaders[$name] = $value;
                }
                return $length;
            },
            CURLOPT_WRITEFUNCTION => static function ($unused, string $chunk) use (&$responseBody, &$tooLarge): int {
                if (strlen($responseBody) + strlen($chunk) > self::MAX_BINARY_RESPONSE_BYTES) {
                    $tooLarge = true;
                    return 0;
                }
                $responseBody .= $chunk;
                return strlen($chunk);
            },
        ];
        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($ch, $options);
        if (curl_exec($ch) === false && !$tooLarge) {
            throw new \RuntimeException("custd: admin request failed: " . curl_error($ch));
        }
        if ($tooLarge) {
            throw new \RuntimeException("custd: binary admin response exceeds 64 MiB");
        }
        return [
            "status" => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            "body" => $responseBody,
            "headers" => $responseHeaders,
        ];
    }

    /**
     * @param mixed $result
     */
    private static function status(mixed $result): int
    {
        if (!is_array($result) || !isset($result["status"], $result["body"])) {
            throw new \UnexpectedValueException(
                "custd: admin_http_client callable must return array{status:int, body:string}"
            );
        }
        if (!is_int($result["status"]) || !is_string($result["body"])) {
            throw new \UnexpectedValueException(
                "custd: admin_http_client callable must return array{status:int, body:string}"
            );
        }
        return $result["status"];
    }

    /**
     * @param array<string, mixed> $result
     * @return array<string, string>
     */
    private static function headers(array $result): array
    {
        $headers = $result["headers"] ?? [];
        if (!is_array($headers)) {
            throw new \UnexpectedValueException(
                "custd: admin_http_client binary response headers must be array<string, string>"
            );
        }
        $normalized = [];
        foreach ($headers as $name => $value) {
            if (!is_string($name) || !is_string($value)) {
                throw new \UnexpectedValueException(
                    "custd: admin_http_client binary response headers must be array<string, string>"
                );
            }
            $normalized[strtolower($name)] = $value;
        }
        return $normalized;
    }
}
