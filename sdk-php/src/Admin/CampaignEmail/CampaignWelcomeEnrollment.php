<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class CampaignWelcomeEnrollment
{
    public function __construct(
        public string $contactId,
        public ?string $activatedAt = null,
        public ?string $earliestReminderAt = null,
        public ?string $reminderRunId = null,
        public ?string $version = null,
        public ?string $welcomeRunId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'contactId'),
            Fields::optionalString($payload, 'activatedAt'),
            Fields::optionalString($payload, 'earliestReminderAt'),
            Fields::optionalString($payload, 'reminderRunId'),
            Fields::optionalString($payload, 'version'),
            Fields::optionalString($payload, 'welcomeRunId'),
        );
    }
}
