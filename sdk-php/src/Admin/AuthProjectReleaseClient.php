<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\AuthProject\AppRelease;
use HaakCo\Custd\Admin\AuthProject\AppReleaseCreateRequest;
use HaakCo\Custd\Admin\AuthProject\AppReleaseList;
use HaakCo\Custd\Admin\AuthProject\AppReleasePromotion;
use HaakCo\Custd\Admin\AuthProject\AppReleaseUploadedFile;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;

/**
 * AuthProjectReleaseClient publishes a hosted environment's releases, reached through
 * AuthProjectClient::releases(). A release is created from its manifest, each listed file is
 * uploaded as raw bytes, the release is verified once every file reads back intact, and a verified
 * release is promoted to the environment's host. The environment must have hosting enabled.
 */
final class AuthProjectReleaseClient
{
    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport,
    ) {
        $this->token = $token;
    }

    /** List the environment's most recent releases; a null limit uses the server default (20, at most 100). */
    public function list(string $projectId, string $environmentId, ?int $limit = null, ?RequestOptions $options = null): AppReleaseList
    {
        $path = self::releases($projectId, $environmentId) . ($limit === null ? '' : '?limit=' . $limit);

        return AppReleaseList::fromPayload($this->call('GET', $path, null, $options));
    }

    /** Record a new, pending release from its manifest. */
    public function create(
        string $projectId,
        string $environmentId,
        AppReleaseCreateRequest $request,
        ?RequestOptions $options = null,
    ): AppRelease {
        return AppRelease::fromPayload($this->call('POST', self::releases($projectId, $environmentId), $request->serialise(), $options));
    }

    /** Store one manifest file of a pending release; Custd refuses bytes whose size or sha256 differ from it. */
    public function uploadFile(
        string $projectId,
        string $environmentId,
        string $releaseId,
        string $filePath,
        string $bytes,
        ?RequestOptions $options = null,
    ): AppReleaseUploadedFile {
        return AppReleaseUploadedFile::fromPayload(Http::requestRaw(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'POST',
            self::release($projectId, $environmentId, $releaseId) . '/files?' . http_build_query(['path' => $filePath]),
            $bytes,
            'application/octet-stream',
            '/api/v1/admin',
            null,
            $options?->owningUserUuid,
        ));
    }

    /** Read every file back and mark the release verified when all of them match the manifest. */
    public function verify(string $projectId, string $environmentId, string $releaseId, ?RequestOptions $options = null): AppRelease
    {
        return AppRelease::fromPayload($this->call('POST', self::release($projectId, $environmentId, $releaseId) . '/verify', null, $options));
    }

    /** Make a verified release the one the environment's host serves. */
    public function promote(
        string $projectId,
        string $environmentId,
        string $releaseId,
        ?RequestOptions $options = null,
    ): AppReleasePromotion {
        return AppReleasePromotion::fromPayload(
            $this->call('POST', self::release($projectId, $environmentId, $releaseId) . '/promote', null, $options)
        );
    }

    private static function releases(string $projectId, string $environmentId): string
    {
        return '/auth-projects/' . rawurlencode($projectId) . '/environments/' . rawurlencode($environmentId) . '/releases';
    }

    private static function release(string $projectId, string $environmentId, string $releaseId): string
    {
        return self::releases($projectId, $environmentId) . '/' . rawurlencode($releaseId);
    }

    /** @param array<string, mixed>|null $body */
    private function call(string $method, string $path, ?array $body, ?RequestOptions $options): mixed
    {
        return Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            $path,
            $body,
            '/api/v1/admin',
            $options?->idempotencyKey,
            $options?->owningUserUuid,
        );
    }
}
