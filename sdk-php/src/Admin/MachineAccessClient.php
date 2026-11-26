<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\MachineAccess\MachineAccessCompanyPolicy;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessCompanyUpdateRequest;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessEffective;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessMachinePolicy;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessMachineUpdateRequest;

/**
 * MachineAccessClient sets what a company's machine credentials (OAuth clients) may do, per feature area. The
 * policy only narrows: an allowed area still needs the client's own scopes. A blocked call is refused with an
 * AdminProblemException whose problem code is Problem::MACHINE_ACCESS_BLOCKED_CODE and whose machineAccess names
 * the area and the setting that blocked it.
 *
 * A tenant administrator manages its own company; platform authority names it with $companySlug. The per-machine
 * routes resolve the company from the client.
 */
final class MachineAccessClient
{
    private const PATH = '/api/v1/admin/machine-access';

    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    public function get(?string $companySlug = null): MachineAccessCompanyPolicy
    {
        return MachineAccessCompanyPolicy::fromPayload($this->http->object('GET', self::PATH, ['companySlug' => $companySlug]));
    }

    public function update(MachineAccessCompanyUpdateRequest $request, ?string $companySlug = null): MachineAccessCompanyPolicy
    {
        return MachineAccessCompanyPolicy::fromPayload(
            $this->http->object('PUT', self::PATH, ['companySlug' => $companySlug], $request->serialise()),
        );
    }

    public function getOverride(string $clientId): MachineAccessMachinePolicy
    {
        return MachineAccessMachinePolicy::fromPayload($this->http->object('GET', self::clientPath($clientId)));
    }

    public function updateOverride(string $clientId, MachineAccessMachineUpdateRequest $request): MachineAccessMachinePolicy
    {
        return MachineAccessMachinePolicy::fromPayload(
            $this->http->object('PUT', self::clientPath($clientId), [], $request->serialise()),
        );
    }

    public function getEffective(string $clientId): MachineAccessEffective
    {
        return MachineAccessEffective::fromPayload($this->http->object('GET', self::clientPath($clientId) . '/effective'));
    }

    private static function clientPath(string $clientId): string
    {
        return self::PATH . '/clients/' . rawurlencode($clientId);
    }
}
