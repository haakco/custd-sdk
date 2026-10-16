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
 * shape-only; the server is the authority on what a principal may hold.
 */
final class DataScopeClient
{
    private const PREFIX = '/api/v1/admin';

    /** @var callable|null */
    private $transport;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        ?callable $transport = null
    ) {
        $this->transport = $transport;
    }

    /** Create a parent-company data scope. */
    public function createScope(CreateScopeRequest $request): Scope
    {
        return Scope::fromPayload($this->sendStructured('POST', '/data-scopes', $request->serialise()));
    }

    /** List the parent company's data scopes. */
    public function listScopes(bool $includeDisabled = false): ScopeList
    {
        return ScopeList::fromPayload(
            $this->sendStructured('GET', '/data-scopes' . self::includeDisabled($includeDisabled))
        );
    }

    /** Return one data scope by its external UUID. */
    public function getScope(string $uuid): Scope
    {
        return Scope::fromPayload($this->sendStructured('GET', '/data-scopes/' . rawurlencode($uuid)));
    }

    /** Change the editable fields of a scope. */
    public function updateScope(string $uuid, UpdateScopeRequest $request): Scope
    {
        return Scope::fromPayload(
            $this->sendStructured('PATCH', '/data-scopes/' . rawurlencode($uuid), $request->serialise())
        );
    }

    /** Disable a data scope. The route returns 204 No Content. */
    public function disableScope(string $uuid): void
    {
        $this->send('POST', '/data-scopes/' . rawurlencode($uuid) . '/disable');
    }

    /** Create a resource inside a scope. The scope is taken from the route. */
    public function createResource(string $scopeUuid, CreateResourceRequest $request): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('POST', self::resourceCollection($scopeUuid), $request->serialise())
        );
    }

    /** List the resources inside a scope. */
    public function listResources(string $scopeUuid, bool $includeDisabled = false): ScopeResourceList
    {
        return ScopeResourceList::fromPayload(
            $this->sendStructured('GET', self::resourceCollection($scopeUuid) . self::includeDisabled($includeDisabled))
        );
    }

    /** Return one resource inside a scope by its external UUID. */
    public function getResource(string $scopeUuid, string $resourceUuid): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('GET', self::resourcePath($scopeUuid, $resourceUuid))
        );
    }

    /** Change the editable fields of a resource. */
    public function updateResource(string $scopeUuid, string $resourceUuid, UpdateResourceRequest $request): ScopeResource
    {
        return ScopeResource::fromPayload(
            $this->sendStructured('PATCH', self::resourcePath($scopeUuid, $resourceUuid), $request->serialise())
        );
    }

    /** Disable a resource. The route returns 204 No Content. */
    public function disableResource(string $scopeUuid, string $resourceUuid): void
    {
        $this->send('POST', self::resourcePath($scopeUuid, $resourceUuid) . '/disable');
    }

    /** List one principal's explicit grants. */
    public function listGrants(PrincipalRef $principal): GrantList
    {
        $params = ['kind' => $principal->kind];
        if ($principal->userUuid !== null) {
            $params['userUuid'] = $principal->userUuid;
        }
        if ($principal->clientId !== null) {
            $params['clientId'] = $principal->clientId;
        }

        return GrantList::fromPayload(
            $this->sendStructured('GET', '/data-scope-grants?' . http_build_query($params))
        );
    }

    /** Create one explicit principal grant. */
    public function createGrant(Grant $grant): Grant
    {
        return Grant::fromPayload($this->sendStructured('POST', '/data-scope-grants', $grant->serialise()));
    }

    /** Revoke one explicit principal grant. The route returns 204 No Content. */
    public function revokeGrant(Grant $grant): void
    {
        $this->send('POST', '/data-scope-grants/revoke', $grant->serialise());
    }

    private static function includeDisabled(bool $include): string
    {
        return $include ? '?includeDisabled=true' : '';
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
