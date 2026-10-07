<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\AuthProject\ApplicationSessionInventory;
use HaakCo\Custd\Admin\AuthProject\Creation;
use HaakCo\Custd\Admin\AuthProject\CreateRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentCreateRequest;
use HaakCo\Custd\Admin\AuthProject\ListResponse;
use HaakCo\Custd\Admin\AuthProject\MembershipRevocation;
use HaakCo\Custd\Admin\AuthProject\MembershipRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\Admin\AuthProject\SessionRevocation;
use HaakCo\Custd\Admin\AuthProject\SessionRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\SessionsRevokeAllRequest;
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

    /** @var list<string> */
    private const IDENTITY_MODES = [self::IDENTITY_ISOLATED, self::IDENTITY_SHARED];

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
