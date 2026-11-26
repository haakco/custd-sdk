<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\DataScope\CreateResourceRequest;
use HaakCo\Custd\Admin\DataScope\CreateScopeRequest;
use HaakCo\Custd\Admin\DataScope\Grant;
use HaakCo\Custd\Admin\DataScope\GrantList;
use HaakCo\Custd\Admin\DataScope\PrincipalRef;
use HaakCo\Custd\Admin\DataScope\Scope;
use HaakCo\Custd\Admin\DataScope\ScopeList;
use HaakCo\Custd\Admin\DataScope\ScopeResource;
use HaakCo\Custd\Admin\DataScope\ScopeResourceList;
use HaakCo\Custd\Admin\DataScope\UpdateResourceRequest;
use HaakCo\Custd\Admin\DataScope\UpdateScopeRequest;
use HaakCo\Custd\Fields;

/**
 * DataScopeClient owns parent-owned data-scope management: scopes, resources and
 * explicit principal grants. It is reached through CustdClient::adminDataScopes()
 * and reuses the shared {@see Http} admin transport, so no data-scope-specific
 * transport exists.
 *
 * The routes are addressed by external UUIDs; the immutable scope/resource codes
 * are the selectors event and query traffic use. Client-side checks are
 * shape-only; the server is the authority on what a principal may hold. A
 * system administrator names the tenant with companySlug.
 */
final class DataScopeClient
{
    private const PREFIX = '/api/v1/admin';

    /** @var callable|null */
    private $transport;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        ?callable $transport = null
    ) {
        $this->token = $token;
        $this->transport = $transport;
    }

    /** Create a parent-company data scope. */
    public function createScope(CreateScopeRequest $request, ?string $companySlug = null): Scope
    {
        return Scope::fromPayload($this->sendStructured('POST', self::tenant('/data-scopes', $companySlug), $request->serialise()));
    }

    /** List the parent company's data scopes. */
    public function listScopes(bool $includeDisabled = false, ?string $companySlug = null): ScopeList
    {
        return ScopeList::fromPayload(
            $this->sendStructured('GET', self::tenant('/data-scopes', $companySlug, $includeDisabled))
        );
    }

    /** Return one data scope by its external UUID. */
    public function getScope(string $uuid, ?string $companySlug = null): Scope
    {
        return Scope::fromPayload($this->sendStructured('GET', self::tenant('/data-scopes/' . rawurlencode($uuid), $companySlug)));
    }

    /** Change the editable fields of a scope. */
    public function updateScope(string $uuid, UpdateScopeRequest $request, ?string $companySlug = null): Scope
    {
        return Scope::fromPayload(
            $this->sendStructured('PATCH', self::tenant('/data-scopes/' . rawurlencode($uuid), $companySlug), $request->serialise())
        );
    }

    /** Disable a data scope. The route returns 204 No Content. */
    public function disableScope(string $uuid, ?string $companySlug = null): void
    {
        $this->send('POST', self::tenant('/data-scopes/' . rawurlencode($uuid) . '/disable', $companySlug));
    }

    /** Create a resource inside a scope. The scope is taken from the route. */
    public function createResource(string $scopeUuid, CreateResourceRequest $request, ?string $companySlug = null): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('POST', self::tenant(self::resourceCollection($scopeUuid), $companySlug), $request->serialise())
        );
    }

    /** List the resources inside a scope. */
    public function listResources(string $scopeUuid, bool $includeDisabled = false, ?string $companySlug = null): ScopeResourceList
    {
        return ScopeResourceList::fromPayload(
            $this->sendStructured('GET', self::tenant(self::resourceCollection($scopeUuid), $companySlug, $includeDisabled))
        );
    }

    /** Return one resource inside a scope by its external UUID. */
    public function getResource(string $scopeUuid, string $resourceUuid, ?string $companySlug = null): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('GET', self::tenant(self::resourcePath($scopeUuid, $resourceUuid), $companySlug))
        );
    }

    /** Change the editable fields of a resource. */
    public function updateResource(string $scopeUuid, string $resourceUuid, UpdateResourceRequest $request, ?string $companySlug = null): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('PATCH', self::tenant(self::resourcePath($scopeUuid, $resourceUuid), $companySlug), $request->serialise())
        );
    }

    /** Disable a resource. The route returns 204 No Content. */
    public function disableResource(string $scopeUuid, string $resourceUuid, ?string $companySlug = null): void
    {
        $this->send('POST', self::tenant(self::resourcePath($scopeUuid, $resourceUuid) . '/disable', $companySlug));
    }

    /** List one principal's explicit grants. */
    public function listGrants(PrincipalRef $principal, ?string $companySlug = null): GrantList
    {
        $query = ['kind' => $principal->kind, 'userUuid' => $principal->userUuid, 'clientId' => $principal->clientId, 'companySlug' => $companySlug];

        return GrantList::fromPayload($this->sendStructured('GET', ApiHttp::withQuery('/data-scope-grants', $query)));
    }

    /** Create one explicit principal grant. */
    public function createGrant(Grant $grant, ?string $companySlug = null): Grant
    {
        return Grant::fromPayload($this->sendStructured('POST', self::tenant('/data-scope-grants', $companySlug), $grant->serialise()));
    }

    /** Revoke one explicit principal grant. The route returns 204 No Content. */
    public function revokeGrant(Grant $grant, ?string $companySlug = null): void
    {
        $this->send('POST', self::tenant('/data-scope-grants/revoke', $companySlug), $grant->serialise());
    }

    /** tenant adds the system administrator's tenant override and, for a list, includeDisabled. */
    private static function tenant(string $path, ?string $companySlug, bool $includeDisabled = false): string
    {
        return ApiHttp::withQuery($path, ['includeDisabled' => $includeDisabled ? true : null, 'companySlug' => $companySlug]);
    }

    private static function resourceCollection(string $scopeUuid): string
    {
        return '/data-scopes/' . rawurlencode($scopeUuid) . '/resources';
    }

    private static function resourcePath(string $scopeUuid, string $resourceUuid): string
    {
        return self::resourceCollection($scopeUuid) . '/' . rawurlencode($resourceUuid);
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function send(string $method, string $path, ?array $body = null): mixed
    {
        return Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            $path,
            $body,
            self::PREFIX
        );
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function sendStructured(string $method, string $path, ?array $body = null): \stdClass
    {
        return Fields::jsonObject($this->send($method, $path, $body), 'data scope response');
    }
}
