<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * ResponseFieldConformanceTest checks every response DTO against the maximal example of its operation, which
 * carries every field the server sends. For each conformance row with an example, the public method the row
 * calls is found from the call stack, its declared return type is resolved, and the DTO's public properties are
 * walked alongside the example: a key the server sends that the DTO lacks fails, and so does a DTO property the
 * server never sends. List and map element types come from the constructor or property docblocks. An untyped
 * value (`mixed`, `array<string, mixed>`, `\stdClass`) over a structured object fails unless it is a genuinely
 * free-form map named in FREE_FORM. The walk fails closed: an unresolvable method or element type is a drift.
 */
final class ResponseFieldConformanceTest extends TestCase
{
    private const API = __DIR__ . '/../../contract-fixtures/api/';

    /** Values whose keys are data, not fields: the server types them as a map of any value. Keyed by "<DTO>.<property>". */
    private const FREE_FORM = [
        'AuditEvent.details' => 'dto.AuditEventDetails.Details is map[string]any: per-action context',
    ];

    /** DTO properties the server sends that the maximal example cannot show. Keyed by "<DTO>.<property>". */
    private const UNSHOWN_FIELDS = [
        'ThresholdCue.remainingFractionBps' => 'a cue carries remainingMs or remainingFractionBps (a oneOf); the example shows remainingMs',
    ];

    /** Operations whose example is not the body the SDK method decodes. */
    private const UNCHECKED_BODY = [
        'admin-api GET /api/v1/admin/audit/events/export' => 'the method returns the raw download (format=csv or json) with its headers, not a decoded page',
    ];

    /** DTO properties named differently from the wire key they decode: "<DTO>.<property>" => wire key. */
    private const WIRE_NAMES = [
        'AuthDomainBinding.hostname' => 'host',
    ];

    /**
     * DTO properties whose DTO decodes the same JSON object as their owner, which splits one wire object into
     * named parts: "<DTO>.<property>" => reason. Their fields are checked as the owner's.
     */
    private const FLATTENED = [
        'AppRelease.summary' => 'AppReleaseSummary reads the release identity and state from the release object itself',
        'SiteAITenantUsage.usage' => 'the Go type embeds SiteAIUsage, so its fields sit on the owner',
        'SiteAIPlatformUsage.usage' => 'the Go type embeds SiteAIUsage, so its fields sit on the owner',
    ];

    public function testResponseDtosCarryExactlyTheFieldsTheServerSends(): void
    {
        $operations = SurfaceConformanceTest::operations();
        $drifts = [];
        $used = [];
        foreach (SurfaceConformanceTest::table() as [$id, , , $call]) {
            if (!isset($operations[$id]['example']) || isset(self::UNCHECKED_BODY[$id])) {
                continue;
            }
            $walk = new FieldWalk(self::FREE_FORM, self::UNSHOWN_FIELDS, self::WIRE_NAMES, self::FLATTENED);
            $method = self::calledMethod($call);
            if ($method === null) {
                $drifts[] = "{$id}: no SDK method sent the request";
                continue;
            }
            $walk->walkReturn($method, self::maximal($operations[$id]['example']));
            foreach ($walk->drifts as $drift) {
                $drifts[] = "{$id} {$drift}";
            }
            $used += $walk->used;
        }

        self::assertSame([], $drifts);
        $exemptions = array_keys(self::FREE_FORM + self::UNSHOWN_FIELDS + self::WIRE_NAMES + self::FLATTENED);
        sort($exemptions);
        $usedKeys = array_keys($used);
        sort($usedKeys);
        self::assertSame($exemptions, $usedKeys, 'an exemption no longer applies');
        self::assertSame([], array_diff(array_keys(self::UNCHECKED_BODY), array_keys($operations)));
    }

    private static function maximal(string $example): mixed
    {
        $decoded = json_decode((string) file_get_contents(self::API . $example), false, 512, JSON_THROW_ON_ERROR);
        self::assertInstanceOf(\stdClass::class, $decoded);

        return $decoded->maximal;
    }

