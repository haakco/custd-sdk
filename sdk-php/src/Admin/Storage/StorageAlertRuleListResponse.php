<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertRuleListResponse
{
    /**
     * @param list<StorageAlertRule> $rules
     */
    public function __construct(
        public array $rules,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(StorageAlertRule::fromPayload(...), Fields::objects($payload, 'rules')),
        );
    }
}
