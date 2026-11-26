<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Accounting\AccountingEvidenceCreateRequest;
use HaakCo\Custd\Admin\Accounting\AccountingEvidenceListResponse;
use HaakCo\Custd\Admin\Accounting\AccountingEvidenceResponse;

/**
 * AccountingEvidenceClient records and lists the accounting evidence reports reconcile against.
 */
final class AccountingEvidenceClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List tenant accounting evidence.
     */
    public function list(?string $asOf = null, ?int $limit = null): AccountingEvidenceListResponse
    {
        return AccountingEvidenceListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/accounting/evidence', ['asOf' => $asOf, 'limit' => $limit], null));
    }

    /**
     * Append tenant accounting evidence.
     */
    public function create(AccountingEvidenceCreateRequest $request): AccountingEvidenceResponse
    {
        return AccountingEvidenceResponse::fromPayload($this->http->object('POST', '/api/v1/admin/accounting/evidence', [], $request->serialise()));
    }
}
