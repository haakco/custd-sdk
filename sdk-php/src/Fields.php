<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * Fields decodes and validates the named fields of a JSON response object.
 *
 * The usage and range response DTOs consume a shape-preserving decode: JSON
 * objects are `stdClass` and JSON arrays are arrays. That distinction is kept
 * until validation so a required collection cannot be satisfied by an object,
 * even an empty one, which associative decoding would otherwise collapse into
 * `[]`. A row the server explicitly documents as an open column bag stays an
 * array; every named field is typed by its DTO.
 */
final class Fields
{
    /**
     * jsonObject asserts that a decoded response body is a JSON object. A body
     * whose top level is an array or a scalar fails here.
     */
    public static function jsonObject(mixed $value, string $context): \stdClass
    {
        if (!$value instanceof \stdClass) {
            throw new \UnexpectedValueException("custd: {$context} must be a JSON object");
        }

        return $value;
    }

    /** @param \stdClass $payload */
    public static function string(\stdClass $payload, string $key): string
    {
        $value = self::required($payload, $key);
        if (!is_string($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a string");
        }

        return $value;
    }

    /** @param \stdClass $payload */
    public static function optionalString(\stdClass $payload, string $key): ?string
    {
        $value = self::optional($payload, $key);
        if ($value === null) {
            return null;
        }
        if (!is_string($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a string");
        }

        return $value;
    }

    /** @param \stdClass $payload */
    public static function integer(\stdClass $payload, string $key): int
    {
        $value = self::required($payload, $key);
        if (!is_int($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be an integer");
        }

        return $value;
    }

    /** @param \stdClass $payload */
    public static function optionalInteger(\stdClass $payload, string $key): ?int
    {
        $value = self::optional($payload, $key);
        if ($value === null) {
            return null;
        }
        if (!is_int($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be an integer");
        }

        return $value;
    }

    /** @param \stdClass $payload */
    public static function boolean(\stdClass $payload, string $key): bool
    {
        $value = self::required($payload, $key);
        if (!is_bool($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a boolean");
        }

        return $value;
    }

    /**
     * object returns a required nested JSON object. A missing or null field, or
     * a field that is a JSON array or scalar, fails at the boundary.
     *
     * @param \stdClass $payload
     */
    public static function object(\stdClass $payload, string $key): \stdClass
    {
        $value = self::required($payload, $key);
        if (!$value instanceof \stdClass) {
            throw new \UnexpectedValueException("custd: response field {$key} must be an object");
        }

        return $value;
    }

    /**
     * objects returns the named required list of JSON objects. The container
     * must be an actual JSON array, and every element an actual JSON object: an
     * empty object `{}` is a `stdClass` and fails, while an empty array `[]`
     * stays a valid empty collection. A scalar element also fails.
     *
     * @param \stdClass $payload
     * @return list<\stdClass>
     */
    public static function objects(\stdClass $payload, string $key): array
    {
        $value = self::required($payload, $key);
        if (!is_array($value) || !array_is_list($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a list");
        }
        foreach ($value as $item) {
            if (!$item instanceof \stdClass) {
                throw new \UnexpectedValueException("custd: response field {$key} must contain objects");
            }
        }
        /** @var list<\stdClass> $value */
        return $value;
    }

    /**
     * optionalObject returns an optional nested JSON object: null when the field
     * is absent or null, otherwise the same validation as {@see object}.
     *
     * @param \stdClass $payload
     */
    public static function optionalObject(\stdClass $payload, string $key): ?\stdClass
    {
        $value = self::optional($payload, $key);
        if ($value === null) {
            return null;
        }
        if (!$value instanceof \stdClass) {
            throw new \UnexpectedValueException("custd: response field {$key} must be an object");
        }

        return $value;
    }

    /**
     * optionalObjects returns an optional JSON array of JSON objects: null when
     * the field is absent or null, otherwise the same validation as
     * {@see objects}.
     *
     * @param \stdClass $payload
     * @return list<\stdClass>|null
     */
    public static function optionalObjects(\stdClass $payload, string $key): ?array
    {
        $value = self::optional($payload, $key);
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a list");
        }
        foreach ($value as $item) {
            if (!$item instanceof \stdClass) {
                throw new \UnexpectedValueException("custd: response field {$key} must contain objects");
            }
        }
        /** @var list<\stdClass> $value */
        return $value;
    }

    /**
     * optionalStrings returns an optional JSON array of strings: null when the
     * field is absent or null, otherwise a validated list of strings.
     *
     * @param \stdClass $payload
     * @return list<string>|null
     */
    public static function optionalStrings(\stdClass $payload, string $key): ?array
    {
        $value = self::optional($payload, $key);
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value)) {
            throw new \UnexpectedValueException("custd: response field {$key} must be a list");
        }
        foreach ($value as $item) {
            if (!is_string($item)) {
                throw new \UnexpectedValueException("custd: response field {$key} must contain strings");
            }
        }
        /** @var list<string> $value */
        return $value;
    }

    /**
     * objectList returns the named required list of JSON objects converted to
     * the associative arrays the public column-bag DTO exposes. Object/list
     * shape is still enforced on the shape-preserving decode first.
     *
     * @param \stdClass $payload
     * @return list<array<string, mixed>>
     */
    public static function objectList(\stdClass $payload, string $key): array
    {
        $rows = [];
        foreach (self::objects($payload, $key) as $item) {
            $rows[] = self::toArray($item);
        }

        return $rows;
    }

    /** @param \stdClass $payload */
    private static function required(\stdClass $payload, string $key): mixed
    {
        $values = get_object_vars($payload);
        if (!array_key_exists($key, $values) || $values[$key] === null) {
            throw new \UnexpectedValueException("custd: response field {$key} is required");
        }

        return $values[$key];
    }

    /** @param \stdClass $payload */
    private static function optional(\stdClass $payload, string $key): mixed
    {
        $values = get_object_vars($payload);
        if (!array_key_exists($key, $values)) {
            return null;
        }

        return $values[$key];
    }

    /**
     * @return array<string, mixed>
     */
    private static function toArray(\stdClass $value): array
    {
        $array = [];
        foreach (get_object_vars($value) as $key => $item) {
            $array[$key] = self::assoc($item);
        }

        return $array;
    }

    /**
     * assoc deep-converts a shape-preserving decode into associative arrays so
     * the public column-bag DTO keeps the array shape callers already use.
     */
    private static function assoc(mixed $value): mixed
    {
        if ($value instanceof \stdClass) {
            return self::toArray($value);
        }
        if (is_array($value)) {
            return array_map(static fn (mixed $item): mixed => self::assoc($item), $value);
        }

        return $value;
    }
}
