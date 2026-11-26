<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/**
 * Wire reads the bare JSON arrays the schema routes answer with. A JSON null is the empty list.
 *
 * @internal
 */
final class Wire
{
    /** @return list<\stdClass> */
    public static function objectList(mixed $payload, string $context): array
    {
        $payload ??= [];
        if (!is_array($payload) || !array_is_list($payload)) {
            throw new \UnexpectedValueException("custd: {$context} response must be a JSON array");
        }
        foreach ($payload as $item) {
            if (!$item instanceof \stdClass) {
                throw new \UnexpectedValueException("custd: {$context} response must contain objects");
            }
        }

        /** @var list<\stdClass> $payload */
        return $payload;
    }

    /**
     * objects reads an optional list field; absent or null is the empty list.
     *
     * @return list<\stdClass>
     */
    public static function objects(\stdClass $payload, string $key): array
    {
        return Fields::optionalObjects($payload, $key) ?? [];
    }
}
