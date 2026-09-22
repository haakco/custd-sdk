<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Enforces the single-source-of-truth version rule across every SDK package.
 *
 * One release tag drives one version. The root `VERSION` file is that source of
 * truth. Packages that hardcode a version (the registry- and path-shim-published
 * ones) must equal it; packages whose version is derived from the git tag on
 * their split mirror (Packagist) must NOT hardcode a version at all. The release
 * tag is checked against `VERSION` by the CI release guard.
 *
 * @see docs/plans/2026-06-16-sdk-version-source-of-truth-and-publish_plan.md
 */
final class VersionSyncTest extends TestCase
{
    public function testVersionFileExists(): void
    {
        $this->assertFileExists($this->repoPath("VERSION"), "Root VERSION file is the single source of truth for all SDK versions.");
        $this->assertMatchesRegularExpression(
            '/^\d+\.\d+\.\d+$/',
            $this->sourceOfTruth(),
            "VERSION must be a bare semver string (e.g. 1.3.0), no leading 'v' or trailing newline content."
        );
    }

    /**
     * Packages that hardcode a version must match the source of truth exactly.
     *
     * @return iterable<string, array{string, string}>
     */
    public static function hardcodedVersionManifests(): iterable
    {
        yield "sdk-js (Verdaccio)" => ["sdk-js/package.json", "json"];
        yield "sdk-react (Verdaccio)" => ["sdk-react/package.json", "json"];
        yield "sdk-python (registry)" => ["sdk-python/pyproject.toml", "toml"];
        yield "sdk-php (path-shim)" => ["sdk-php/composer.json", "json"];
        yield "sdk-go (VERSION file)" => ["sdk-go/VERSION", "raw"];
    }

    #[DataProvider("hardcodedVersionManifests")]
    public function testHardcodedVersionsMatchSourceOfTruth(string $relativePath, string $format): void
    {
        $declared = match ($format) {
            "json" => $this->jsonVersion($relativePath),
            "toml" => $this->tomlVersion($relativePath),
            "raw" => trim((string) file_get_contents($this->repoPath($relativePath))),
            default => throw new \UnexpectedValueException("Unknown manifest format: {$format}"),
        };

        $this->assertSame(
            $this->sourceOfTruth(),
            $declared,
            sprintf("%s version must equal the root VERSION file.", $relativePath)
        );
    }

    /**
     * Packagist-derived packages take their version from the git tag on their
     * split mirror, so hardcoding a version here would invite drift.
     *
     * @return iterable<string, array{string}>
     */
    public static function tagDerivedManifests(): iterable
    {
        yield "root haakco/custd-sdk" => ["composer.json"];
        yield "haakco/custd-laravel" => ["laravel-package/composer.json"];
        yield "haakco/custd-wordpress" => ["wordpress-plugin/composer.json"];
    }

    #[DataProvider("tagDerivedManifests")]
    public function testTagDerivedPackagesDoNotHardcodeVersion(string $relativePath): void
    {
        $composer = $this->loadJson($relativePath);

        $this->assertArrayNotHasKey(
            "version",
            $composer,
            sprintf("%s must omit `version` — its version comes from the git tag on its split mirror.", $relativePath)
        );
    }

    /**
     * Manifests in this repository that depend on a sibling package in this same
     * repository. A range here is version state exactly like a hardcoded version
     * is, so it belongs to this test rather than to each package's own suite.
     *
     * @return iterable<string, array{string, string}>
     */
    public static function intraRepoDependencyManifests(): iterable
    {
        yield "haakco/custd-laravel" => ["laravel-package/composer.json", "haakco/custd-sdk"];
        yield "haakco/custd-wordpress" => ["wordpress-plugin/composer.json", "haakco/custd-sdk"];
        yield "@haakco/custd-sdk (react)" => ["sdk-react/package.json", "@haakco/custd-sdk"];
    }

