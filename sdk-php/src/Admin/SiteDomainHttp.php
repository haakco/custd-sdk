<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Fields;

/**
 * SiteDomainHttp sends the Site Insights requests of SiteDomainClient and the focused clients it
 * hands out, so they share one path, query and company-slug encoding.
 *
 * @internal
 */
final class SiteDomainHttp
{
    public const PREFIX = '/api/v1';
    public const COLLECTION = '/site-domains';

    /** @var callable|null */
    private $transport;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        ?callable $transport = null
    ) {
        $this->token = $token;
        $this->transport = $transport;
    }

    /** The path of one domain, with its UUID escaped. */
    public static function item(string $domainUuid): string
    {
        return self::COLLECTION . '/' . rawurlencode($domainUuid);
    }

    /**
     * siteQuery names the Site; a site-bound credential leaves it null and gets its own Site.
     *
     * @return array<string, string>
     */
    public static function siteQuery(?string $siteUuid): array
    {
        return $siteUuid === null || $siteUuid === '' ? [] : ['siteUuid' => $siteUuid];
    }

    /**
     * query drops unset parameters and keeps the order given.
     *
     * @param array<string, string|int|null> $parameters
     * @return array<string, string>
     */
    public static function query(array $parameters): array
    {
        $query = [];
        foreach ($parameters as $name => $value) {
            if ($value !== null && $value !== '') {
                $query[$name] = (string) $value;
            }
        }

        return $query;
    }

    /**
     * Send a request whose response is a JSON object.
     *
     * @param array<string, string> $query
     * @param array<string, mixed>|null $body
     */
    public function send(string $method, string $path, array $query, ?string $companySlug, ?array $body = null): \stdClass
    {
        return Fields::jsonObject(
            Http::requestStructured(
                $this->baseUrl,
                $this->token,
                $this->transport,
                $method,
                self::withQuery($path, $query, $companySlug),
                $body,
                self::PREFIX
            ),
            'site domain response'
        );
    }

    /**
     * Send a request the route answers with 204 No Content.
     *
     * @param array<string, string> $query
     */
    public function sendNoContent(string $method, string $path, array $query, ?string $companySlug): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            self::withQuery($path, $query, $companySlug),
            null,
            self::PREFIX
        );
    }

    /** @param array<string, string> $query */
    private static function withQuery(string $path, array $query, ?string $companySlug): string
    {
        if ($companySlug !== null && $companySlug !== '') {
            $query['companySlug'] = $companySlug;
        }

        return $query === [] ? $path : $path . '?' . http_build_query($query);
    }
}
