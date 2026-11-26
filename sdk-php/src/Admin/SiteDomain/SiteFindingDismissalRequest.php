<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteFindingDismissalRequest dismisses one finding's rule, domain-wide or on its page, with a reason. */
final readonly class SiteFindingDismissalRequest
{
    /**
     * @param SiteFindingDismissalScope::* $scope
     */
    public function __construct(
        public string $findingUuid,
        public string $scope,
        public string $reason,
    ) {
    }

    /** @return array{findingUuid: string, scope: string, reason: string} */
    public function serialise(): array
    {
        return ['findingUuid' => $this->findingUuid, 'scope' => $this->scope, 'reason' => $this->reason];
    }
}
