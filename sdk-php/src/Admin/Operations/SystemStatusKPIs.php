<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStatusKPIs
{
    public function __construct(
        public ?int $backlogDepth = null,
        public ?int $claimBacklog = null,
        public ?int $claimBacklogOldestAgeSeconds = null,
        public ?DesiredStateDiagnostics $desiredState = null,
        public ?float $eventsPerMinute = null,
        public ?int $failedRawLandingObjects = null,
        public ?int $invariantViolations = null,
        public ?int $rawLandingUploadFailures = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $desiredState = Fields::optionalObject($payload, 'desiredState');

        return new self(
            Fields::optionalInteger($payload, 'backlogDepth'),
            Fields::optionalInteger($payload, 'claimBacklog'),
            Fields::optionalInteger($payload, 'claimBacklogOldestAgeSeconds'),
            $desiredState === null ? null : DesiredStateDiagnostics::fromPayload($desiredState),
            Fields::optionalNumber($payload, 'eventsPerMinute'),
            Fields::optionalInteger($payload, 'failedRawLandingObjects'),
            Fields::optionalInteger($payload, 'invariantViolations'),
            Fields::optionalInteger($payload, 'rawLandingUploadFailures'),
        );
    }
}
