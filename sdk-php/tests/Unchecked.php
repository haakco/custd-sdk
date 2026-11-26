<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

/**
 * Unchecked hands a value to the SDK the way an untyped caller does, so a test can reach the runtime refusal of
 * a value outside a closed set.
 */
final class Unchecked
{
    public static function string(string $value): string
    {
        return $value;
    }
}