    /**
     * calledMethod runs the row against a transport that records which public SDK method the row's closure
     * called (the stack frame whose call site is a test file) and then stops the request.
     */
    public static function calledMethod(\Closure $call): ?\ReflectionMethod
    {
        $found = null;
        $record = static function () use (&$found): never {
            foreach (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS) as $frame) {
                $class = $frame['class'] ?? '';
                if (str_starts_with($class, 'HaakCo\\Custd\\') && !str_starts_with($class, 'HaakCo\\Custd\\Tests\\')
                    && str_contains($frame['file'] ?? '', '/tests/')) {
                    $found = new \ReflectionMethod($class, $frame['function']);
                }
            }
            throw new \LogicException('recorded');
        };
        $client = new CustdClient('http://localhost:8080', 'token', [
            'admin_http_client' => $record,
            'http_client' => $record,
            'retry' => ['max_attempts' => 1, 'sleeper' => static fn (int $milliseconds): null => null],
        ]);
        try {
            $call($client, static fn (): int => 202);
        } catch (\Throwable) {
            // The request was recorded; the response is the walk's concern.
        }

        return $found;
    }
}

/**
 * FieldWalk compares one declared PHP type with one decoded JSON value and records each drift by its path.
 *
 * @internal
 */
final class FieldWalk
{
    /** @var list<string> */
    public array $drifts = [];

    /** @var array<string, true> */
    public array $used = [];

    /**
     * @param array<string, string> $freeForm
     * @param array<string, string> $unshown
     * @param array<string, string> $wireNames
     * @param array<string, string> $flattened
     */
    public function __construct(
        private readonly array $freeForm,
        private readonly array $unshown,
        private readonly array $wireNames,
        private readonly array $flattened,
    ) {
    }

    public function walkReturn(\ReflectionMethod $method, mixed $value): void
    {
        $where = $method->getDeclaringClass()->getShortName() . '::' . $method->getName();
        $type = TypeNode::fromReflection($method->getReturnType(), self::returnDoc($method), $method->getDeclaringClass());
        if ($type->kind !== TypeNode::DTO) {
            $this->drifts[] = "\$: {$where} returns {$type->describe()}, not a response DTO";

            return;
        }
        $this->walk($type, $value, '$', '');
    }

    private function walk(TypeNode $type, mixed $value, string $path, string $owner): void
    {
        if ($value === null) {
            return;
        }
        match ($type->kind) {
            TypeNode::LIST_ => $this->walkList($type, $value, $path, $owner),
            TypeNode::MAP => $this->walkMap($type, $value, $path, $owner),
            TypeNode::DTO => $this->walkObject($type, $value, $path),
            TypeNode::UNTYPED => $this->walkUntyped($value, $path, $owner),
            TypeNode::UNRESOLVED => $this->drifts[] = "{$path}: {$type->describe()}",
            default => $this->walkScalar($type, $value, $path),
        };
    }

    private function walkScalar(TypeNode $type, mixed $value, string $path): void
    {
        if (is_array($value) || $value instanceof \stdClass) {
            $this->drifts[] = "{$path}: declared {$type->describe()} but the server sends " . get_debug_type($value);
        }
    }

    private function walkUntyped(mixed $value, string $path, string $owner): void
    {
        if ($value instanceof \stdClass && get_object_vars($value) !== []) {
            if (isset($this->freeForm[$owner])) {
                $this->used[$owner] = true;

                return;
            }
            $keys = implode(', ', array_keys(get_object_vars($value)));
            $this->drifts[] = "{$path}: untyped value over a structured object with keys [{$keys}]";
        }
        if (is_array($value)) {
            foreach ($value as $item) {
                $this->walkUntyped($item, $path . '[]', $owner);
            }
        }
    }

