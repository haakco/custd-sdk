<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\MachineAccess;

/**
 * MachineAccessCompanyUpdateRequest changes the company policy. A null member is not sent and leaves that setting
 * as it is, so setting areas alone never changes support automation.
 */
final readonly class MachineAccessCompanyUpdateRequest
{
    /**
     * @param list<MachineAccessAreaSetting>|null $areas
     */
    public function __construct(
        public ?bool $allowSupportAutomation = null,
        public ?array $areas = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->allowSupportAutomation !== null) {
            $body['allowSupportAutomation'] = $this->allowSupportAutomation;
        }
        if ($this->areas !== null) {
            $body['areas'] = MachineAccessAreaSetting::serialiseAll($this->areas);
        }

        return $body;
    }
}
