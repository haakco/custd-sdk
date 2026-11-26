<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * HostingWithdrawal is what offboarding withdrew from a hosted environment. `status` is `complete`,
 * `pending` (repeat the offboard to resume) or `unavailable` (no hosting on this deployment).
 */
final readonly class HostingWithdrawal
{
    public function __construct(
        public string $status,
        public int $activeReleases,
        public int $sites,
        public int $alertRules,
        public int $alertDeliveries,
        public ?string $errorCategory = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'activeReleases'),
            Fields::integer($payload, 'sites'),
            Fields::integer($payload, 'alertRules'),
            Fields::integer($payload, 'alertDeliveries'),
            Fields::optionalString($payload, 'errorCategory'),
        );
    }
}