    private function walkList(TypeNode $type, mixed $value, string $path, string $owner): void
    {
        if (!is_array($value)) {
            $this->drifts[] = "{$path}: declared a list but the server sends " . get_debug_type($value);

            return;
        }
        foreach ($value as $item) {
            $this->walk($type->inner(), $item, $path . '[]', $owner);
        }
    }

    private function walkMap(TypeNode $type, mixed $value, string $path, string $owner): void
    {
        if (!$value instanceof \stdClass) {
            $this->drifts[] = "{$path}: declared a map but the server sends " . get_debug_type($value);

            return;
        }
        $fields = get_object_vars($value);
        // The snapshot writes one "key" entry for a map (additionalProperties) and named fields otherwise.
        if ($fields !== [] && array_keys($fields) !== ['key'] && !isset($this->freeForm[$owner])) {
            $this->drifts[] = "{$path}: declared a map but the server sends fields [" . implode(', ', array_keys($fields)) . ']';
        }
        if (isset($this->freeForm[$owner])) {
            $this->used[$owner] = true;
        }
        foreach ($fields as $item) {
            $this->walk($type->inner(), $item, $path . '{}', $owner);
        }
    }

    private function walkObject(TypeNode $type, mixed $value, string $path): void
    {
        $class = new \ReflectionClass((string) $type->class);
        if (!$value instanceof \stdClass) {
            $this->drifts[] = "{$path}: declared {$class->getShortName()} but the server sends " . get_debug_type($value);

            return;
        }
        $properties = $this->properties($class);
        $sent = [];
        foreach (get_object_vars($value) as $key => $item) {
            $sent[self::normalise((string) $key)] = [(string) $key, $item];
        }
        foreach ($sent as $normal => [$key]) {
            if (!isset($properties[$normal])) {
                $this->drifts[] = "{$path}.{$key}: sent by the server but missing from {$class->getShortName()}";
            }
        }
        foreach ($properties as $normal => $property) {
            $owner = $property->getDeclaringClass()->getShortName() . '.' . $property->getName();
            if (!isset($sent[$normal])) {
                if (isset($this->unshown[$owner])) {
                    $this->used[$owner] = true;
                } else {
                    $this->drifts[] = "{$path}.{$property->getName()}: declared in {$property->getDeclaringClass()->getShortName()} but never sent by the server";
                }

                continue;
            }
            [$key, $item] = $sent[$normal];
            $declared = TypeNode::fromReflection($property->getType(), self::propertyDoc($property), $property->getDeclaringClass());
            $this->walk($declared, $item, "{$path}.{$key}", $owner);
        }
    }

    /**
     * properties keys a DTO's public properties by their normalised wire name; a flattened property contributes
     * its own DTO's properties instead.
     *
     * @param \ReflectionClass<object> $class
     * @return array<string, \ReflectionProperty>
     */
    private function properties(\ReflectionClass $class): array
    {
        $properties = [];
        foreach ($class->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
            if ($property->isStatic()) {
                continue;
            }
            $owner = $class->getShortName() . '.' . $property->getName();
            $type = $property->getType();
            if (isset($this->flattened[$owner]) && $type instanceof \ReflectionNamedType && !$type->isBuiltin()) {
                $this->used[$owner] = true;
                $properties += $this->properties(new \ReflectionClass($type->getName()));

                continue;
            }
            if (isset($this->wireNames[$owner])) {
                $this->used[$owner] = true;
            }
            $properties[self::normalise($this->wireNames[$owner] ?? $property->getName())] = $property;
        }

        return $properties;
    }

    private static function normalise(string $name): string
    {
        return strtolower((string) preg_replace('/[^A-Za-z0-9]/', '', $name));
    }

    private static function returnDoc(\ReflectionMethod $method): ?string
    {
        return self::tagType((string) $method->getDocComment(), '@return');
    }