    #[DataProvider("intraRepoDependencyManifests")]
    public function testIntraRepoDependencyRangesAdmitTheReleasedVersion(string $relativePath, string $dependency): void
    {
        $manifest = $this->loadJson($relativePath);
        $requires = array_merge(
            (array) ($manifest["require"] ?? []),
            (array) ($manifest["dependencies"] ?? []),
            (array) ($manifest["peerDependencies"] ?? []),
        );

        $this->assertArrayHasKey(
            $dependency,
            $requires,
            sprintf("%s must declare its dependency on %s.", $relativePath, $dependency)
        );

        $constraint = (string) $requires[$dependency];
        $releasedMajor = (int) explode(".", $this->sourceOfTruth())[0];

        // A range that does not admit the released major cannot be installed at
        // all, so every consumer of this package is blocked. That is the exact
        // defect this guard exists to catch: the framework packages stayed on
        // `^1.1` while the released line moved to 2.x, which made both split
        // mirrors unresolvable.
        $this->assertContains(
            $releasedMajor,
            $this->admittedMajors($constraint),
            sprintf(
                "%s requires %s %s, which does not admit the released version %s.",
                $relativePath,
                $dependency,
                $constraint,
                $this->sourceOfTruth()
            )
        );
    }

    public function testReleaseGuardEnforcesTagMatchesVersion(): void
    {
        $workflow = (string) file_get_contents($this->repoPath(".github/workflows/ci.yml"));

        // Assert the guard's behavioural contract, not just its name: it must exist,
        // read the VERSION source of truth, derive the tag from the ref, and fail
        // (non-zero exit) on mismatch. A renamed/commented/inverted guard fails here.
        $this->assertStringContainsString("release-guard:", $workflow, "CI must carry a release-guard job.");
        $this->assertStringContainsString("< VERSION", $workflow, "release-guard must read the VERSION source of truth.");
        $this->assertStringContainsString('GITHUB_REF_NAME#v', $workflow, "release-guard must derive the version from the tag (stripping the leading 'v').");
        $this->assertMatchesRegularExpression(
            '/release-guard:.*exit 1/s',
            $workflow,
            "release-guard must fail (exit 1) when the tag does not match VERSION."
        );
    }

    public function testReleaseWorkflowsNeverForcePushMain(): void
    {
        $workflowPaths = array_merge(
            glob($this->repoPath(".github/workflows/*.yml")) ?: [],
            glob($this->repoPath(".github/workflows/*.yaml")) ?: []
        );
        foreach ($workflowPaths as $workflowPath) {
            $workflow = (string) file_get_contents($workflowPath);
            $this->assertDoesNotMatchRegularExpression(
                '/push[^\n]*(?:refs\/heads\/main|main)[^\n]*--force|push[^\n]*--force[^\n]*(?:refs\/heads\/main|main)/',
                $workflow,
                basename($workflowPath) . " must preserve main branch history."
            );
        }
    }

    private function sourceOfTruth(): string
    {
        return trim((string) file_get_contents($this->repoPath("VERSION")));
    }

    /**
     * admittedMajors returns the majors a constraint admits.
     *
     * Only the two forms this repository writes are understood, and any other form
     * fails loudly: a constraint that cannot be parsed must not pass this guard by
     * default, which is what a permissive check would do.
     *
     * @return list<int>
     */
    private function admittedMajors(string $constraint): array
    {
        $constraint = trim($constraint);

        if (preg_match('/^\^(\d+)(?:\.\d+)*$/', $constraint, $matches) === 1) {
            return [(int) $matches[1]];
        }

        if (preg_match('/^>=(\d+)(?:\.\d+)*\s+<(\d+)(?:\.\d+)*$/', $constraint, $matches) === 1) {
            return range((int) $matches[1], (int) $matches[2] - 1);
        }

        throw new \UnexpectedValueException(
            sprintf("VersionSyncTest does not understand the constraint \"%s\".", $constraint)
        );
    }

    private function jsonVersion(string $relativePath): string
    {
        $manifest = $this->loadJson($relativePath);
        $this->assertArrayHasKey("version", $manifest, sprintf("%s must declare a version.", $relativePath));

        return (string) $manifest["version"];
    }

    private function tomlVersion(string $relativePath): string
    {
        $toml = (string) file_get_contents($this->repoPath($relativePath));
        // Accept either TOML string quote style.
        $matched = preg_match('/^version\s*=\s*["\']([^"\']+)["\']/m', $toml, $matches);
        $this->assertSame(1, $matched, sprintf("%s must declare a version.", $relativePath));

        return $matches[1];
    }

    /**
     * @return array<string, mixed>
     */
    private function loadJson(string $relativePath): array
    {
        $json = (string) file_get_contents($this->repoPath($relativePath));
        $decoded = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        $this->assertIsArray($decoded);

        return $decoded;
    }

    private function repoPath(string $relativePath): string
    {
        return __DIR__ . "/../../" . $relativePath;
    }
}
