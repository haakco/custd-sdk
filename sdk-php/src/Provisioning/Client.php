<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\Fields;

final class Client
{
    private const PREFIX = "/api/v1";

    /**
     * The producer scope template of a site-bound Site Insights credential. Custd creates a Site
     * for the credential, which then manages only that Site's domains through
     * CustdClient::adminSiteDomains(); revoking the producer removes the Site and its domains.
     */
    public const SCOPE_TEMPLATE_SITE_INSIGHTS = 'site-insights';

    /**
     * The same site-bound credential, also able to attest its Site's domains as verified with
     * SiteDomainClient::attest(). Custd mints it only for a broker that itself holds
     * site_domains.attest, which a Custd system administrator grants.
     */
    public const SCOPE_TEMPLATE_SITE_INSIGHTS_ATTESTING = 'site-insights-attesting';

    /**
     * A tenant-wide, read-only credential (site_insights.read) bound to no Site: it reads only the
     * next actions and the portfolio summary of every Site (SiteNextActionClient), as a hub shows them.
     */
    public const SCOPE_TEMPLATE_SITE_INSIGHTS_READ = 'site-insights-read';

    /** Read a tenant’s Site Insights AI settings and usage. */
    public const SCOPE_TEMPLATE_SITE_AI_READ = 'site-ai-read';

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /** Create a child data space. parentCompanySlug names the parent when the broker serves several. */
    public function createDataSpace(DataSpaceCreateRequest $request, ?string $parentCompanySlug = null): DataSpace
    {
        return DataSpace::fromPayload(
            $this->send("POST", self::withQuery("/data-spaces", "parentCompanySlug", $parentCompanySlug), $request->serialise())
        );
    }

    public function listDataSpaces(?string $parentCompanySlug = null): DataSpaceList
    {
        return DataSpaceList::fromPayload(
            $this->send("GET", self::withQuery("/data-spaces", "parentCompanySlug", $parentCompanySlug))
        );
    }

    /** Read the retained storage of the parent tenant and each of its data spaces. */
    public function getDataSpaceUsage(?string $parentCompanySlug = null): DataSpaceUsage
    {
        return DataSpaceUsage::fromPayload(
            $this->send("GET", self::withQuery("/data-spaces/usage", "parentCompanySlug", $parentCompanySlug))
        );
    }

    public function revokeDataSpace(string $slug, ?string $parentCompanySlug = null): void
    {
        $this->sendNoContent("DELETE", self::withQuery(self::dataSpace($slug), "parentCompanySlug", $parentCompanySlug));
    }

    /** Hold a producer slug in a data space until it is claimed, released or expires. */
    public function reserveProducer(string $dataSpaceSlug, ProducerReservationRequest $request, ?string $parentCompanySlug = null): ProducerReservation
    {
        return ProducerReservation::fromPayload(
            $this->send("POST", self::withQuery(self::reservations($dataSpaceSlug), "parentCompanySlug", $parentCompanySlug), $request->serialise())
        );
    }

    public function listProducerReservations(string $dataSpaceSlug, ?string $parentCompanySlug = null): ProducerReservationList
    {
        return ProducerReservationList::fromPayload(
            $this->send("GET", self::withQuery(self::reservations($dataSpaceSlug), "parentCompanySlug", $parentCompanySlug))
        );
    }

    /** Bind a reserved producer slug to the client that now owns it. */
    public function claimProducerReservation(
        string $dataSpaceSlug,
        string $producerSlug,
        ProducerReservationClaimRequest $request,
        ?string $parentCompanySlug = null,
    ): ProducerReservation {
        return ProducerReservation::fromPayload($this->send(
            "POST",
            self::withQuery(self::reservations($dataSpaceSlug) . "/" . rawurlencode($producerSlug) . "/claim", "parentCompanySlug", $parentCompanySlug),
            $request->serialise()
        ));
    }

    public function releaseProducerReservation(string $dataSpaceSlug, string $producerSlug, ?string $parentCompanySlug = null): void
    {
        $this->sendNoContent(
            "DELETE",
            self::withQuery(self::reservations($dataSpaceSlug) . "/" . rawurlencode($producerSlug), "parentCompanySlug", $parentCompanySlug)
        );
    }

    /** Mint a producer credential. Its secret is in the answer only, once. */
    public function provisionProducer(ProvisionProducerRequest $request): ProvisionedProducer
    {
        return ProvisionedProducer::fromPayload($this->send("POST", "/producer-provisioning", $request->serialise()));
    }

    public function listProducers(?string $companySlug = null): ProducerList
    {
        return ProducerList::fromPayload(
            $this->send("GET", self::withQuery("/producer-provisioning", "companySlug", $companySlug))
        );
    }

    public function getProducer(string $clientId): Producer
    {
        return Producer::fromPayload($this->send("GET", self::producer($clientId)));
    }

    public function rotateProducerSecret(string $clientId): ProducerSecretRotation
    {
        return ProducerSecretRotation::fromPayload($this->send("POST", self::producer($clientId) . "/rotate-secret"));
    }

    /**
     * Sets the environment recorded for this producer. It is the authenticated
     * default for events that do not declare their own, not a per-environment
     * credential: one producer is expected to carry every environment.
     */
    public function updateProducerEnvironment(string $clientId, ProducerEnvironmentUpdateRequest $request): Producer
    {
        return Producer::fromPayload(
            $this->send("PATCH", self::producer($clientId) . "/environment", $request->serialise())
        );
    }

    public function revokeProducer(string $clientId): void
    {
        $this->sendNoContent("DELETE", self::producer($clientId));
    }

    private static function dataSpace(string $slug): string
    {
        return "/data-spaces/" . rawurlencode($slug);
    }

    private static function reservations(string $dataSpaceSlug): string
    {
        return self::dataSpace($dataSpaceSlug) . "/producer-reservations";
    }

    private static function producer(string $clientId): string
    {
        return "/producer-provisioning/" . rawurlencode($clientId);
    }

    private static function withQuery(string $path, string $name, ?string $value): string
    {
        return $value === null || $value === "" ? $path : $path . "?" . http_build_query([$name => $value]);
    }

    /** @param array<string, mixed>|null $body */
    private function send(string $method, string $path, ?array $body = null): \stdClass
    {
        return Fields::jsonObject(
            Http::requestStructured($this->baseUrl, $this->token, $this->transport, $method, $path, $body, self::PREFIX),
            "provisioning response"
        );
    }

    private function sendNoContent(string $method, string $path): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, null, self::PREFIX);
    }
}
