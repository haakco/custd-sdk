<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Problem;

final class Http
{
    /**
     * @param callable|null $transport
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
        string $prefix = "/api/v1/admin"
    ): ?array {
        $url = rtrim($baseUrl, "/") . $prefix . $path;
        $result = $transport
            ? $transport($method, $url, $body, $token)
            : self::curlRequest($method, $url, $body, $token);
        $status = self::status($result);
        if ($status >= 400) {
            $message = self::errorMessage($result["body"], $status);
            throw new \RuntimeException("custd: {$message}");
        }
        if ($status === 204 || $result["body"] === "") {
            return null;
        }
        $decoded = json_decode($result["body"], true, flags: JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : null;
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
        $problem = Problem::fromArray($decoded);
        if ($problem !== null) {
            return $problem->message();
        }
        // Custd shorthand: { "error": "<machine_code>", "message": "<human>" }.
        // The machine code is the smallest identifier the SDK can surface so
        // callers can branch on it without parsing the human string.
        $code = is_string($decoded["error"] ?? null) ? $decoded["error"] : "";
        $human = is_string($decoded["message"] ?? null) ? $decoded["message"] : "";
        $safeNext = is_string($decoded["safeNextAction"] ?? null) ? $decoded["safeNextAction"] : "";
        if ($code !== "" && $human !== "") {
            $message = "{$human} [status {$status}, code {$code}]";
        } elseif ($human !== "") {
            $message = "{$human} [status {$status}]";
        } elseif ($code !== "") {
            $message = "{$code} [status {$status}]";
        } else {
            $message = "admin request failed with status {$status}";
        }
        if ($safeNext !== "") {
            $message .= ", safeNextAction {$safeNext}";
        }
        return $message;
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array{status:int, body:string}
     */
    private static function curlRequest(string $method, string $url, ?array $body, string $token): array
    {
        $ch = curl_init($url);
        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token,
        ];
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
}
