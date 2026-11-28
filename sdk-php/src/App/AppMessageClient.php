<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Http;

/** The authenticated tenant user's private message archive. */
final class AppMessageClient
{
    private const ROOT = '/api/v1/app/messages';
    private const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

    private readonly AppHttp $http;

    /** @param \Closure():string $token */
    public function __construct(string $apiBaseUrl, private readonly \Closure $token, ?callable $transport = null)
    {
        $this->http = new AppHttp($apiBaseUrl, $transport);
    }

    public function session(): AppMessageSession
    {
        return AppMessageSession::fromPayload($this->object('GET', '/session'));
    }

    public function import(AppMessageBatchRequest $request): AppMessageBatchResponse
    {
        return AppMessageBatchResponse::fromPayload($this->object('POST', '/batch', $request->serialise()));
    }

    public function search(AppMessageSearchRequest $request): AppMessageSearchResponse
    {
        return AppMessageSearchResponse::fromPayload($this->object('POST', '/search', $request->serialise()));
    }

    public function get(string $messageUuid): AppMessageReadResponse
    {
        return AppMessageReadResponse::fromPayload($this->object('GET', '/' . rawurlencode($messageUuid)));
    }

    public function deleteSource(AppMessageSource $source): AppMessageDeleteSourceResponse
    {
        return AppMessageDeleteSourceResponse::fromPayload($this->object('DELETE', '/sources/' . $source->value));
    }

    public function uploadMedia(AppMessageMediaUpload $upload): AppMessageMediaMetadata
    {
        if ($upload->image === '' || strlen($upload->image) > self::MAX_MEDIA_BYTES) {
            throw new \InvalidArgumentException('custd: archive image must contain 1 byte to 10 MiB');
        }
        $payload = $this->http->object(
            'PUT',
            self::ROOT . '/' . rawurlencode($upload->messageUuid) . '/media',
            [],
            $upload->image,
            ($this->token)(),
            ['Content-Type' => 'application/octet-stream'],
        );

        return AppMessageMediaMetadata::fromPayload($payload);
    }

    public function downloadMedia(AppMessageMediaRef $reference): AppMessageMedia
    {
        $path = self::ROOT . '/' . rawurlencode($reference->messageUuid) . '/media/' . rawurlencode($reference->mediaUuid);
        $response = $this->http->exchange('GET', $path, [], null, ($this->token)(), []);
        $image = Http::successBody($response);
        $headers = array_change_key_case($response['headers'] ?? [], CASE_LOWER);
        $contentType = $headers['content-type'] ?? '';
        if ($image === null || $image === '' || strlen($image) > self::MAX_MEDIA_BYTES
            || !in_array($contentType, ['image/jpeg', 'image/png'], true)) {
            throw new \UnexpectedValueException('custd: archive image must be JPEG or PNG and contain 1 byte to 10 MiB');
        }

        return new AppMessageMedia($contentType, $image);
    }

    /** @param array<string, mixed>|null $body */
    private function object(string $method, string $path, ?array $body = null): \stdClass
    {
        return $this->http->object($method, self::ROOT . $path, [], $body, ($this->token)(), []);
    }
}
