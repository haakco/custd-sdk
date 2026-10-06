<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * Fields decodes the typed scalar fields of a JSON response object.
 *
 * Boundary DTOs decode their named fields through this helper so a missing or
 * mistyped field fails at the boundary instead of becoming an empty string or a
 * zero deeper in. A row the server explicitly documents as an open column bag
 * stays an array; every named field is typed by its DTO.
 */
final class Fields
{
    /** @param array<string, mixed> $payload */
    public static function string(array $payload, string $key): string
    {
        $value = self::required($payload, $key);
        if (!is_string($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a string");
        }

        return $value;
    }

    /** @param array<string, mixed> $payload */
    public static function optionalString(array $payload, string $key): ?string
    {
        if (!array_key_exists($key, $payload) || $payload[$key] === null) {
            return null;
        }

        return self::string($payload, $key);
    }

    /** @param array<string, mixed> $payload */
    public static function integer(array $payload, string $key): int
    {
        $value = self::required($payload, $key);
        if (!is_int($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be an integer");
        }

        return $value;
    }

    /** @param array<string, mixed> $payload */
    public static function optionalInteger(array $payload, string $key): ?int
    {
        if (!array_key_exists($key, $payload) || $payload[$key] === null) {
            return null;
        }

        return self::integer($payload, $key);
    }

    /** @param array<string, mixed> $payload */
    public static function boolean(array $payload, string $key): bool
    {
        $value = self::required($payload, $key);
        if (!is_bool($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a boolean");
        }

        return $value;
    }

    /**
     * objects returns the named list of JSON objects. A non-list value, or a
     * list that contains a scalar, fails at the boundary.
     *
     * @param array<string, mixed> $payload
     * @return list<array<string, mixed>>
     */
    public static function objects(array $payload, string $key): array
    {
        $value = $payload[$key] ?? null;
        if ($value === null) {
            return [];
        }
        if (!is_array($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a list");
        }
        $objects = [];
        foreach ($value as $item) {
            if (!is_array($item) || array_is_list($item)) {
                throw new \UnexpectedValueException("custd: response field {$key} contains an invalid object");
            }
            /** @var array<string, mixed> $item */
            $objects[] = $item;
        }

        return $objects;
    }

    /** @param array<string, mixed> $payload */
    private static function required(array $payload, string $key): mixed
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: response field {$key} is required");
        }

        return $payload[$key];
    }
}
