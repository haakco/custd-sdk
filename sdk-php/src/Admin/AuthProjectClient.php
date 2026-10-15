<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\AuthProject\ApplicationMembershipContext;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalErasure;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalErasureRequest;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalExport;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalProfile;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalSuspension;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalTarget;
use HaakCo\Custd\Admin\AuthProject\ApplicationSessionInventory;
use HaakCo\Custd\Admin\AuthProject\Capability;
use HaakCo\Custd\Admin\AuthProject\ClientSyncReport;
use HaakCo\Custd\Admin\AuthProject\ClientSyncRequest;
use HaakCo\Custd\Admin\AuthProject\Creation;
use HaakCo\Custd\Admin\AuthProject\CreateRequest;
use HaakCo\Custd\Admin\AuthProject\DesiredStateRequest;
use HaakCo\Custd\Admin\AuthProject\DirectoryRequest;
use HaakCo\Custd\Admin\AuthProject\DirectoryStatus;
use HaakCo\Custd\Admin\AuthProject\EnvironmentCreateRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentDeletion;
use HaakCo\Custd\Admin\AuthProject\EnvironmentDeletionRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOffboarding;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOffboardRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOrganisationList;
use HaakCo\Custd\Admin\AuthProject\Invitation;
use HaakCo\Custd\Admin\AuthProject\InvitationIssueRequest;
use HaakCo\Custd\Admin\AuthProject\InvitationIssued;
use HaakCo\Custd\Admin\AuthProject\InvitationListResponse;
use HaakCo\Custd\Admin\AuthProject\InvitationRedeliveryRequest;
use HaakCo\Custd\Admin\AuthProject\InvitationRevocationRequest;
use HaakCo\Custd\Admin\AuthProject\ListResponse;
use HaakCo\Custd\Admin\AuthProject\MembershipRevocation;
use HaakCo\Custd\Admin\AuthProject\MembershipRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\Operation;
use HaakCo\Custd\Admin\AuthProject\Preview;
use HaakCo\Custd\Admin\AuthProject\ProfileValuesRequest;
use HaakCo\Custd\Admin\AuthProject\ProjectDeletion;
use HaakCo\Custd\Admin\AuthProject\ProjectDeletionRequest;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionException;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionReceipt;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionRequest;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionStep;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\Admin\AuthProject\SessionRevocation;
use HaakCo\Custd\Admin\AuthProject\SessionRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\SessionsRevokeAllRequest;
use HaakCo\Custd\Admin\AuthProject\Status;
use HaakCo\Custd\Admin\AuthProject\Summary;

/**
 * AuthProjectClient manages Custd projects, their environments, and the
 * application principals a directory holds inside an environment through
 * /api/v1/admin/auth-projects.
 *
 * Every call is a control-plane call that a machine credential may make only
 * when it names the platform user it acts for. Pass `owningUserUuid` in
 * {@see RequestOptions} and it is sent as X-Custd-Owning-User-UUID; Custd
 * validates the named user as a live member of the machine caller's own
 * company. A human administrator's own token subject is the actor and leaves
 * the option unset.
 */
final class AuthProjectClient
{
    public const IDENTITY_ISOLATED = "isolated";

    public const IDENTITY_SHARED = "shared";

    public const DIRECTORY_ENABLE = "enable";

    public const DIRECTORY_PAUSE = "pause";

    public const DIRECTORY_RESUME = "resume";

    public const DIRECTORY_RELEASE = "release";

    /** @var list<string> */
    private const IDENTITY_MODES = [self::IDENTITY_ISOLATED, self::IDENTITY_SHARED];

    /** @var list<string> */
    private const DIRECTORY_ACTIONS = [
        self::DIRECTORY_ENABLE,
        self::DIRECTORY_PAUSE,
        self::DIRECTORY_RESUME,
        self::DIRECTORY_RELEASE,
    ];

    /**
     * Each mutating realm step derives a key by appending one of these suffixes
     * to the caller's base key. The service bounds an Idempotency-Key at 8 to
     * 128 characters, so the base is bounded to leave room for the longest
     * suffix and every derived key stays legal.
     */
    private const REALM_APPLY_SUFFIX = ":apply";

