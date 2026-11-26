<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\MetadataRecorder;
use HaakCo\Custd\Problem;

final class Http
{
    /**
     * @param string|callable():string $token A bearer token, or a provider that
     *     returns one. A provider runs immediately before each request, so a
     *     client held longer than the token lifespan sends a fresh token
     *     instead of the one captured when it was constructed. A plain string
     *     keeps its previous meaning.
     * @param callable|null $transport Receives method, URL, body, token and
     *     an optional array of extra request headers. Existing four-argument
     *     transports remain valid because PHP ignores extra callback
     *     arguments.
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|null
     */
    public static function request(
        string $baseUrl,
        string|callable $token,
        ?callable $transport,
        string $method,
        string $path,
        ?array $body = null,
        string $prefix = "/api/v1/admin",
        ?string $idempotencyKey = null,
        ?string $owningUserUuid = null,
    ): ?array {
        $responseBody = self::readBody(
            $baseUrl,
            $token,
            $transport,
            $method,
            $path,
            $body,
            $prefix,
            $idempotencyKey,
            $owningUserUuid,
        );
        if ($responseBody === null) {
            return null;
        }
        $decoded = json_decode($responseBody, true, flags: JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * requestStructured issues the same request as {@see request} but decodes a
     * success body without associative conversion, so a JSON object stays a
     * stdClass and a JSON array stays an array. The new usage/range response
     * DTOs use it so validation can still tell an empty `{}` collection from an
     * empty `[]` collection.
     *
     * @param string|callable():string $token A bearer token or a token provider;
     *     see {@see request}.
     * @param callable|null $transport
     * @param array<string, mixed>|null $body
     * @param array<string, string> $headers Extra request headers, such as the acting company.
     */
    public static function requestStructured(
        string $baseUrl,
        string|callable $token,
        ?callable $transport,
        string $method,
        string $path,
        ?array $body = null,
        string $prefix = "/api/v1/admin",
        ?string $idempotencyKey = null,
        ?string $owningUserUuid = null,
        array $headers = [],
    ): mixed {
        $responseBody = self::readBody(
            $baseUrl,
            $token,
            $transport,
            $method,
            $path,
            $body,
            $prefix,
            $idempotencyKey,
            $owningUserUuid,
            null,
            $headers,
        );
        if ($responseBody === null) {
            return null;
        }
        return json_decode($responseBody, false, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * requestRaw sends an already encoded body (an upload) with its own content
     * type and decodes the answer as {@see requestStructured} does. A transport
     * receives the body as a string and the content type in its headers.
     *
     * @param string|callable():string $token A bearer token or a token provider;
     *     see {@see request}.
     * @param callable|null $transport
     */
    public static function requestRaw(
        string $baseUrl,
        string|callable $token,
        ?callable $transport,
        string $method,
        string $path,
        string $body,
        string $contentType,
        string $prefix = "/api/v1/admin",
        ?string $idempotencyKey = null,
        ?string $owningUserUuid = null,
    ): mixed {
        $responseBody = self::readBody(
            $baseUrl,
            $token,
            $transport,
            $method,
            $path,
            $body,
            $prefix,
            $idempotencyKey,
            $owningUserUuid,
            $contentType,
        );
        if ($responseBody === null) {
            return null;
        }
        return json_decode($responseBody, false, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * readBody performs the request and status handling shared by the associative
     * and shape-preserving decoders. It returns the raw success body, or null for
     * an empty or 204 response.
     *
     * A string body is sent as is with $contentType; an array body is JSON.
     *
     * @param string|callable():string $token
     * @param array<string, mixed>|string|null $body
     * @param array<string, string> $extraHeaders
     */
    private static function readBody(
        string $baseUrl,
        string|callable $token,
        ?callable $transport,
        string $method,
        string $path,
        array|string|null $body,
        string $prefix,
        ?string $idempotencyKey,
        ?string $owningUserUuid,
        ?string $contentType = null,
        array $extraHeaders = [],
    ): ?string {
        $url = rtrim($baseUrl, "/") . $prefix . $path;
        $headers = $extraHeaders;
        if ($contentType !== null) {
            $headers["Content-Type"] = $contentType;
        }
        if ($idempotencyKey !== null && trim($idempotencyKey) !== "") {
            $headers["Idempotency-Key"] = trim($idempotencyKey);
        }
        if ($owningUserUuid !== null && trim($owningUserUuid) !== "") {
            $headers["X-Custd-Owning-User-UUID"] = trim($owningUserUuid);
        }
        $token = self::resolveToken($token);
        $result = $transport
            ? $transport($method, $url, $body, $token, $headers)
            : self::curlRequest($method, $url, $body, $token, $headers);
        return self::successBody($result);
    }

    /**
     * successBody checks a transport result: a failure status throws the typed refusal, and a
     * success returns its body, or null for an empty or 204 answer.
     *
     * @internal
     */
    public static function successBody(mixed $result): ?string
    {
        $status = self::status($result);
        /** @var array{status:int, body:string, headers?:mixed} $result */
        MetadataRecorder::capture($result["headers"] ?? null);
        if ($status >= 400) {
            $workflowError = self::workflowError($result["body"], $status);
            if ($workflowError !== null) {
                throw $workflowError;
            }
            $problemError = self::problemError($result["body"], $status);
            if ($problemError !== null) {
                throw $problemError;
            }
            $message = self::errorMessage($result["body"], $status);
            throw new \RuntimeException("custd: {$message}");
        }
        if ($status === 204 || $result["body"] === "") {
            return null;
        }
        return $result["body"];
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
     * problemError types an RFC 9457 refusal so a caller can branch on its code.
     * A body carrying the flat `error` reason keeps the message path below.
     */
    private static function problemError(string $body, int $status): ?AdminProblemException
    {
        $decoded = json_decode(trim($body), true);
        if (!is_array($decoded) || (is_string($decoded["error"] ?? null) && $decoded["error"] !== "")) {
            return null;
        }
        $problem = Problem::fromArray($decoded);
        return $problem === null ? null : new AdminProblemException($status, $problem);
    }

    /**
     * Stream an authenticated response body into `$sink` as it arrives, never holding it in memory, and
     * describe what was written. A refusal is never written to the sink: it throws the typed error a JSON
     * call would. A failure after bytes were written leaves them in the sink, so the caller discards it.
     *
     * An injected transport returns the whole body, which is then written the same way.
     *
     * @param string|callable():string $token A bearer token or a token provider;
     *     see {@see request}.
     * @param callable|null $transport
     * @param resource $sink A writable stream.
     */
    public static function streamRequest(
        string $baseUrl,
        string|callable $token,
        ?callable $transport,
        string $method,
        string $path,
        mixed $sink,
        string $prefix = "/api/v1/admin",
    ): StreamedDownload {
        if (!is_resource($sink) || get_resource_type($sink) !== "stream") {
            throw new \InvalidArgumentException("custd: a download needs a writable stream");
        }
        $url = rtrim($baseUrl, "/") . $prefix . $path;
        $token = self::resolveToken($token);
        $hash = hash_init("sha256");
        $written = 0;
        $write = static function (string $chunk) use ($sink, $hash, &$written): void {
            self::writeAll($sink, $chunk);
            hash_update($hash, $chunk);
            $written += strlen($chunk);
        };
        if ($transport) {
            $result = $transport($method, $url, null, $token);
            self::successBody($result);
            /** @var array{status:int, body:string} $result */
            $write($result["body"]);
            $headers = self::headers($result);
        } else {
            $headers = self::curlStreamRequest($method, $url, $token, $write);
        }

        return new StreamedDownload(
            $written,
            hash_final($hash),
            $headers["content-type"] ?? "",
            $headers["x-request-id"] ?? "",
            $headers,
        );
    }

    /** @param resource $sink */
    private static function writeAll(mixed $sink, string $chunk): void
    {
        while ($chunk !== "") {
            $count = fwrite($sink, $chunk);
            if ($count === false || $count === 0) {
                throw new \RuntimeException("custd: download could not be written to the stream");
            }
            $chunk = substr($chunk, $count);
        }
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
     * resolveToken reads a token provider immediately before a request is sent.
     * The string check comes first so a plain-string token is never mistaken for
     * a callable just because it matches a function name.
     *
     * @param string|callable():string $token
     */
    private static function resolveToken(string|callable $token): string
    {
        return is_string($token) ? $token : $token();
    }

    /**
     * Headers every admin request carries. The SDK names its own release so
     * Custd can report which versions actually call it.
     *
     * @return array<int, string>
     */
    private static function baseHeaders(string $token, string $contentType = "application/json"): array
    {
        return [
            "Content-Type: " . $contentType,
            "Authorization: Bearer " . $token,
            "X-Custd-Sdk: " . CustdClient::PRODUCT . "/" . CustdClient::VERSION,
        ];
    }

    /**
     * @param array<string, mixed>|string|null $body
     * @param array<string, string> $extraHeaders
     * @return array{status:int, body:string, headers:array<string, string>}
     */
    private static function curlRequest(
        string $method,
        string $url,
        array|string|null $body,
        string $token,
        array $extraHeaders = [],
    ): array {
        $ch = curl_init($url);
        /** @var array<string, string> $responseHeaders */
        $responseHeaders = [];
        $headers = self::baseHeaders($token, $extraHeaders["Content-Type"] ?? "application/json");
        unset($extraHeaders["Content-Type"]);
        foreach ($extraHeaders as $name => $value) {
            $headers[] = $name . ": " . $value;
        }
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HEADERFUNCTION => MetadataRecorder::curlHeaderCollector($responseHeaders),
        ];
        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        if ($response === false) {
            throw new \RuntimeException("custd: admin request failed: " . curl_error($ch));
        }
        return [
            "status" => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            "body" => is_string($response) ? $response : "",
            "headers" => $responseHeaders,
        ];
    }

    /**
     * The connection must open within 15 seconds and the body may not stall for 30; a large download is
     * otherwise given the time it needs. A refusal's body is kept (bounded) to type the error.
     *
     * @param callable(string):void $write
     * @return array<string, string>
     */
    private static function curlStreamRequest(string $method, string $url, string $token, callable $write): array
    {
        $ch = curl_init($url);
        /** @var array<string, string> $responseHeaders */
        $responseHeaders = [];
        $refusal = "";
        $failure = null;
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_HTTPHEADER => self::baseHeaders($token),
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_LOW_SPEED_LIMIT => 1,
            CURLOPT_LOW_SPEED_TIME => 30,
            CURLOPT_HEADERFUNCTION => MetadataRecorder::curlHeaderCollector($responseHeaders),
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use ($write, &$refusal, &$failure): int {
                if ((int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE) >= 400) {
                    $refusal = substr($refusal . $chunk, 0, 65536);
                    return strlen($chunk);
                }
                try {
                    $write($chunk);
                } catch (\RuntimeException $error) {
                    $failure = $error;
                    return 0;
                }
                return strlen($chunk);
            },
        ]);
        $completed = curl_exec($ch);
        if ($failure !== null) {
            throw $failure;
        }
        if ($completed === false) {
            throw new \RuntimeException("custd: admin download failed: " . curl_error($ch));
        }
        self::successBody([
            "status" => (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE),
            "body" => $refusal,
            "headers" => $responseHeaders,
        ]);

        return $responseHeaders;
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
                "custd: admin_http_client download response headers must be array<string, string>"
            );
        }
        $normalized = [];
        foreach ($headers as $name => $value) {
            if (!is_string($name) || !is_string($value)) {
                throw new \UnexpectedValueException(
                    "custd: admin_http_client download response headers must be array<string, string>"
                );
            }
            $normalized[strtolower($name)] = $value;
        }
        return $normalized;
    }
}