    /** tagType reads the type after a docblock tag, which may contain spaces inside its brackets. */
    private static function tagType(string $doc, string $tag): ?string
    {
        $at = strpos($doc, $tag . ' ');
        if ($at === false) {
            return null;
        }
        $type = '';
        $depth = 0;
        foreach (str_split(ltrim(substr($doc, $at + strlen($tag)))) as $char) {
            if (ctype_space($char) && $depth === 0) {
                break;
            }
            $depth += match ($char) {
                '<', '{', '(' => 1,
                '>', '}', ')' => -1,
                default => 0,
            };
            $type .= $char;
        }

        return $type === '' ? null : $type;
    }

    private static function propertyDoc(\ReflectionProperty $property): ?string
    {
        $class = $property->getDeclaringClass();
        $var = self::tagType((string) $property->getDocComment(), '@var');
        if ($var !== null) {
            return $var;
        }
        $constructor = $class->getConstructor();
        if ($property->isPromoted() && $constructor !== null) {
            $name = preg_quote($property->getName(), '/');
            if (preg_match('/@param\s+(.+?)\s+\$' . $name . '\b/', (string) $constructor->getDocComment(), $match) === 1) {
                return $match[1];
            }
        }

        return null;
    }
}

/**
 * TypeNode is one resolved PHP type: a scalar, a DTO class, a list or map of another TypeNode, an untyped value,
 * or a type the walk cannot resolve (which is itself a drift).
 *
 * @internal
 */
final class TypeNode
{
    public const SCALAR = 'scalar';
    public const DTO = 'dto';
    public const LIST_ = 'list';
    public const MAP = 'map';
    public const UNTYPED = 'untyped';
    public const UNRESOLVED = 'unresolved';

    private const SCALARS = ['string', 'int', 'float', 'bool', 'true', 'false', 'non-empty-string', 'positive-int',
        'non-negative-int', 'numeric-string', 'int<0, max>', 'int<1, max>'];

    private function __construct(
        public readonly string $kind,
        public readonly ?string $class = null,
        private readonly ?TypeNode $element = null,
        private readonly string $text = '',
    ) {
    }

    public function inner(): self
    {
        return $this->element ?? new self(self::UNRESOLVED, text: 'element type');
    }

    public function describe(): string
    {
        return match ($this->kind) {
            self::DTO => (string) $this->class,
            self::LIST_ => 'list<' . $this->inner()->describe() . '>',
            self::MAP => 'map<' . $this->inner()->describe() . '>',
            self::UNRESOLVED => "unresolved type {$this->text}",
            default => $this->kind . ($this->text !== '' ? " {$this->text}" : ''),
        };
    }

    /** @param \ReflectionClass<object> $context */
    public static function fromReflection(?\ReflectionType $type, ?string $doc, \ReflectionClass $context): self
    {
        $names = [];
        if ($type instanceof \ReflectionNamedType) {
            $names = [$type->getName()];
        } elseif ($type instanceof \ReflectionUnionType) {
            foreach ($type->getTypes() as $member) {
                $names[] = $member instanceof \ReflectionNamedType ? $member->getName() : 'mixed';
            }
        }
        $names = array_values(array_filter($names, static fn (string $name): bool => $name !== 'null'));
        if ($names === ['array'] || $names === ['iterable']) {
            return $doc === null ? new self(self::UNRESOLVED, text: 'array without a docblock element type') : self::parse($doc, $context);
        }
        if (count($names) !== 1) {
            $rest = array_diff($names, self::SCALARS);
            // A union over any JSON value (an object or array among scalars) is untyped.
            $kind = match (true) {
                $rest === [] => self::SCALAR,
                array_diff($rest, ['stdClass', 'array', 'mixed']) === [] => self::UNTYPED,
                default => self::UNRESOLVED,
            };

            return new self($kind, text: implode('|', $names));
        }

        // Reflection names a class without the leading separator a docblock would need.
        return self::named(class_exists($names[0]) || enum_exists($names[0]) ? '\\' . $names[0] : $names[0], $context);
    }

