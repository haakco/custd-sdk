<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use PHPUnit\Framework\TestCase;

final class ComposerMetadataTest extends TestCase
{
    public function testPackageSupportsPhp83Consumers(): void
    {
        $composer = $this->loadComposerJson(__DIR__ . "/../composer.json");

        $this->assertSame(">=8.3", $composer["require"]["php"]);
    }

    public function testDevelopmentDependenciesRemainPhp83Compatible(): void
    {
        $composer = $this->loadComposerJson(__DIR__ . "/../composer.json");

        $this->assertSame("^12.0", $composer["require-dev"]["phpunit/phpunit"]);
        $this->assertSame("8.3.0", $composer["config"]["platform"]["php"]);
    }

    public function testRootPackageSupportsPhp83Consumers(): void
    {
        $composer = $this->loadComposerJson(__DIR__ . "/../../composer.json");

        $this->assertSame(">=8.3", $composer["require"]["php"]);
    }

    public function testRootDevelopmentDependenciesRemainPhp83Compatible(): void
    {
        $composer = $this->loadComposerJson(__DIR__ . "/../../composer.json");

        $this->assertSame("^12.0", $composer["require-dev"]["phpunit/phpunit"]);
        $this->assertSame("8.3.0", $composer["config"]["platform"]["php"]);
    }

    public function testCiRunsPhpSdkTestsAcrossSupportedPhpVersions(): void
    {
        $workflow = file_get_contents(__DIR__ . "/../../.github/workflows/ci.yml");
        $this->assertIsString($workflow);

        $this->assertStringContainsString('php-version: ["8.3", "8.4", "8.5"]', $workflow);
        $this->assertStringContainsString('php-version: "${{ matrix.php-version }}"', $workflow);
    }

    private function loadComposerJson(string $path): array
    {
        $json = file_get_contents($path);
        $this->assertIsString($json);

        $composer = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        $this->assertIsArray($composer);

        return $composer;
    }
}
