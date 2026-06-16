<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress\Tests;

use PHPUnit\Framework\TestCase;

final class PackagingTest extends TestCase
{
    public function testPluginManifestOwnsItsOwnNamespaceAutoload(): void
    {
        $composer = json_decode(
            file_get_contents(__DIR__ . "/../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertSame(
            "src/",
            $composer["autoload"]["psr-4"]["HaakCo\\Custd\\WordPress\\"],
            "The WordPress package must autoload its own namespace, not rely on the root package.",
        );
    }

    public function testRootSdkPackageNoLongerAutoloadsWordPressNamespace(): void
    {
        $composer = json_decode(
            file_get_contents(__DIR__ . "/../../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertArrayNotHasKey(
            "HaakCo\\Custd\\WordPress\\",
            $composer["autoload"]["psr-4"],
            "The pure-PHP root package must not ship the WordPress subtree.",
        );
    }

    public function testPluginComposerManifestRequiresRootSdkPackage(): void
    {
        $composer = json_decode(
            file_get_contents(__DIR__ . "/../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertArrayHasKey("haakco/custd-sdk", $composer["require"]);
        $this->assertSame("^1.1", $composer["require"]["haakco/custd-sdk"]);
    }
}