    private const REALM_DIRECTORY_SUFFIX = ":directory-enable";

    private const REALM_RECONCILE_SUFFIX = ":client-reconcile";

    /** Also the longest per-step suffix, so it bounds the base key length. */
    private const REALM_LONGEST_STEP_SUFFIX = ":directory-enable";

    private const REALM_MIN_BASE_KEY_LENGTH = 8;

    private const REALM_MAX_KEY_LENGTH = 128;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /** assertIdentityMode rejects an identity mode the service does not define. */
    public static function assertIdentityMode(string $identityMode): void
    {
        if (!in_array($identityMode, self::IDENTITY_MODES, true)) {
            throw new \InvalidArgumentException("custd: auth-project identityMode must be isolated or shared");
        }
    }

    /** assertDirectoryAction rejects a directory action the service does not define. */
    public static function assertDirectoryAction(string $action): void
    {
        if (!in_array($action, self::DIRECTORY_ACTIONS, true)) {
            throw new \InvalidArgumentException(
                "custd: auth-project directory action must be enable, pause, resume or release"
            );
        }
    }

    /**
     * List up to 100 environments the named owning user owns or operates. Pass
     * the previous page's `nextAfter` as `$after` for the next page.
     */
    public function listProjects(?string $after = null, ?RequestOptions $options = null): ListResponse
    {
        $cursor = $after === null ? "" : trim($after);
        $path = "/auth-projects" . ($cursor === "" ? "" : "?after=" . rawurlencode($cursor));

        return ListResponse::fromPayload($this->call("GET", $path, null, $options));
    }

    /**
     * Create the named owning user's project ownership, identity pool and first
     * paused environment atomically.
     */
    public function createProject(CreateRequest $body, ?RequestOptions $options = null): Creation
    {
        self::requireIdempotencyKey($options);

        return Creation::fromPayload($this->call("POST", "/auth-projects", $body->toPayload(), $options));
    }

