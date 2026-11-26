<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\ErrorIssue\ErrorIssue;
use HaakCo\Custd\Admin\ErrorIssue\ErrorIssueDetail;
use HaakCo\Custd\Admin\ErrorIssue\ErrorIssueListResponse;
use HaakCo\Custd\Admin\ErrorIssue\ErrorIssueStateRequest;
use HaakCo\Custd\Admin\ErrorIssue\ErrorIssueListState;
use HaakCo\Custd\Admin\ErrorIssue\ErrorIssueSort;

/**
 * ErrorIssueClient lists and reads the error issues captured for the tenant's sites and moves them between
 * states.
 */
final class ErrorIssueClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List a tenant's error issues.
     *
     * @param ErrorIssueListState::*|null $state
     * @param ErrorIssueSort::*|null $sort
     */
    public function list(?string $siteUuid = null, ?string $state = null, ?string $sort = null, ?int $limit = null, ?string $cursor = null, ?string $companySlug = null): ErrorIssueListResponse
    {
        return ErrorIssueListResponse::fromPayload($this->http->object('GET', '/api/v1/error-issues', ['siteUuid' => $siteUuid, 'state' => $state, 'sort' => $sort, 'limit' => $limit, 'cursor' => $cursor, 'companySlug' => $companySlug], null));
    }

    /**
     * Get one error issue with its latest error.
     */
    public function get(string $issueUuid, ?string $companySlug = null): ErrorIssueDetail
    {
        return ErrorIssueDetail::fromPayload($this->http->object('GET', '/api/v1/error-issues/' . rawurlencode($issueUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Resolve, ignore or reopen an error issue.
     */
    public function updateState(string $issueUuid, ErrorIssueStateRequest $request, ?string $companySlug = null): ErrorIssue
    {
        return ErrorIssue::fromPayload($this->http->object('POST', '/api/v1/error-issues/' . rawurlencode($issueUuid) . '/state', ['companySlug' => $companySlug], $request->serialise()));
    }
}
