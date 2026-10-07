<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ListResponse is one page of GET /api/v1/admin/auth-projects.
 *
 * `nextAfter` is the cursor for the next page and is empty on the last page.
 */
final readonly class ListResponse
{
    /** @param list<Summary> $projects */
    public function __construct(
        public array $projects = [],
        public string $nextAfter = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project list');
        $projects = [];
        foreach (Fields::objects($object, 'projects') as $project) {
            $projects[] = Summary::fromPayload($project);
        }

        return new self($projects, Fields::optionalString($object, 'nextAfter') ?? '');
    }
}
