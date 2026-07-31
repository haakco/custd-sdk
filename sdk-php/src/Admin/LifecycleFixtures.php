<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * Load shared lifecycle contract fixtures shipped with the SDK. Fixtures are
 * version-controlled under `contract-fixtures/lifecycle/{namespace}/{name}.json`
 * and consumed by every supported SDK language so the contract stays the
 * single source of truth. Test-only: never used in production paths.
 */
final class LifecycleFixtures
{
    private const RELATIVE_ROOT = "../../../contract-fixtures/lifecycle";

    /**
     * @return array<string, mixed>
     */
    public static function load(string $namespace, string $name): array
    {
        if ($namespace === "" || $name === "") {
            throw new \InvalidArgumentException(
                "custd: lifecycle fixture namespace and name are required"
            );
        }
        $path = __DIR__ . "/" . self::RELATIVE_ROOT . "/" . $namespace . "/" . $name;
        $raw = @file_get_contents($path);
        if ($raw === false) {
            throw new \RuntimeException(
                "custd: lifecycle fixture {$namespace}/{$name} not found at {$path}"
            );
        }
        try {
            $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $err) {
            throw new \RuntimeException(
                "custd: lifecycle fixture {$namespace}/{$name} is not valid JSON: " . $err->getMessage(),
                0,
                $err,
            );
        }
        if (!is_array($decoded)) {
            throw new \RuntimeException(
                "custd: lifecycle fixture {$namespace}/{$name} must decode to an object"
            );
        }
        return $decoded;
    }
}
