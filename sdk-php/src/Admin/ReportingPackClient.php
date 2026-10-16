<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\ReportingPack\ReportingPackDraft;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackDraftCreateRequest;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackDraftListResponse;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackDraftUpdateRequest;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackGeneration;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackPreviewRequest;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackPreviewResponse;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackSetupTemplateBindRequest;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackSetupTemplateBindResponse;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackSetupTemplateListResponse;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackValidateResponse;

/**
 * ReportingPackClient owns the admin-owned reporting-pack lifecycle and the
 * reviewed setup templates. The authority model is company_id; the SDK sends no
 * tenant slug on these surfaces. The setup-template bind is a pure build: it
 * creates no data, grants no scope, and writes no generation, so its result must
 * be posted through createDraft/preview only when the caller intends to.
 */
final class ReportingPackClient
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

    public function listDrafts(): ReportingPackDraftListResponse
    {
        return ReportingPackDraftListResponse::fromPayload($this->request('GET', '/reporting-packs/drafts'));
    }

    public function getDraft(string $draftId): ReportingPackDraft
    {
        return ReportingPackDraft::fromPayload(
            $this->request('GET', '/reporting-packs/drafts/' . rawurlencode($draftId))
        );
    }

    public function createDraft(ReportingPackDraftCreateRequest $request): ReportingPackDraft
    {
        return ReportingPackDraft::fromPayload(
            $this->request('POST', '/reporting-packs/drafts', $request->serialise())
        );
    }

    public function updateDraft(string $draftId, ReportingPackDraftUpdateRequest $request): ReportingPackDraft
    {
        return ReportingPackDraft::fromPayload(
            $this->request('PUT', '/reporting-packs/drafts/' . rawurlencode($draftId), $request->serialise())
        );
    }

    public function validate(ReportingPackDraftCreateRequest $request): ReportingPackValidateResponse
    {
        return ReportingPackValidateResponse::fromPayload(
            $this->request('POST', '/reporting-packs/validate', $request->serialise())
        );
    }

    public function preview(ReportingPackPreviewRequest $request): ReportingPackPreviewResponse
    {
        return ReportingPackPreviewResponse::fromPayload(
            $this->request('POST', '/reporting-packs/preview', $request->serialise())
        );
    }

    public function publish(string $draftId): ReportingPackGeneration
    {
        return ReportingPackGeneration::fromPayload(
            $this->request('POST', '/reporting-packs/drafts/' . rawurlencode($draftId) . '/publish')
        );
    }

    /** List the reviewed setup templates, each with its canonical definition. */
    public function listSetupTemplates(): ReportingPackSetupTemplateListResponse
    {
        return ReportingPackSetupTemplateListResponse::fromPayload(
            $this->request('GET', '/reporting-packs/setup-templates')
        );
    }

    /**
     * Apply typed bindings to one reviewed setup template and return the
     * server-built definition. A pure build; unknown kinds and invalid bindings
     * surface the backend's typed problem error faithfully.
     */
    public function bindSetupTemplate(
        string $kind,
        ReportingPackSetupTemplateBindRequest $request
    ): ReportingPackSetupTemplateBindResponse {
        return ReportingPackSetupTemplateBindResponse::fromPayload(
            $this->request(
                'POST',
                '/reporting-packs/setup-templates/' . rawurlencode($kind) . '/bind',
                $request->serialise(),
            )
        );
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function request(string $method, string $path, ?array $body = null): mixed
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
}
