<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Admin\Http;

final class Client
{
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

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * @param array<string, mixed> $dataSpace
     * @return array<string, mixed>
     */
    public function createDataSpace(array $dataSpace): array
    {
        return $this->request("POST", "/data-spaces", $dataSpace) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function listDataSpaces(): array
    {
        return $this->request("GET", "/data-spaces") ?? ["dataSpaces" => []];
    }

    public function revokeDataSpace(string $slug): void
    {
        $this->request("DELETE", "/data-spaces/" . rawurlencode($slug));
    }

    /**
     * @param array<string, mixed> $producer
     * @return array<string, mixed>
     */
    public function provisionProducer(array $producer): array
    {
        return $this->request("POST", "/producer-provisioning", $producer) ?? [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listProducers(?string $companySlug = null): array
    {
        $path = "/producer-provisioning";
        if ($companySlug !== null && $companySlug !== "") {
            $path .= "?companySlug=" . rawurlencode($companySlug);
        }
        $response = $this->request("GET", $path) ?? [];
        return $response["producers"] ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function rotateProducerSecret(string $clientId): array
    {
        return $this->request(
            "POST",
            "/producer-provisioning/" . rawurlencode($clientId) . "/rotate-secret"
        ) ?? [];
    }

    /**
     * Sets the environment recorded for this producer. It is the authenticated
     * default for events that do not declare their own, not a per-environment
     * credential: one producer is expected to carry every environment.
     *
     * @return array<string, mixed>
     */
    public function updateProducerEnvironment(string $clientId, string $environment): array
    {
        return $this->request(
            "PATCH",
            "/producer-provisioning/" . rawurlencode($clientId) . "/environment",
            ["environment" => $environment]
        ) ?? [];
    }

    public function revokeProducer(string $clientId): void
    {
        $this->request("DELETE", "/producer-provisioning/" . rawurlencode($clientId));
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|array<int, array<string, mixed>>|null
     */
    private function request(string $method, string $path, ?array $body = null): ?array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, $body, "/api/v1");
    }
}
