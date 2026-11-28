<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Storefront\Client;
use PHPUnit\Framework\TestCase;

final class StorefrontClientTest extends TestCase
{
    public function testBillingPurchaseKeepsExactMinorUnits(): void
    {
        $body = file_get_contents(dirname(__DIR__, 2) . '/contract-fixtures/storefront-purchase.json');
        self::assertNotFalse($body);
        $client = new Client('http://localhost:8080', 'buyer', static fn (): array => ['status' => 200, 'body' => $body]);
        $purchase = $client->getPurchase('shop', 'invoice-1');

        self::assertSame('9007199254740993', $purchase->totals->grossTotal->amountMinor);
        self::assertSame('pending', $purchase->paymentStatus);
    }
}
