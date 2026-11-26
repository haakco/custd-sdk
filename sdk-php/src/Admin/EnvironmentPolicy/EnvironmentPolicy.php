<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EnvironmentPolicy;

use HaakCo\Custd\Fields;

final readonly class EnvironmentPolicy
{
    /**
     * @param list<string> $activeValues
     * @param list<string> $disabledValues
     * @param list<EnvironmentPolicyReason> $reasons
     */
    public function __construct(
        public int $activeCount,
        public int $activeValueLimit,
        public array $activeValues,
        public bool $autoCreateEnvironments,
        public bool $definitionEnabled,
        public bool $definitionPresent,
        public array $disabledValues,
        public array $reasons,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'activeCount'),
            Fields::integer($payload, 'activeValueLimit'),
            Fields::strings($payload, 'activeValues'),
            Fields::boolean($payload, 'autoCreateEnvironments'),
            Fields::boolean($payload, 'definitionEnabled'),
            Fields::boolean($payload, 'definitionPresent'),
            Fields::strings($payload, 'disabledValues'),
            array_map(EnvironmentPolicyReason::fromPayload(...), Fields::objects($payload, 'reasons')),
        );
    }
}
