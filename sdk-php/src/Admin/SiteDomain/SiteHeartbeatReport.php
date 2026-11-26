<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatReport identifies one scheduled run and what the job reported for it. */
final readonly class SiteHeartbeatReport
{
    /**
     * @param SiteHeartbeatOutcome::* $outcome
     */
    public function __construct(
        public string $scheduledFor,
        public string $outcome,
    ) {
    }

    /** @return array{scheduledFor: string, outcome: string} */
    public function toPayload(): array
    {
        return ['scheduledFor' => $this->scheduledFor, 'outcome' => $this->outcome];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'scheduledFor'),
            Fields::string($payload, 'outcome'),
        );
    }
}
