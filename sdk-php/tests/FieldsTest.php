<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Fields;
use PHPUnit\Framework\TestCase;

/** Custd's Go server sends an empty nil slice as null, so a present null list reads as empty. */
final class FieldsTest extends TestCase
{
    public function testPresentNullListIsEmptyAndMissingListFails(): void
    {
        $payload = json_decode('{"items":null,"names":null}', false, 512, JSON_THROW_ON_ERROR);
        self::assertInstanceOf(\stdClass::class, $payload);

        self::assertSame([], Fields::objects($payload, 'items'));
        self::assertSame([], Fields::strings($payload, 'names'));

        $this->expectExceptionMessage('custd: response field missing is required');
        Fields::objects($payload, 'missing');
    }
}
