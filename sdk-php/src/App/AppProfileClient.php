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

    public const SETTINGS_ENTRY_PATH = '/settings/entry';

    public const MAX_RETURN_PATH_BYTES = 512;

    /** 32 bytes as strict unpadded base64url: the last character carries only two data bits. */
    private const ENTRY_TICKET = '/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/D';

    private const INVALID_ENTRY_RESPONSE = 'custd: invalid app account entry response';

    private readonly AppHttp $http;

    /** @var callable|null */
    private readonly mixed $transport;

    /** @var string|callable():string */
    private readonly mixed $accessToken;

    /** @param string|callable():string $accessToken The application access token, or a provider run per request. */
    public function __construct(string $apiBaseUrl, string|callable $accessToken, ?callable $transport = null)
    {
        $this->http = new AppHttp($apiBaseUrl, $transport);
        $this->transport = $transport;
        $this->accessToken = $accessToken;
    }

    /** Obtain a hosted settings ticket for the signed-in user's application session. */
    public function createAccountEntry(AppAccountEntryRequest $request): AppAccountEntry
    {
        $token = $this->accessToken();
        $issuer = self::entryOrigin(str_ends_with($request->issuer, '/') ? substr($request->issuer, 0, -1) : $request->issuer);
        $body = ['applicationOrigin' => self::entryOrigin($request->applicationOrigin)];
        if ($request->returnPath !== '') {
            if (!self::validReturnPath($request->returnPath)) {
                throw new \InvalidArgumentException('custd: app account return path must be a path on the application origin');
            }
            $body['returnPath'] = $request->returnPath;
        }
        $result = (new AppHttp($issuer, $this->transport))->exchange(
            'POST',
            self::SETTINGS_ENTRY_PATH . '/ticket',
            [],
            $body,
            $token,
            ['Content-Type' => 'application/json'],
        );
        // Status only: an issuer error body could carry ticket material.
        if ($result['status'] < 200 || $result['status'] >= 300) {
            throw new AppAccountEntryException($result['status']);
        }
        $entry = json_decode($result['body'], true);
        $action = $issuer . self::SETTINGS_ENTRY_PATH;
        if (!is_array($entry) || ($entry['actionUrl'] ?? null) !== $action || !is_string($entry['ticket'] ?? null)
            || preg_match(self::ENTRY_TICKET, $entry['ticket']) !== 1) {
            throw new \UnexpectedValueException(self::INVALID_ENTRY_RESPONSE);
        }

        return new AppAccountEntry($action, $entry['ticket']);
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

    /** Return the value when it is already a serialized HTTPS origin: no path, credentials or :443. */
    private static function entryOrigin(string $raw): string
    {
        $parts = parse_url($raw);
        $host = is_array($parts) ? ($parts['host'] ?? '') : '';
        $port = is_array($parts) ? ($parts['port'] ?? null) : null;
        $serialized = 'https://' . $host . ($port === null ? '' : ':' . $port);
        if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || preg_match('/^(?:[a-z0-9.-]+|\[[0-9a-f:.]+\])$/D', $host) !== 1
            || isset($parts['user']) || isset($parts['pass']) || $port === 443 || $serialized !== $raw) {
            throw new \InvalidArgumentException('custd: app account entry requires a serialized HTTPS origin');
        }

        return $raw;
    }

    /** Mirror the issuer: an absolute path with an optional query and no fragment. */
    private static function validReturnPath(string $path): bool
    {
        return strlen($path) <= self::MAX_RETURN_PATH_BYTES && str_starts_with($path, '/') && !str_starts_with($path, '//')
            && preg_match('/[\x00-\x20\x7f\\\\#]/', $path) !== 1;
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
