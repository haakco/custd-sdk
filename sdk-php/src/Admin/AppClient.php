<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\App\AppCreateRequest;
use HaakCo\Custd\Admin\App\AppCreation;
use HaakCo\Custd\Admin\App\AppDeployCredentialList;
use HaakCo\Custd\Admin\App\AppListResponse;
use HaakCo\Custd\Admin\App\AppOverview;
use HaakCo\Custd\Admin\App\AppSignInRequest;
use HaakCo\Custd\Admin\App\AppSummary;
use HaakCo\Custd\Admin\App\DeployCredential;

/**
 * AppClient creates and operates the tenant's hosted applications: their sign-in, deploy credentials and pause
 * state.
 */
final class AppClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List apps with one status each.
     */
    public function list(?string $after = null): AppListResponse
    {
        return AppListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/apps', ['after' => $after], null));
    }

    /**
     * Read one app.
     */
    public function get(string $slug): AppOverview
    {
        return AppOverview::fromPayload($this->http->object('GET', '/api/v1/admin/apps/' . rawurlencode($slug), [], null));
    }

    /**
     * Create an app from its name.
     */
    public function create(AppCreateRequest $request, string $idempotencyKey): AppCreation
    {
        return AppCreation::fromPayload($this->http->object('POST', '/api/v1/admin/apps', [], $request->serialise(), $idempotencyKey));
    }

    /**
     * List an app's CI deploy credentials.
     */
    public function listDeployCredentials(string $slug): AppDeployCredentialList
    {
        return AppDeployCredentialList::fromPayload($this->http->object('GET', '/api/v1/admin/apps/' . rawurlencode($slug) . '/deploy-credentials', [], null));
    }

    /**
     * Create a CI deploy credential for an app.
     */
    public function createDeployCredential(string $slug): DeployCredential
    {
        return DeployCredential::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/deploy-credentials', [], null));
    }

    /**
     * Delete an app's CI deploy credential.
     */
    public function deleteDeployCredential(string $slug, string $clientId): void
    {
        $this->http->none('DELETE', '/api/v1/admin/apps/' . rawurlencode($slug) . '/deploy-credentials/' . rawurlencode($clientId), [], null);
    }

    /**
     * List an app's purchase handoff credentials.
     */
    public function listPurchaseHandoffCredentials(string $slug): AppDeployCredentialList
    {
        return AppDeployCredentialList::fromPayload($this->http->object('GET', '/api/v1/admin/apps/' . rawurlencode($slug) . '/purchase-handoff-credentials', [], null));
    }

    /**
     * Create a purchase handoff credential for an app.
     */
    public function createPurchaseHandoffCredential(string $slug): DeployCredential
    {
        return DeployCredential::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/purchase-handoff-credentials', [], null));
    }

    /**
     * Delete an app's purchase handoff credential.
     */
    public function deletePurchaseHandoffCredential(string $slug, string $clientId): void
    {
        $this->http->none('DELETE', '/api/v1/admin/apps/' . rawurlencode($slug) . '/purchase-handoff-credentials/' . rawurlencode($clientId), [], null);
    }

    /**
     * Pause an app.
     */
    public function pause(string $slug, string $idempotencyKey): AppSummary
    {
        return AppSummary::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/pause', [], null, $idempotencyKey));
    }

    /**
     * Repair an app's setup.
     */
    public function repair(string $slug, string $idempotencyKey): AppSummary
    {
        return AppSummary::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/repair', [], null, $idempotencyKey));
    }

    /**
     * Resume an app.
     */
    public function resume(string $slug, string $idempotencyKey): AppSummary
    {
        return AppSummary::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/resume', [], null, $idempotencyKey));
    }

    /**
     * Set an app's sign-in mode.
     */
    public function setSignIn(string $slug, AppSignInRequest $request, string $idempotencyKey): AppSummary
    {
        return AppSummary::fromPayload($this->http->object('POST', '/api/v1/admin/apps/' . rawurlencode($slug) . '/sign-in', [], $request->serialise(), $idempotencyKey));
    }
}
