<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ProjectDeletionRequest deletes one project. `confirmSlug` must equal the stored
 * project slug exactly: a caller that cannot name the project cannot delete it,
 * which stops a mistyped identifier from removing the wrong boundary.
 */
final readonly class ProjectDeletionRequest
{
    public function __construct(public string $confirmSlug)
    {
        if (trim($confirmSlug) === '') {
            throw new \InvalidArgumentException('custd: project deletion needs the stored project slug to confirm');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['confirmSlug' => $this->confirmSlug];
    }
}
