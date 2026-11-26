<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Fields;

/**
 * ApiHttp sends the typed requests of the operator clients: the path is the whole route, the
 * query drops unset values and a list repeats its name, and a JSON object answer is decoded
 * shape-preserving for the response DTO.
 *
 * @internal
 */
final class ApiHttp
{
    /** @var callable|null */
    private $transport;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        ?callable $transport = null,
    ) {
        $this->token = $token;
        $this->transport = $transport;
    }

    /**
     * Send a request whose answer is a JSON object.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|null $body
     * @param array<string, string> $headers
     */
    public function object(
        string $method,
        string $path,
        array $query = [],
        ?array $body = null,
        ?string $idempotencyKey = null,
        array $headers = [],
    ): \stdClass {
        return Fields::jsonObject(
            $this->structured($method, $path, $query, $body, $idempotencyKey, $headers),
            "{$method} {$path} response",
        );
    }

    /**
     * Send a request whose answer carries nothing the caller reads (204 No Content).
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|null $body
     * @param array<string, string> $headers
     */
    public function none(
        string $method,
        string $path,
        array $query = [],
        ?array $body = null,
        ?string $idempotencyKey = null,
        array $headers = [],
    ): void {
        $this->structured($method, $path, $query, $body, $idempotencyKey, $headers);
    }

    /**
     * Send a request and return its shape-preserving decoded answer: null when empty, a stdClass
     * for an object and a list for an array.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|null $body
     * @param array<string, string> $headers
     */
    public function structured(
        string $method,
        string $path,
        array $query = [],
        ?array $body = null,
        ?string $idempotencyKey = null,
        array $headers = [],
    ): mixed {
        $target = self::withQuery($path, $query);
        if ($body === []) {
            // A request DTO whose optional fields are all unset is the empty JSON object, which an
            // array body would encode as [].
            return Http::requestRaw(
                $this->baseUrl,
                $this->token,
                $this->transport,
                $method,
                $target,
                '{}',
                'application/json',
                '',
                $idempotencyKey,
            );
        }

        return Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            $target,
            $body,
            '',
            $idempotencyKey,
            null,
            $headers,
        );
    }

    /**
     * withQuery encodes the query in order; a list value repeats its name and a boolean is
     * true or false.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     */
    public static function withQuery(string $path, array $query): string
    {
        $pairs = [];
        foreach ($query as $name => $values) {
            foreach (is_array($values) ? $values : [$values] as $value) {
                if ($value === null || $value === '') {
                    continue;
                }
                $text = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
                $pairs[] = rawurlencode($name) . '=' . rawurlencode($text);
            }
        }

        return $pairs === [] ? $path : $path . '?' . implode('&', $pairs);
    }
}
