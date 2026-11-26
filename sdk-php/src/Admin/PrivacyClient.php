<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Privacy\PrivacyConsentListResponse;
use HaakCo\Custd\Admin\Privacy\PrivacyConsentRecord;
use HaakCo\Custd\Admin\Privacy\PrivacyConsentRecordRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyIdentifierListResponse;
use HaakCo\Custd\Admin\Privacy\PrivacyIdentifierMapRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyIdentifierMapping;
use HaakCo\Custd\Admin\Privacy\PrivacyRulesReplaceRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyRulesResponse;

/**
 * PrivacyClient keeps the tenant's consent records, identifier mappings and privacy rules.
 */
final class PrivacyClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List a subject's consent records.
     */
    public function listConsents(string $subjectId, ?string $companySlug = null): PrivacyConsentListResponse
    {
        return PrivacyConsentListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/privacy/consent', ['subjectId' => $subjectId, 'companySlug' => $companySlug], null));
    }

    /**
     * Record a consent grant or revocation.
     */
    public function recordConsent(PrivacyConsentRecordRequest $request): PrivacyConsentRecord
    {
        return PrivacyConsentRecord::fromPayload($this->http->object('POST', '/api/v1/admin/privacy/consent', [], $request->serialise()));
    }

    /**
     * Revoke a subject's consent for one purpose.
     */
    public function revokeConsent(string $subjectId, string $purpose, ?string $source = null, ?string $companySlug = null): PrivacyConsentRecord
    {
        return PrivacyConsentRecord::fromPayload($this->http->object('DELETE', '/api/v1/admin/privacy/consent/' . rawurlencode($subjectId), ['purpose' => $purpose, 'source' => $source, 'companySlug' => $companySlug], null));
    }

    /**
     * List a tenant's identifier mappings (truncated hash prefix only).
     */
    public function listIdentifierMappings(string $companySlug): PrivacyIdentifierListResponse
    {
        return PrivacyIdentifierListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/privacy/identifiers/' . rawurlencode($companySlug), [], null));
    }

    /**
     * Hash an external identifier and store the mapping.
     */
    public function mapIdentifier(string $companySlug, PrivacyIdentifierMapRequest $request): PrivacyIdentifierMapping
    {
        return PrivacyIdentifierMapping::fromPayload($this->http->object('POST', '/api/v1/admin/privacy/identifiers/' . rawurlencode($companySlug) . '/map', [], $request->serialise()));
    }

    /**
     * Get privacy rules.
     */
    public function getRules(?string $companySlug = null): PrivacyRulesResponse
    {
        return PrivacyRulesResponse::fromPayload($this->http->object('GET', '/api/v1/admin/privacy/rules', ['companySlug' => $companySlug], null));
    }

    /**
     * Replace privacy rules.
     */
    public function replaceRules(PrivacyRulesReplaceRequest $request): PrivacyRulesResponse
    {
        return PrivacyRulesResponse::fromPayload($this->http->object('PUT', '/api/v1/admin/privacy/rules', [], $request->serialise()));
    }
}
