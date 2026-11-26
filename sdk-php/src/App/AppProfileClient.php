<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppProfileClient reads and changes the signed-in application user's own profile and photo. Its
 * only credential is that user's application access token, sent as the bearer; it never sends an
 * operator credential.
 */
final class AppProfileClient
{
    public const MAX_PHOTO_BYTES = 262144;

    private readonly AppHttp $http;

    /** @var string|callable():string */
    private readonly mixed $accessToken;

    /** @param string|callable():string $accessToken The application access token, or a provider run per request. */
    public function __construct(string $apiBaseUrl, string|callable $accessToken, ?callable $transport = null)
    {
        $this->http = new AppHttp($apiBaseUrl, $transport);
        $this->accessToken = $accessToken;
    }

    /** The user's photo; a PNG or WebP image of at most 256 KiB. */
    public function readPhoto(): AppProfilePhoto
    {
        return AppProfilePhoto::fromBytes($this->http->send('GET', '/api/v1/app/profile/photo', [], null, $this->accessToken(), []) ?? '');
    }

    /** Replace the user's photo. */
    public function uploadPhoto(AppProfilePhoto $photo): CurrentApplicationProfile
    {
        return $this->writePhoto('PUT', $photo);
    }

    /** Fill a previously uninitialized photo and return the current profile. */
    public function initializePhoto(AppProfilePhoto $photo): CurrentApplicationProfile
    {
        return $this->writePhoto('POST', $photo);
    }

    /**
     * Read the signed-in application profile.
     */
    public function read(): CurrentApplicationProfile
    {
        return CurrentApplicationProfile::fromPayload($this->http->object('GET', '/api/v1/app/profile', [], null, $this->accessToken(), []));
    }

    /**
     * Edit the signed-in application's profile names.
     */
    public function update(ProfileValuesRequest $request): CurrentApplicationProfile
    {
        return CurrentApplicationProfile::fromPayload($this->http->object('PATCH', '/api/v1/app/profile', [], $request->serialise(), $this->accessToken(), []));
    }

    /**
     * Initialize absent profile names.
     */
    public function initialize(ProfileValuesRequest $request): CurrentApplicationProfile
    {
        return CurrentApplicationProfile::fromPayload($this->http->object('POST', '/api/v1/app/profile', [], $request->serialise(), $this->accessToken(), []));
    }

    /**
     * Remove the signed-in user's photo.
     */
    public function removePhoto(): CurrentApplicationProfile
    {
        return CurrentApplicationProfile::fromPayload($this->http->object('DELETE', '/api/v1/app/profile/photo', [], null, $this->accessToken(), []));
    }

    private function writePhoto(string $method, AppProfilePhoto $photo): CurrentApplicationProfile
    {
        return CurrentApplicationProfile::fromPayload($this->http->object(
            $method,
            '/api/v1/app/profile/photo',
            [],
            $photo->bytes,
            $this->accessToken(),
            ['Content-Type' => $photo->contentType],
        ));
    }

    private function accessToken(): string
    {
        $token = is_string($this->accessToken) ? $this->accessToken : ($this->accessToken)();
        if ($token === '' || preg_match('/\s/', $token) === 1) {
            throw new \InvalidArgumentException('custd: an application access token is required');
        }

        return $token;
    }
}
