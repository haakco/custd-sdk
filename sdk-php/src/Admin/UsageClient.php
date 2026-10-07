<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Usage\Query;
use HaakCo\Custd\Admin\Usage\Report;

/**
 * UsageClient reads attributed usage for the authenticated tenant through
 * GET /api/v1/admin/usage/me.
 *
 * The system-admin `/usage` and `/usage/export` surfaces are deliberately not
 * exposed here: a tenant client must not depend on system-admin filtering.
 */
final class UsageClient
{
    /** The row cap the service applies when a request omits a limit. */
    public const DEFAULT_LIMIT = 500;

    /** The most rows the usage endpoint returns in one request. */
    public const MAX_LIMIT = 5000;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * Return the attributed usage for the token's own tenant. The tenant is
     * derived from the credential, so the caller never supplies a company slug.
     *
     * The window is named and validated by {@see Query} before a request is sent.
     */
    public function get(?Query $query = null): Report
    {
        return Report::fromPayload(Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/usage/me" . ($query ?? new Query())->serialise()
        ));
    }
}
