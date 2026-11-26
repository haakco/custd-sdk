<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class ErrorIssueDetail
{
    public function __construct(
        public ErrorIssue $issue,
        public Event $latestEvent,
        public string $latestEventUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            ErrorIssue::fromPayload(Fields::object($payload, 'issue')),
            Event::fromPayload(Fields::object($payload, 'latestEvent')),
            Fields::string($payload, 'latestEventUuid'),
        );
    }
}
