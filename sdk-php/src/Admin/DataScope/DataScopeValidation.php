<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * DataScopeValidation holds the shape rules the data-scope management DTOs
 * share: the immutable external code, the mutable display name, and the
 * canonical UUID identity. The checks are shape-only; the server remains the
 * authority on which principals exist and what they may hold.
 */
final class DataScopeValidation
{
    /** The shape of an immutable external scope or resource code. */
    public const CODE_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9._:-]*$/';

    /** A canonical RFC 4122 UUID, the external identity configuration uses. */
    public const UUID_PATTERN = '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

    /** The closed lifecycle states of a scope or resource. */
    public const STATUSES = ['active', 'disabled'];

    public static function assertCode(string $value, string $label): void
    {
        if (!self::isValidCode($value)) {
            throw new \InvalidArgumentException(
                "custd: {$label} code must be 1-128 characters matching " . self::CODE_PATTERN
            );
        }
    }

    /** Whether value is a well-formed immutable external scope or resource code. */
    public static function isValidCode(string $value): bool
    {
        return strlen($value) >= 1 && strlen($value) <= 128 && preg_match(self::CODE_PATTERN, $value) === 1;
    }

    public static function assertName(string $value, string $label): void
    {
        $trimmed = trim($value);
        if ($trimmed === '' || strlen($trimmed) > 100) {
            throw new \InvalidArgumentException("custd: {$label} name must be 1-100 characters");
        }
    }

    public static function assertStatus(string $status, string $label): void
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new \InvalidArgumentException(
                "custd: {$label} status must be one of " . implode(', ', self::STATUSES)
            );
        }
    }

    public static function isUuid(string $value): bool
    {
        return preg_match(self::UUID_PATTERN, $value) === 1;
    }
}
