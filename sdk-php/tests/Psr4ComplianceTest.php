<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Guards against the v1.2.0 regression where several classes were packed into
 * a single file, breaking PSR-4 and causing fatal redeclarations for consumers
 * that re-scan source files individually (e.g. Strauss prefixing).
 */
final class Psr4ComplianceTest extends TestCase
{
    /**
     * @return iterable<string, array{string}>
     */
    public static function sourceFiles(): iterable
    {
        $root = realpath(__DIR__ . "/../src");
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->getExtension() !== "php") {
                continue;
            }
            $relative = substr($file->getPathname(), strlen($root) + 1);
            yield $relative => [$file->getPathname()];
        }
    }

    #[DataProvider("sourceFiles")]
    public function testEachSourceFileDeclaresOnePsr4Type(string $path): void
    {
        $types = $this->declaredTypeNames($path);

        $this->assertCount(
            1,
            $types,
            sprintf(
                "PSR-4 requires one type per file; %s declares: %s",
                basename($path),
                implode(", ", $types) ?: "(none)"
            )
        );

        $this->assertSame(
            pathinfo($path, PATHINFO_FILENAME),
            $types[0],
            sprintf("PSR-4 requires the file name to match the type name in %s", basename($path))
        );
    }

    /**
     * @return list<string>
     */
    private function declaredTypeNames(string $path): array
    {
        $tokens = token_get_all((string) file_get_contents($path));
        $declarationTokens = [T_CLASS, T_INTERFACE, T_TRAIT, T_ENUM];
        $types = [];

        foreach ($tokens as $index => $token) {
            if (!is_array($token) || !in_array($token[0], $declarationTokens, true)) {
                continue;
            }
            if ($this->previousSignificant($tokens, $index) === T_DOUBLE_COLON) {
                continue; // `Foo::class`, not a declaration
            }
            $name = $this->nextTypeName($tokens, $index);
            if ($name !== null) {
                $types[] = $name;
            }
        }

        return $types;
    }

    /**
     * @param list<array{0:int,1:string,2:int}|string> $tokens
     */
    private function previousSignificant(array $tokens, int $index): ?int
    {
        for ($i = $index - 1; $i >= 0; $i--) {
            $token = $tokens[$i];
            if (is_array($token) && $token[0] === T_WHITESPACE) {
                continue;
            }
            return is_array($token) ? $token[0] : null;
        }
        return null;
    }

    /**
     * @param list<array{0:int,1:string,2:int}|string> $tokens
     */
    private function nextTypeName(array $tokens, int $index): ?string
    {
        for ($i = $index + 1, $count = count($tokens); $i < $count; $i++) {
            $token = $tokens[$i];
            if (is_array($token) && $token[0] === T_WHITESPACE) {
                continue;
            }
            return is_array($token) && $token[0] === T_STRING ? $token[1] : null;
        }
        return null;
    }
}
