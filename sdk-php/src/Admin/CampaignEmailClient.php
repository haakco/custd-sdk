<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\CampaignEmail\CampaignEmailRevision;
use HaakCo\Custd\Admin\CampaignEmail\CampaignRunScheduleRequest;
use HaakCo\Custd\Admin\CampaignEmail\CampaignRunStatus;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomeActivation;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomeDefinition;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomeEnrollment;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomePause;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomeSignup;
use HaakCo\Custd\Admin\CampaignEmail\CampaignWelcomeState;
use HaakCo\Custd\Admin\CampaignEmail\Confirmation;
use HaakCo\Custd\Admin\CampaignEmail\Permission;
use HaakCo\Custd\Admin\CampaignEmail\PublishCampaignEmailRevisionRequest;
use HaakCo\Custd\Admin\CampaignEmail\Recipient;

/**
 * CampaignEmailClient publishes campaign email revisions, schedules and cancels runs, keeps recipient
 * permissions and runs the welcome sequence.
 */
final class CampaignEmailClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Read an exact email campaign artifact revision.
     */
    public function getRevision(string $revision, ?string $companySlug = null): CampaignEmailRevision
    {
        return CampaignEmailRevision::fromPayload($this->http->object('GET', '/api/v1/admin/campaign-email-revisions/' . rawurlencode($revision), ['companySlug' => $companySlug], null));
    }

    /** @param array<string, string> $slots */
    public function previewRevision(string $revision, array $slots, ?string $companySlug = null): CampaignEmailRenderResult
    {
        return CampaignEmailRenderResult::fromPayload((array) $this->http->object('POST', '/api/v1/admin/campaign-email-revisions/' . rawurlencode($revision) . '/preview', ['companySlug' => $companySlug], ['slots' => (object) $slots]));
    }

    /**
     * Publish a trusted-build email campaign artifact.
     */
    public function publishRevision(PublishCampaignEmailRevisionRequest $request, ?string $companySlug = null): CampaignEmailRevision
    {
        return CampaignEmailRevision::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-revisions', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Schedule a pinned campaign run.
     */
    public function scheduleRun(CampaignRunScheduleRequest $request, ?string $companySlug = null): CampaignRunStatus
    {
        return CampaignRunStatus::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-runs', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Inspect campaign run progress.
     */
    public function getRun(string $runId, ?string $companySlug = null): CampaignRunStatus
    {
        return CampaignRunStatus::fromPayload($this->http->object('GET', '/api/v1/admin/campaign-email-runs/' . rawurlencode($runId), ['companySlug' => $companySlug], null));
    }

    /**
     * Cancel pending campaign delivery.
     */
    public function cancelRun(string $runId, ?string $companySlug = null): CampaignRunStatus
    {
        return CampaignRunStatus::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-runs/' . rawurlencode($runId) . '/cancel', ['companySlug' => $companySlug], null));
    }

    /**
     * Check current campaign email permission.
     */
    public function checkPermission(Recipient $request, ?string $companySlug = null): Permission
    {
        return Permission::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-permissions/check', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Record an existing verified campaign opt-in.
     */
    public function confirmPermission(Confirmation $request, ?string $companySlug = null): Permission
    {
        return Permission::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-permissions/confirm', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Withdraw permission to send campaign email.
     */
    public function withdrawPermission(Recipient $request, ?string $companySlug = null): Permission
    {
        return Permission::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-permissions/withdraw', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Configure a pinned welcome funnel.
     */
    public function configureWelcome(CampaignWelcomeDefinition $request, ?string $companySlug = null): CampaignWelcomeState
    {
        return CampaignWelcomeState::fromPayload($this->http->object('PUT', '/api/v1/admin/campaign-email-welcome/definition', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Pause or resume welcome funnel submissions.
     */
    public function pauseWelcome(CampaignWelcomePause $request, ?string $companySlug = null): CampaignWelcomeState
    {
        return CampaignWelcomeState::fromPayload($this->http->object('PUT', '/api/v1/admin/campaign-email-welcome/pause', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Record first-party contact activation and exit the reminder.
     */
    public function recordWelcomeActivation(CampaignWelcomeActivation $request, ?string $companySlug = null): CampaignWelcomeEnrollment
    {
        return CampaignWelcomeEnrollment::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-welcome/activation', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Enter a contact with recorded opt-in evidence.
     */
    public function recordWelcomeSignup(CampaignWelcomeSignup $request, ?string $companySlug = null): CampaignWelcomeEnrollment
    {
        return CampaignWelcomeEnrollment::fromPayload($this->http->object('POST', '/api/v1/admin/campaign-email-welcome/confirmed-signup', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Inspect a contact's welcome enrollment and delivery runs.
     */
    public function getWelcomeEnrollment(string $contactId, ?string $companySlug = null): CampaignWelcomeEnrollment
    {
        return CampaignWelcomeEnrollment::fromPayload($this->http->object('GET', '/api/v1/admin/campaign-email-welcome/contacts/' . rawurlencode($contactId), ['companySlug' => $companySlug], null));
    }
}