    /** @param \ReflectionClass<object> $context */
    private static function named(string $name, \ReflectionClass $context): self
    {
        // A closed string set (`SiteCheckMode::*`) is a string on the wire.
        if (in_array($name, self::SCALARS, true) || str_ends_with($name, '::*')) {
            return new self(self::SCALAR, text: $name);
        }
        if (in_array($name, ['mixed', 'object', 'stdClass', 'array'], true)) {
            return new self(self::UNTYPED, text: $name);
        }
        if ($name === 'void' || $name === 'never') {
            return new self(self::UNTYPED, text: $name);
        }
        $class = self::resolveClass($name, $context);
        if ($class === null) {
            return new self(self::UNRESOLVED, text: $name);
        }
        if (enum_exists($class)) {
            return new self(self::SCALAR, text: $class);
        }

        return new self(self::DTO, $class);
    }

    /** @param \ReflectionClass<object> $context */
    private static function parse(string $doc, \ReflectionClass $context): self
    {
        $doc = trim($doc);
        $members = array_values(array_filter(self::splitTop($doc, '|'), static fn (string $m): bool => trim($m) !== 'null'));
        if (count($members) !== 1) {
            return new self(self::UNRESOLVED, text: $doc);
        }
        $doc = ltrim(trim($members[0]), '?');
        if (str_ends_with($doc, '[]')) {
            return new self(self::LIST_, element: self::parse(substr($doc, 0, -2), $context));
        }
        $open = strpos($doc, '<');
        if ($open === false || str_starts_with($doc, 'int<')) {
            return self::named(ltrim($doc, '\\') === 'stdClass' ? 'stdClass' : $doc, $context);
        }
        $outer = substr($doc, 0, $open);
        $args = self::splitTop(substr($doc, $open + 1, -1), ',');
        if (in_array($outer, ['list', 'non-empty-list'], true) && count($args) === 1) {
            return new self(self::LIST_, element: self::parse($args[0], $context));
        }
        if (in_array($outer, ['array', 'non-empty-array'], true) && count($args) === 2) {
            $key = trim($args[0]);

            return new self($key === 'int' ? self::LIST_ : self::MAP, element: self::parse($args[1], $context));
        }
        if ($outer === 'array' && count($args) === 1) {
            return new self(self::LIST_, element: self::parse($args[0], $context));
        }

        return new self(self::UNRESOLVED, text: $doc);
    }

    /** @return list<string> */
    private static function splitTop(string $text, string $separator): array
    {
        $parts = [];
        $depth = 0;
        $current = '';
        foreach (str_split($text) as $char) {
            $depth += match ($char) {
                '<', '{', '(' => 1,
                '>', '}', ')' => -1,
                default => 0,
            };
            if ($char === $separator && $depth === 0) {
                $parts[] = $current;
                $current = '';

                continue;
            }
            $current .= $char;
        }
        $parts[] = $current;

        return $parts;
    }

    /** @param \ReflectionClass<object> $context */
    private static function resolveClass(string $name, \ReflectionClass $context): ?string
    {
        if (str_starts_with($name, '\\')) {
            $name = ltrim($name, '\\');

            return class_exists($name) || enum_exists($name) ? $name : null;
        }
        $first = explode('\\', $name)[0];
        $source = (string) file_get_contents((string) $context->getFileName());
        if (preg_match_all('/^use\s+([A-Za-z0-9_\\\\]+)(?:\s+as\s+(\w+))?;/m', $source, $uses, PREG_SET_ORDER) > 0) {
            foreach ($uses as $use) {
                $alias = $use[2] ?? '';
                $alias = $alias !== '' ? $alias : substr((string) strrchr('\\' . $use[1], '\\'), 1);
                if ($alias === $first) {
                    $candidate = $use[1] . substr($name, strlen($first));

                    return class_exists($candidate) || enum_exists($candidate) ? $candidate : null;
                }
            }
        }
        $candidate = $context->getNamespaceName() . '\\' . $name;

        return class_exists($candidate) || enum_exists($candidate) ? $candidate : null;
    }
}
