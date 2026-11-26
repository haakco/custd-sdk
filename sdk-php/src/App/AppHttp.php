<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\ApiHttp;
use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Fields;
use HaakCo\Custd\MetadataRecorder;

/**
 * AppHttp sends the hosted-app routes. They never carry the operator's credential: each request
 * carries only the headers its route reads, such as the app's Site key, an item link token as the
 * bearer and the signed-in user's token.
 *
 * @internal
 */
final class AppHttp
{
    /** @var callable|null */
    private $transport;

    public function __construct(
        private readonly string $baseUrl,
        ?callable $transport = null,
    ) {
        $this->transport = $transport;
    }

    /**
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|string|null $body An array is sent as JSON; a string as is with its Content-Type header.
     * @param array<string, string> $headers
     */
    public function object(string $method, string $path, array $query, array|string|null $body, string $bearer, array $headers): \stdClass
    {
        $answer = $this->send($method, $path, $query, $body, $bearer, $headers);

        return Fields::jsonObject(
            $answer === null ? null : json_decode($answer, false, flags: JSON_THROW_ON_ERROR),
            "{$method} {$path} response",
        );
    }

    /**
     * Send a request and return its raw success body, or null when it is empty.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|string|null $body
     * @param array<string, string> $headers
     */
    public function send(string $method, string $path, array $query, array|string|null $body, string $bearer, array $headers): ?string
    {
        return Http::successBody($this->exchange($method, $path, $query, $body, $bearer, $headers));
    }

    /**
     * Send a request and return the transport's answer unchecked, for a route whose success is not a 2xx body,
     * such as a redirect that sets a cookie. Redirects are never followed.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|string|null $body
     * @param array<string, string> $headers
     * @return array{status:int, body:string, headers?:array<string, string>}
     */
    public function exchange(string $method, string $path, array $query, array|string|null $body, string $bearer, array $headers): array
    {
        $url = rtrim($this->baseUrl, '/') . ApiHttp::withQuery($path, $query);
        if ($body === []) {
            $body = '{}';
            $headers['Content-Type'] = 'application/json';
        }
        /** @var array{status:int, body:string, headers?:array<string, string>} $result */
        $result = $this->transport !== null
            ? ($this->transport)($method, $url, $body, $bearer, $headers)
            : self::curl($method, $url, $body, $bearer, $headers);
        MetadataRecorder::capture($result['headers'] ?? null);

        return $result;
    }

    /**
     * @param array<string, mixed>|string|null $body
     * @param array<string, string> $headers
     * @return array{status:int, body:string, headers:array<string, string>}
     */
    private static function curl(string $method, string $url, array|string|null $body, string $bearer, array $headers): array
    {
        $lines = ['X-Custd-Sdk: ' . CustdClient::PRODUCT . '/' . CustdClient::VERSION];
        if ($bearer !== '') {
            $lines[] = 'Authorization: Bearer ' . $bearer;
        }
        if ($body !== null && !isset($headers['Content-Type'])) {
            $headers['Content-Type'] = 'application/json';
        }
        foreach ($headers as $name => $value) {
            $lines[] = $name . ': ' . $value;
        }
        $ch = curl_init($url);
        /** @var array<string, string> $responseHeaders */
        $responseHeaders = [];
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $lines,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HEADERFUNCTION => MetadataRecorder::curlHeaderCollector($responseHeaders),
        ];
        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        if ($response === false) {
            throw new \RuntimeException('custd: app request failed: ' . curl_error($ch));
        }

        return [
            'status' => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            'body' => is_string($response) ? $response : '',
            'headers' => $responseHeaders,
        ];
    }
}
