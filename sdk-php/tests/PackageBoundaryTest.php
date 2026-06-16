<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use PHPUnit\Framework\TestCase;

/**
 * Guards the package boundary: the published root package must be the pure-PHP
 * SDK only. Framework subtrees (Laravel, WordPress), tests, and scripts must
 * not leak into a generic consumer's dist (e.g. Awthy's Strauss prefixing).
 */
final class PackageBoundaryTest extends TestCase
{
    public function testRootAutoloadsOnlyThePurePhpRoot(): void
    {
        $composer = $this->loadComposerJson($this->rootPath());

        $this->assertSame(
            ["HaakCo\\Custd\\" => "sdk-php/src/"],
            $composer["autoload"]["psr-4"],
            "Root package must autoload only the pure-PHP SDK root."
        );
    }

    public function testRootDeclaresOnlyPurePhpRuntimeDependencies(): void
    {
        $composer = $this->loadComposerJson($this->rootPath());

        $this->assertSame(
            ["php", "ext-curl"],
            array_keys($composer["require"]),
            "Root package require must be pure PHP (php + ext-curl)."
        );
    }

    public function testRootDoesNotForceLaravelProviderRegistration(): void
    {
        $composer = $this->loadComposerJson($this->rootPath());

        $this->assertArrayNotHasKey(
            "laravel",
            $composer["extra"] ?? [],
            "Root package must not auto-register a Laravel service provider."
        );
    }

    public function testRootDevDependenciesAreFrameworkFree(): void
    {
        $composer = $this->loadComposerJson($this->rootPath());

        $this->assertArrayNotHasKey(
            "orchestra/testbench",
            $composer["require-dev"] ?? [],
            "Root package must not pull a framework test harness."
        );
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function exportIgnoredPaths(): iterable
    {
        yield "laravel subtree" => ["laravel-package"];
        yield "wordpress subtree" => ["wordpress-plugin"];
        yield "php sdk tests" => ["sdk-php/tests"];
        yield "php sdk scripts" => ["sdk-php/scripts"];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider("exportIgnoredPaths")]
    public function testGitattributesExportIgnoresNonSdkPaths(string $path): void
    {
        $gitattributes = (string) file_get_contents(__DIR__ . "/../../.gitattributes");

        // Anchored, no-trailing-slash directory pattern is the form `git archive` honours.
        $pattern = '/^\/?' . preg_quote($path, "/") . '\s+export-ignore$/m';

        $this->assertMatchesRegularExpression(
            $pattern,
            $gitattributes,
            sprintf("%s must be export-ignored so it never ships in the dist.", $path)
        );
    }

    private function rootPath(): string
    {
        return __DIR__ . "/../../composer.json";
    }

    /**
     * @return array<string, mixed>
     */
    private function loadComposerJson(string $path): array
    {
        $json = file_get_contents($path);
        $this->assertIsString($json);

        $composer = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        $this->assertIsArray($composer);

        return $composer;
    }
}
