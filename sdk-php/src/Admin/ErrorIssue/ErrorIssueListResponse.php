<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class ErrorIssueListResponse
{
    /**
     * @param list<ErrorIssue> $issues
     */
    public function __construct(
        public array $issues,
        public int $openCount,
        public ?string $nextCursor = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ErrorIssue::fromPayload(...), Fields::objects($payload, 'issues')),
            Fields::integer($payload, 'openCount'),
            Fields::optionalString($payload, 'nextCursor'),
        );
    }
}
