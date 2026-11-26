<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use PHPUnit\Framework\TestCase;

/**
 * QueryParameterConformanceTest proves each optional query parameter operations.json declares for a covered
 * operation can be sent through the public method its conformance row calls: the method takes a parameter of
 * that name, takes a request DTO with that property, or its body or that DTO writes that query key; CARRIED
 * lists the reviewed cases a client writes from another argument. Required
 * parameters are proven sent by SurfaceConformanceTest's route test.
 */
final class QueryParameterConformanceTest extends TestCase
{
    /** Optional parameters every method carries through a shared convention instead of by name. */
    private const CONVENTIONS = [
        'companySlug' => 'the acting company: each method takes ?string $companySlug, a query DTO carrying it, or acts as its credential\'s company (GET /api/v1/admin/usage/me always reads the caller\'s own company; Custd ignores companySlug there)',
    ];

    /** Parameters a client writes from another argument, reviewed by hand: "<class> ?<name>" => how. */
    private const CARRIED = [
        'HaakCo\Custd\App\AppItemsClient ?item' => 'an AppItemRef access argument becomes ?item= (AppItemsClient::credential); a link token goes as the bearer instead',
    ];

    public function testEveryOptionalQueryParameterCanBeSent(): void
    {
        $operations = SurfaceConformanceTest::operations();
        $unsendable = [];
        foreach (SurfaceConformanceTest::table() as [$id, , , $call]) {
            $optional = array_filter(
                $operations[$id]['query'] ?? [],
                static fn (array $parameter): bool => !$parameter['required'] && !isset(self::CONVENTIONS[$parameter['name']]),
            );
            if ($optional === []) {
                continue;
            }
            $method = ResponseFieldConformanceTest::calledMethod($call);
            self::assertNotNull($method, "{$id}: no SDK method sent the request");
            foreach ($optional as $parameter) {
                if (!isset(self::CARRIED["{$method->class} ?{$parameter['name']}"]) && !self::canSend($method, $parameter['name'])) {
                    $unsendable[] = "{$id} ?{$parameter['name']} ({$method->class}::{$method->name})";
                }
            }
        }

        self::assertSame([], $unsendable);
    }

    private static function canSend(\ReflectionMethod $method, string $name): bool
    {
        $lines = (array) file((string) $method->getFileName());
        $sources = [implode('', array_slice($lines, (int) $method->getStartLine() - 1, (int) $method->getEndLine() - (int) $method->getStartLine() + 1))];
        foreach ($method->getParameters() as $parameter) {
            if ($parameter->getName() === $name) {
                return true;
            }
            $type = $parameter->getType();
            if ($type instanceof \ReflectionNamedType && !$type->isBuiltin() && class_exists($type->getName())) {
                $class = new \ReflectionClass($type->getName());
                if ($class->hasProperty($name)) {
                    return true;
                }
                $sources[] = (string) file_get_contents((string) $class->getFileName());
            }
        }

        return preg_match('/[\'"?&]' . preg_quote($name, '/') . '[\'"=]/', implode('', $sources)) === 1;
    }
}