    /** Add a further environment to an existing project. The new environment starts paused. */
    public function createEnvironment(
        string $projectId,
        EnvironmentCreateRequest $body,
        ?RequestOptions $options = null,
    ): Summary {
        $path = "/auth-projects/" . self::segment($projectId) . "/environments";

        return Summary::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Read all public identities with their own completeness, never credential material. */
    public function exportPrincipal(ApplicationPrincipalTarget $target, ?RequestOptions $options = null): ApplicationPrincipalExport
    {
        $path = self::principalTargetPath($target).'/export';

        return ApplicationPrincipalExport::fromPayload($this->call('GET', $path, null, $options));
    }

    /** Withdraw authority before Custd revokes all principal-owned provider sessions. */
    public function suspendPrincipal(ApplicationPrincipalTarget $target, ?RequestOptions $options = null): ApplicationPrincipalSuspension
    {
        self::requireIdempotencyKey($options);
        $path = self::principalTargetPath($target).'/suspend';

        return ApplicationPrincipalSuspension::fromPayload($this->call('POST', $path, null, $options));
    }

    /** Restore authority without changing enrolled factors; pending withdrawals are refused. */
    public function restorePrincipal(ApplicationPrincipalTarget $target, ?RequestOptions $options = null): ApplicationPrincipalSuspension
    {
        self::requireIdempotencyKey($options);
        $path = self::principalTargetPath($target).'/restore';

        return ApplicationPrincipalSuspension::fromPayload($this->call('POST', $path, null, $options));
    }

    /** Explicitly confirm Custd's durable erasure of the complete principal mapping set. */
    public function erasePrincipal(
        ApplicationPrincipalTarget $target,
        ApplicationPrincipalErasureRequest $body,
        ?RequestOptions $options = null,
    ): ApplicationPrincipalErasure {
        self::requireIdempotencyKey($options);
        $path = self::principalTargetPath($target).'/erase';

        return ApplicationPrincipalErasure::fromPayload($this->call('POST', $path, $body->toPayload(), $options));
    }

    private static function principalTargetPath(ApplicationPrincipalTarget $target): string
    {
        return self::principalPath($target->projectId, $target->environmentId, $target->directoryId, $target->providerSubject);
    }

    /** Report the sessions the directory currently holds for one application principal. */
    public function listPrincipalSessions(
        string $projectId,
        string $environmentId,
        string $directoryId,
        string $providerSubject,
        ?RequestOptions $options = null,
    ): ApplicationSessionInventory {
        $path = self::principalPath($projectId, $environmentId, $directoryId, $providerSubject) . "/sessions";

        return ApplicationSessionInventory::fromPayload($this->call("GET", $path, null, $options));
    }

    /** End exactly one of a principal's sessions, leaving its other sessions untouched. */
    public function revokePrincipalSession(
        string $projectId,
        string $environmentId,
        string $directoryId,
        string $providerSubject,
        SessionRevokeRequest $body,
        ?RequestOptions $options = null,
    ): SessionRevocation {
        self::requireIdempotencyKey($options);
        $path = self::principalPath($projectId, $environmentId, $directoryId, $providerSubject) . "/sessions/revoke";

        return SessionRevocation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** End every session the directory holds for one application principal. */
    public function revokePrincipalSessions(
        string $projectId,
        string $environmentId,
        string $directoryId,
        string $providerSubject,
        SessionsRevokeAllRequest $body,
        ?RequestOptions $options = null,
    ): SessionRevocation {
        self::requireIdempotencyKey($options);
        $path = self::principalPath($projectId, $environmentId, $directoryId, $providerSubject) . "/sessions/revoke-all";

        return SessionRevocation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** End one application identity's membership of one organisation. */
    public function revokePrincipalMembership(
        string $projectId,
        string $environmentId,
        string $directoryId,
        string $providerSubject,
        MembershipRevokeRequest $body,
        ?RequestOptions $options = null,
    ): MembershipRevocation {
        $path = self::principalPath($projectId, $environmentId, $directoryId, $providerSubject) . "/memberships/revoke";

        return MembershipRevocation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /**
     * Write the environment's desired state and return the operation receipt.
     *
     * Custd makes it retry-safe per Idempotency-Key, so the key is required. The
     * audience binding the consumer's edge admits against is written here and
     * read back through {@see getEnvironmentStatus}.
     */
    public function applyEnvironmentDesiredState(
        string $projectId,
        string $environmentId,
        DesiredStateRequest $body,
        ?RequestOptions $options = null,
    ): Operation {
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/apply";

        return Operation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Report the field-level changes an apply would make. A preview writes nothing. */
    public function previewEnvironmentDesiredState(
        string $projectId,
        string $environmentId,
        DesiredStateRequest $body,
        ?RequestOptions $options = null,
    ): Preview {
        $path = self::environmentPath($projectId, $environmentId) . "/preview";

        return Preview::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /**
     * Read the environment's configured state and applied revision.
     *
     * `status->desired->audiences` carries the applied audience binding and
     * `status->environmentId` the environment binding, so a caller reads the
     * mapping back here after an apply.
     */
    public function getEnvironmentStatus(
        string $projectId,
        string $environmentId,
        ?RequestOptions $options = null,
    ): Status {
        $path = self::environmentPath($projectId, $environmentId) . "/status";

        return Status::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Read the environment's supported auth configuration. */
    public function getEnvironmentCapability(
        string $projectId,
        string $environmentId,
        ?RequestOptions $options = null,
    ): Capability {
        $path = self::environmentPath($projectId, $environmentId) . "/capability";

        return Capability::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Report every directory in the environment and whether it is fully stored. */
    public function listDirectories(
        string $projectId,
        string $environmentId,
        ?RequestOptions $options = null,
    ): DirectoryStatus {
        $path = self::environmentPath($projectId, $environmentId) . "/directories";

        return DirectoryStatus::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Enable, pause, resume or release one directory credential store. */
    public function actOnDirectory(
        string $projectId,
        string $environmentId,
        string $action,
        DirectoryRequest $body,
        ?RequestOptions $options = null,
    ): Operation {
        self::assertDirectoryAction($action);
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/directories/" . self::segment($action);

        return Operation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Report the organisations one environment's directory holds. */
    public function listEnvironmentOrganisations(
        string $projectId,
        string $environmentId,
        ?RequestOptions $options = null,
    ): EnvironmentOrganisationList {
        $path = self::environmentPath($projectId, $environmentId) . "/organisations";

        return EnvironmentOrganisationList::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Register the environment's application clients with the provider. */
    public function reconcileEnvironmentClients(
        string $projectId,
        string $environmentId,
        ClientSyncRequest $body,
        ?RequestOptions $options = null,
    ): ClientSyncReport {
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/clients/reconcile";

        return ClientSyncReport::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Report the environment's invitations, newest first. */
    public function listInvitations(
        string $projectId,
        string $environmentId,
        ?RequestOptions $options = null,
    ): InvitationListResponse {
        $path = self::environmentPath($projectId, $environmentId) . "/invitations";

        return InvitationListResponse::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Invite one address into a directory and return the one-time link. */
    public function issueInvitation(
        string $projectId,
        string $environmentId,
        InvitationIssueRequest $body,
        ?RequestOptions $options = null,
    ): InvitationIssued {
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/invitations";

        return InvitationIssued::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Withdraw a live invitation before it is used. */
    public function revokeInvitation(
        string $projectId,
        string $environmentId,
        InvitationRevocationRequest $body,
        ?RequestOptions $options = null,
    ): Invitation {
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/invitations/revoke";

        return Invitation::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Replace one live invitation's link and return the fresh one-time link. */
    public function redeliverInvitation(
        string $projectId,
        string $environmentId,
        InvitationRedeliveryRequest $body,
        ?RequestOptions $options = null,
    ): InvitationIssued {
        self::requireIdempotencyKey($options);
        $path = self::environmentPath($projectId, $environmentId) . "/invitations/redeliver";

        return InvitationIssued::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Read one application principal's profile, restricted to policy-visible fields. */
    public function getPrincipalProfile(ApplicationPrincipalTarget $target, ?RequestOptions $options = null): ApplicationPrincipalProfile
    {
        $path = self::principalTargetPath($target) . "/profile";

        return ApplicationPrincipalProfile::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Set one application principal's profile values as an upsert. */
    public function setPrincipalProfile(
        ApplicationPrincipalTarget $target,
        ProfileValuesRequest $body,
        ?RequestOptions $options = null,
    ): ApplicationPrincipalProfile {
        self::requireIdempotencyKey($options);
        $path = self::principalTargetPath($target) . "/profile";

        return ApplicationPrincipalProfile::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** List the organisations one application principal may act for. */
    public function listPrincipalMemberships(
        ApplicationPrincipalTarget $target,
        ?RequestOptions $options = null,
    ): ApplicationMembershipContext {
        $path = self::principalTargetPath($target) . "/memberships";

        return ApplicationMembershipContext::fromPayload($this->call("GET", $path, null, $options));
    }

    /** Delete a project and everything scoped to it; `confirmSlug` names the stored slug. */
    public function deleteProject(
        string $projectId,
        ProjectDeletionRequest $body,
        ?RequestOptions $options = null,
    ): ProjectDeletion {
        $path = "/auth-projects/" . self::segment($projectId) . "/delete";

        return ProjectDeletion::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /** Delete one environment without touching its siblings; `confirmSlug` names the stored slug. */
    public function deleteEnvironment(
        string $projectId,
        string $environmentId,
        EnvironmentDeletionRequest $body,
        ?RequestOptions $options = null,
    ): EnvironmentDeletion {
        $path = self::environmentPath($projectId, $environmentId) . "/delete";

        return EnvironmentDeletion::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /**
     * Withdraw one environment's authority and pause login while retaining the
     * environment, its pools, its credential-store reservations and its identity
     * mappings; its owned provider clients are reconciled away. It is the safe step
     * for an environment whose directory still holds a credential store, which a
     * physical delete refuses. `confirmSlug` names the stored environment slug.
     *
     * The route has no Idempotency-Key: the withdrawal is an addressed marker and a
     * retry resumes the provider stage rather than duplicating it.
     */
    public function offboardEnvironment(
        string $projectId,
        string $environmentId,
        EnvironmentOffboardRequest $body,
        ?RequestOptions $options = null,
    ): EnvironmentOffboarding {
        $path = self::environmentPath($projectId, $environmentId) . "/offboard";

        return EnvironmentOffboarding::fromPayload($this->call("POST", $path, $body->toPayload(), $options));
    }

    /**
     * Set one environment's identity realm up through the public control plane in
     * the order the service requires, so a consumer does not have to sequence
     * separate calls itself.
     *
     * The order matters because each write advances the environment's authority
     * revision: it applies the desired state (which also reconciles the clients it
     * implies), enables the addressed directory credential store at the revision
     * the apply produced, reconciles the clients again at the revision the
     * directory enable produced, and reads status back. The directory revision is
     * derived from the apply rather than taken from the caller, because the
     * service compares a directory action's expected revision against the
     * environment's current revision, which the apply just advanced.
     *
     * Each mutating step derives a stable key from the base `idempotencyKey` in
     * options, so retrying the whole call with the same base key resumes rather
     * than duplicating: a step that already succeeded answers from its recorded
     * operation. The base must be 8 to 111 characters, so every derived key stays
     * within the service's 8 to 128 bound.
     *
     * On a refused step, or a status read that does not report the realm
     * reconciled, it throws {@see RealmProvisionException} carrying `failedStep`
     * and the receipt of every step that completed.
     */
    public function provisionRealm(
        string $projectId,
        string $environmentId,
        RealmProvisionRequest $request,
        ?RequestOptions $options = null,
    ): RealmProvisionReceipt {
        $base = self::realmBaseKey($options);
        $owner = self::owningUserUuid($options);
        $receipt = new RealmProvisionReceipt($projectId, $environmentId);

        try {
            $apply = $this->applyEnvironmentDesiredState(
                $projectId,
                $environmentId,
                $request->desiredStateRequest,
                new RequestOptions($owner, $base . self::REALM_APPLY_SUFFIX),
            );
        } catch (\Throwable $error) {
            throw new RealmProvisionException(RealmProvisionStep::Apply, $receipt, $error);
        }
        $receipt = new RealmProvisionReceipt($projectId, $environmentId, apply: $apply);

        // The enable names the revision the apply committed: the service compares the
        // expected revision against the environment's current revision, which the apply
        // just advanced, so the caller's read must not be reused here.
        try {
            $directory = $this->actOnDirectory(
                $projectId,
                $environmentId,
                self::DIRECTORY_ENABLE,
                new DirectoryRequest($request->directoryPoolId, $apply->revision),
                new RequestOptions($owner, $base . self::REALM_DIRECTORY_SUFFIX),
            );
        } catch (\Throwable $error) {
            throw new RealmProvisionException(RealmProvisionStep::DirectoryEnable, $receipt, $error);
        }
        $receipt = new RealmProvisionReceipt(
            $projectId,
            $environmentId,
            apply: $apply,
            directory: $directory,
        );

        // Enabling advanced the revision again, so the observation the apply recorded is
        // behind the environment; reconcile at the directory's revision to record the
        // provider state that describes the configuration as it is now.
        try {
            $reconcile = $this->reconcileEnvironmentClients(
                $projectId,
                $environmentId,
                new ClientSyncRequest($directory->revision),
                new RequestOptions($owner, $base . self::REALM_RECONCILE_SUFFIX),
            );
        } catch (\Throwable $error) {
            throw new RealmProvisionException(RealmProvisionStep::ClientReconcile, $receipt, $error);
        }
        $receipt = new RealmProvisionReceipt(
            $projectId,
            $environmentId,
            apply: $apply,
            directory: $directory,
            reconcile: $reconcile,
        );

        try {
            // Status is a read, so it does not carry the workflow's write key.
            $status = $this->getEnvironmentStatus($projectId, $environmentId, new RequestOptions($owner));
        } catch (\Throwable $error) {
            throw new RealmProvisionException(RealmProvisionStep::Status, $receipt, $error);
        }
        $receipt = new RealmProvisionReceipt(
            $projectId,
            $environmentId,
            apply: $apply,
            directory: $directory,
            reconcile: $reconcile,
            status: $status,
            failedStep: $status->reconciled ? null : RealmProvisionStep::Status,
        );
        if (!$status->reconciled) {
            throw new RealmProvisionException(
                RealmProvisionStep::Status,
                $receipt,
                new \RuntimeException("custd: auth-project realm did not converge: {$status->reconcileNote}"),
            );
        }

        return $receipt;
    }

    /**
     * environmentPath addresses one environment under one project. Every segment
     * is escaped so a caller-supplied identifier cannot reshape the path.
     */
    private static function environmentPath(string $projectId, string $environmentId): string
    {
        return "/auth-projects/" . self::segment($projectId) . "/environments/" . self::segment($environmentId);
    }

    /**
     * call issues one project-auth request, sending the owning-user and
     * Idempotency-Key headers the options name.
     *
     * @param array<string, mixed>|null $body
     */
    private function call(string $method, string $path, ?array $body, ?RequestOptions $options): mixed
    {
        return Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            $path,
            $body,
            "/api/v1/admin",
            self::idempotencyKey($options),
            self::owningUserUuid($options),
        );
    }

    /**
     * principalPath addresses one application principal inside one directory.
     * Every segment is escaped so a caller-supplied identifier cannot reshape
     * the path.
     */
    private static function principalPath(
        string $projectId,
        string $environmentId,
        string $directoryId,
        string $providerSubject,
    ): string {
        return "/auth-projects/" . self::segment($projectId)
            . "/environments/" . self::segment($environmentId)
            . "/directories/" . self::segment($directoryId)
            . "/principals/" . self::segment($providerSubject);
    }

    private static function segment(string $value): string
    {
        return rawurlencode($value);
    }

    /** requireIdempotencyKey rejects an empty key on the routes Custd makes retry-safe. */
    private static function requireIdempotencyKey(?RequestOptions $options): void
    {
        $key = $options?->idempotencyKey;
        if ($key === null || trim($key) === "") {
            throw new \InvalidArgumentException("custd: auth-project idempotency key is required");
        }
    }

    /**
     * realmBaseKey validates the realm workflow's base key before any request is
     * sent, so a caller gets one clear error instead of a service rejection on a
     * derived key whose suffix pushed it past the bound.
     */
    private static function realmBaseKey(?RequestOptions $options): string
    {
        $base = self::idempotencyKey($options);
        if ($base === null) {
            throw new \InvalidArgumentException(
                "custd: auth-project realm provision requires a base idempotency key"
            );
        }
        if (strlen($base) < self::REALM_MIN_BASE_KEY_LENGTH) {
            throw new \InvalidArgumentException(sprintf(
                "custd: auth-project realm base idempotency key must be at least %d characters",
                self::REALM_MIN_BASE_KEY_LENGTH,
            ));
        }
        $maxBase = self::REALM_MAX_KEY_LENGTH - strlen(self::REALM_LONGEST_STEP_SUFFIX);
        if (strlen($base) > $maxBase) {
            throw new \InvalidArgumentException(sprintf(
                "custd: auth-project realm base idempotency key must be at most %d characters so every per-step key stays within %d",
                $maxBase,
                self::REALM_MAX_KEY_LENGTH,
            ));
        }

        return $base;
    }

    private static function idempotencyKey(?RequestOptions $options): ?string
    {
        $key = $options?->idempotencyKey;

        return $key === null || trim($key) === "" ? null : trim($key);
    }

    private static function owningUserUuid(?RequestOptions $options): ?string
    {
        $owner = $options?->owningUserUuid;

        return $owner === null || trim($owner) === "" ? null : trim($owner);
    }
}
