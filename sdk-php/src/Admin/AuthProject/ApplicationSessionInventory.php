<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationSessionInventory is the response to listing one application
 * principal's live sessions.
 */
final readonly class ApplicationSessionInventory
{
    /** @param list<ApplicationSession> $sessions */
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public string $directoryId = '',
        public string $principalId = '',
        public array $sessions = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application session inventory');
        $sessions = [];
        foreach (Fields::objects($object, 'sessions') as $session) {
            $sessions[] = ApplicationSession::fromPayload($session);
        }

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            $sessions,
        );
    }
}
