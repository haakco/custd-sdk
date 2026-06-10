<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress\Tests;

use PHPUnit\Framework\TestCase;

final class PackagingTest extends TestCase
{
    public function testRootComposerPackageAutoloadsWordPressPluginNamespace(): void
    {
        $composer = json_decode(
            file_get_contents(__DIR__ . "/../../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertSame(
            "wordpress-plugin/src/",
            $composer["autoload"]["psr-4"]["HaakCo\\Custd\\WordPress\\"],
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
