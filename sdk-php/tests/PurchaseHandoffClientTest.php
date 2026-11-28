<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Storefront\CreatePurchaseHandoffRequest;
use HaakCo\Custd\Storefront\Money;
use PHPUnit\Framework\TestCase;

final class PurchaseHandoffClientTest extends TestCase
{
    public function testSellerCreatesAndReadsHandoffWithExactAmount(): void
    {
        $amount = ['currency' => 'ZAR', 'amountMinor' => '9223372036854775807'];
        $request = ['orderReference' => 'order-12', 'offerUuid' => 'offer-id', 'amount' => $amount];
        $response = $request + [
            'handoffUuid' => 'handoff-id',
            'checkoutPath' => '/store?handoffUuid=handoff-id&storefront=merchant%2Fshop',
            'expiresAt' => '2026-11-29T10:00:00Z',
        ];
        $calls = [];
        $client = new CustdClient('https://api.example.com', 'seller-token', [
            'admin_http_client' => static function (string $method, string $url, ?array $body, string $token) use (&$calls, $response): array {
                $calls[] = [$method, $url, $body, $token];
                $status = $method === 'POST' ? ['settled' => false] : ['settled' => true, 'invoiceUuid' => 'invoice-id'];

                return ['status' => 200, 'body' => json_encode($response + $status, JSON_THROW_ON_ERROR)];
            },
        ]);
        $storefronts = $client->storefronts();
        $created = $storefronts->createPurchaseHandoff('merchant/shop', new CreatePurchaseHandoffRequest(
            'order-12',
            'offer-id',
            new Money('ZAR', '9223372036854775807'),
        ));
        $settled = $storefronts->getPurchaseHandoff('merchant/shop', $created->handoffUuid);

        $path = 'https://api.example.com/api/v1/billing/storefronts/merchant%2Fshop/purchase-handoffs';
        self::assertSame([
            ['POST', $path, $request, 'seller-token'],
            ['GET', $path . '/handoff-id', null, 'seller-token'],
        ], $calls);
        self::assertSame('order-12', $created->orderReference);
        self::assertSame('offer-id', $created->offerUuid);
        self::assertSame($response['checkoutPath'], $created->checkoutPath);
        self::assertSame($response['expiresAt'], $created->expiresAt);
        self::assertSame($amount, $settled->amount->serialise());
        self::assertFalse($created->settled);
        self::assertNull($created->invoiceUuid);
        self::assertTrue($settled->settled);
        self::assertSame('invoice-id', $settled->invoiceUuid);
    }

    public function testMinorAmountRejectsInt64Overflow(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new Money('ZAR', '9223372036854775808');
    }
}
