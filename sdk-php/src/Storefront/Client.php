<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Admin\ApiHttp;

/** Buyer and seller operations on a credential-scoped storefront. */
final class Client
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Storefront bearer token, or a provider run per request. */
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

    public function listOffers(string $storefront): Catalogue
    {
        return Catalogue::fromPayload($this->http->object('GET', self::path($storefront, 'offers')));
    }

    public function publishOffer(string $storefront, PublishOffer $request): Offer
    {
        return Offer::fromPayload($this->http->object('POST', self::path($storefront, 'offers'), [], $request->serialise()));
    }

    public function createCart(string $storefront): Cart
    {
        return Cart::fromPayload($this->http->object('POST', self::path($storefront, 'carts')));
    }

    public function getCart(string $storefront, string $cartUuid): Cart
    {
        return Cart::fromPayload($this->http->object('GET', self::path($storefront, 'carts', $cartUuid)));
    }

    public function updateLine(string $storefront, string $cartUuid, string $offerUuid, LineQuantity $request): Cart
    {
        $path = self::path($storefront, 'carts', $cartUuid, 'lines', $offerUuid);

        return Cart::fromPayload($this->http->object('PUT', $path, [], $request->serialise()));
    }

    public function createQuote(string $storefront, string $cartUuid): Quote
    {
        return Quote::fromPayload($this->http->object('POST', self::path($storefront, 'carts', $cartUuid, 'quotes')));
    }

    public function getQuote(string $storefront, string $quoteUuid): Quote
    {
        return Quote::fromPayload($this->http->object('GET', self::path($storefront, 'quotes', $quoteUuid)));
    }

    public function checkout(string $storefront, string $quoteUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('POST', self::path($storefront, 'quotes', $quoteUuid, 'checkout')));
    }

    public function getPurchase(string $storefront, string $invoiceUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('GET', self::path($storefront, 'purchases', $invoiceUuid)));
    }

    public function startPayment(string $storefront, string $invoiceUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('POST', self::path($storefront, 'purchases', $invoiceUuid, 'payment')));
    }

    public function issueCreditNote(string $storefront, string $invoiceUuid, AdjustmentRequest $request): CreditNote
    {
        $path = self::path($storefront, 'invoices', $invoiceUuid, 'credit-note');

        return CreditNote::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    private static function path(string ...$segments): string
    {
        foreach ($segments as $segment) {
            if (in_array($segment, ['', '.', '..'], true) || str_contains($segment, '/') || str_contains($segment, '\\')) {
                throw new \InvalidArgumentException('Invalid storefront path segment');
            }
        }

        return '/api/v1/storefronts/' . implode('/', array_map(rawurlencode(...), $segments));
    }

    private static function handoffPath(string $storefront): string
    {
        return '/api/v1/billing/storefronts/' . rawurlencode($storefront) . '/purchase-handoffs';
    }
}
