<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * EnvironmentDeletionRequest deletes one environment. `confirmSlug` must equal
 * the stored environment slug exactly, so a mistyped identifier cannot remove
 * the wrong boundary.
 */
final readonly class EnvironmentDeletionRequest
{
    public function __construct(public string $confirmSlug)
    {
        if (trim($confirmSlug) === '') {
            throw new \InvalidArgumentException('custd: environment deletion needs the stored environment slug to confirm');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['confirmSlug' => $this->confirmSlug];
    }
}
