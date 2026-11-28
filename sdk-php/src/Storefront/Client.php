<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Admin\ApiHttp;

/** Seller operations for an application bound to its storefront. */
final class Client
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Seller app bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    public function createPurchaseHandoff(string $storefront, CreatePurchaseHandoffRequest $request): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('POST', self::handoffPath($storefront), [], $request->serialise()));
    }

    public function getPurchaseHandoff(string $storefront, string $handoffUuid): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('GET', self::handoffPath($storefront) . '/' . rawurlencode($handoffUuid)));
    }

    public function cancelPurchaseHandoff(string $storefront, string $handoffUuid): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('POST', self::handoffPath($storefront) . '/' . rawurlencode($handoffUuid) . '/cancel'));
    }

    private static function handoffPath(string $storefront): string
    {
        return '/api/v1/billing/storefronts/' . rawurlencode($storefront) . '/purchase-handoffs';
    }
}
