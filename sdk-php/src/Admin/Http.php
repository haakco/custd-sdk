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
            $problem = Problem::parse($result["body"]);
            $message = $problem !== null
                ? $problem->message()
                : "admin request failed with status {$status}";
            throw new \RuntimeException("custd: {$message}");
        }
        if ($status === 204 || $result["body"] === "") {
            return null;
        }
        $decoded = json_decode($result["body"], true, flags: JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : null;
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
