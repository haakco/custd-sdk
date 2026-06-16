<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Tests;

use PHPUnit\Framework\TestCase;

final class PackagingTest extends TestCase
{
    public function testManifestOwnsItsOwnNamespaceAutoload(): void
    {
        $composer = $this->packageComposer();

        $this->assertSame(
            "src/",
            $composer["autoload"]["psr-4"]["HaakCo\\LaravelCustd\\"],
            "The Laravel package must autoload its own namespace, not rely on the root package.",
        );
    }

    public function testManifestDeclaresIlluminateAndSdkDependencies(): void
    {
        $composer = $this->packageComposer();

        $this->assertArrayHasKey("haakco/custd-sdk", $composer["require"]);
        $this->assertSame("^1.1", $composer["require"]["haakco/custd-sdk"]);
        // The provider/facade/config helpers and SendCustdEvent's
        // Illuminate\Foundation\Bus\Dispatchable trait ship only in
        // laravel/framework (Foundation is not a granular illuminate/* package).
        // Declaring it keeps a production --no-dev install from fataling on the
        // missing trait — the dangling-dependency bug this split set out to fix.
        $this->assertArrayHasKey(
            "laravel/framework",
            $composer["require"],
            "Laravel integration code must declare laravel/framework, not dangle.",
        );
    }

    public function testManifestRegistersServiceProviderAndFacade(): void
    {
        $composer = $this->packageComposer();

        $this->assertSame(
            ["HaakCo\\LaravelCustd\\CustdServiceProvider"],
            $composer["extra"]["laravel"]["providers"],
        );
        $this->assertSame(
            "HaakCo\\LaravelCustd\\Facades\\Custd",
            $composer["extra"]["laravel"]["aliases"]["Custd"],
        );
    }

    public function testRootSdkPackageNoLongerAutoloadsLaravelNamespace(): void
    {
        $root = json_decode(
            file_get_contents(__DIR__ . "/../../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertArrayNotHasKey(
            "HaakCo\\LaravelCustd\\",
            $root["autoload"]["psr-4"],
            "The pure-PHP root package must not ship the Laravel subtree.",
        );
        $this->assertArrayNotHasKey(
            "laravel",
            $root["extra"] ?? [],
            "The pure-PHP root package must not auto-register the Laravel provider.",
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function packageComposer(): array
    {
        return json_decode(
            file_get_contents(__DIR__ . "/../composer.json") ?: "",
            true,
            flags: JSON_THROW_ON_ERROR,
        );
    }
}
