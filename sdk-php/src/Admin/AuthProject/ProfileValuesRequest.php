<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ProfileValuesRequest is one principal's requested profile values. The
 * environment, directory and principal come from the address, so the body can
 * name no boundary of its own. A write is an upsert, so repeating it converges.
 */
final readonly class ProfileValuesRequest
{
    /** @param  list<ApplicationProfileValue>  $values */
    public function __construct(public array $values)
    {
        if ($values === []) {
            throw new \InvalidArgumentException('custd: application profile write needs at least one value');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['values' => array_map(static fn (ApplicationProfileValue $value): array => $value->toPayload(), $this->values)];
    }
}
