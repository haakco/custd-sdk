<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Uncertainty\CopyModelRequest;
use HaakCo\Custd\Admin\Uncertainty\CreateModelRequest;
use HaakCo\Custd\Admin\Uncertainty\CreateVersionRequest;
use HaakCo\Custd\Admin\Uncertainty\ModelDetail;
use HaakCo\Custd\Admin\Uncertainty\ModelList;
use HaakCo\Custd\Admin\Uncertainty\RunDetail;
use HaakCo\Custd\Admin\Uncertainty\RunList;
use HaakCo\Custd\Admin\Uncertainty\RunRequest;
use HaakCo\Custd\Admin\Uncertainty\Version;
use HaakCo\Custd\Admin\Uncertainty\VersionList;
use HaakCo\Custd\Admin\Uncertainty\ModelListSource;

/**
 * UncertaintyModelClient keeps uncertainty models and their immutable versions, and runs them on the Analytics
 * API.
 */
final class UncertaintyModelClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List the tenant's uncertainty models.
     *
     * @param ModelListSource::*|null $source
     */
    public function list(?string $source = null, ?string $companySlug = null): ModelList
    {
        return ModelList::fromPayload($this->http->object('GET', '/api/v1/admin/uncertainty-models', ['source' => $source, 'companySlug' => $companySlug], null));
    }

    /**
     * Get an uncertainty model with its latest version.
     */
    public function get(string $modelUuid, ?string $companySlug = null): ModelDetail
    {
        return ModelDetail::fromPayload($this->http->object('GET', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Create an uncertainty model, with version 1 when quantities are given.
     */
    public function create(CreateModelRequest $request, ?string $companySlug = null): ModelDetail
    {
        return ModelDetail::fromPayload($this->http->object('POST', '/api/v1/admin/uncertainty-models', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Copy one version of an uncertainty model into a new model.
     */
    public function copy(string $modelUuid, CopyModelRequest $request = new CopyModelRequest(), ?string $companySlug = null): ModelDetail
    {
        return ModelDetail::fromPayload($this->http->object('POST', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid) . '/copy', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Delete an uncertainty model with its versions and runs; an app item's model is deleted with its item.
     */
    public function delete(string $modelUuid, ?string $companySlug = null): void
    {
        $this->http->none('DELETE', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid), ['companySlug' => $companySlug], null);
    }

    /**
     * List an uncertainty model's versions, newest first.
     */
    public function listVersions(string $modelUuid, ?string $companySlug = null): VersionList
    {
        return VersionList::fromPayload($this->http->object('GET', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid) . '/versions', ['companySlug' => $companySlug], null));
    }

    /**
     * Get one version of an uncertainty model.
     */
    public function getVersion(string $modelUuid, int $versionNumber, ?string $companySlug = null): Version
    {
        return Version::fromPayload($this->http->object('GET', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid) . '/versions/' . rawurlencode((string) $versionNumber), ['companySlug' => $companySlug], null));
    }

    /**
     * Save a new immutable version of an uncertainty model.
     */
    public function createVersion(string $modelUuid, CreateVersionRequest $request, ?string $companySlug = null): Version
    {
        return Version::fromPayload($this->http->object('POST', '/api/v1/admin/uncertainty-models/' . rawurlencode($modelUuid) . '/versions', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * List an uncertainty model's runs.
     */
    public function listRuns(string $modelUuid): RunList
    {
        return RunList::fromPayload($this->http->object('GET', '/api/v1/measurement/uncertainty-models/' . rawurlencode($modelUuid) . '/runs', [], null));
    }

    /**
     * Get an uncertainty model run.
     */
    public function getRun(string $modelUuid, string $runUuid): RunDetail
    {
        return RunDetail::fromPayload($this->http->object('GET', '/api/v1/measurement/uncertainty-models/' . rawurlencode($modelUuid) . '/runs/' . rawurlencode($runUuid), [], null));
    }

    /**
     * Run an uncertainty model.
     */
    public function run(string $modelUuid, RunRequest $request): RunDetail
    {
        return RunDetail::fromPayload($this->http->object('POST', '/api/v1/measurement/uncertainty-models/' . rawurlencode($modelUuid) . '/runs', [], $request->serialise()));
    }
}
