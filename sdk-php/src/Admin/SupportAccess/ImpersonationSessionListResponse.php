<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

use HaakCo\Custd\Fields;

final readonly class ImpersonationSessionListResponse
{
    /**
     * @param list<ImpersonationSession> $sessions
     */
    public function __construct(
        public array $sessions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ImpersonationSession::fromPayload(...), Fields::objects($payload, 'sessions')),
        );
    }
}
