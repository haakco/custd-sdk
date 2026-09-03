<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final class Payload
{
    /** @param array<string, mixed> $payload
     *  @return array<string, mixed>
     */
    public static function withoutNulls(array $payload): array
    {
        return array_filter($payload, static fn (mixed $value): bool => $value !== null);
    }

    /** @param array<string, mixed> $payload */
    public static function string(array $payload, string $key): string
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} is required");
        }
        $value = $payload[$key];
        if (!is_string($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be a string");
        }
        return $value;
    }

    /** @param array<string, mixed> $payload */
    public static function integer(array $payload, string $key): int
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} is required");
        }
        $value = $payload[$key];
        if (!is_int($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be an integer");
        }
        return $value;
    }

    /** @param array<string, mixed> $payload */
    public static function optionalInteger(array $payload, string $key): ?int
    {
        if (!array_key_exists($key, $payload) || $payload[$key] === null) {
            return null;
        }
        $value = $payload[$key];
        if (!is_int($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be an integer");
        }
        return $value;
    }

    /** @param array<string, mixed> $payload */
    public static function boolean(array $payload, string $key): bool
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} is required");
        }
        $value = $payload[$key];
        if (!is_bool($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be a boolean");
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

    /** @param array<string, mixed> $payload
     *  @return array<string, mixed>
     */
    public static function object(array $payload, string $key): array
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} is required");
        }
        $value = $payload[$key];
        if (!is_array($value) || array_is_list($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be an object");
        }
        /** @var array<string, mixed> $value */
        return $value;
    }

    /** @param array<string, mixed> $payload
     *  @return list<array<string, mixed>>
     */
    public static function objects(array $payload, string $key): array
    {
        if (!array_key_exists($key, $payload)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} is required");
        }
        $value = $payload[$key];
        if ($value === null) {
            return [];
        }
        if (!is_array($value)) {
            throw new \UnexpectedValueException("custd: time-plan {$key} must be a list");
        }
        $objects = [];
        foreach ($value as $item) {
            if (!is_array($item) || array_is_list($item)) {
                throw new \UnexpectedValueException("custd: time-plan {$key} contains an invalid object");
            }
            /** @var array<string, mixed> $item */
            $objects[] = $item;
        }
        return $objects;
    }

    /** @return array<string, mixed> */
    public static function encode(Dto $dto): array
    {
        $encoded = $dto->toPayload();
        return $encoded;
    }

    public static function value(mixed $value): mixed
    {
        if ($value instanceof Dto) {
            return $value->toPayload();
        }
        if (is_array($value)) {
            return array_map(self::value(...), $value);
        }
        return $value;
    }
}
