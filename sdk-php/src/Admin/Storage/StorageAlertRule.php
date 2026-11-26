<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageAlertRule
{
    /**
     * @param StorageAlertChannel::* $channel
     */
    public function __construct(
        public string $channel,
        public string $createdAt,
        public bool $enabled,
        public string $metric,
        public string $ruleId,
        public string $tenantSlug,
        public int $thresholdPercent,
        public string $updatedAt,
        public ?string $emailRecipient = null,
        public ?StorageAlertEvaluation $evaluation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $evaluation = Fields::optionalObject($payload, 'evaluation');

        return new self(
            Fields::string($payload, 'channel'),
            Fields::string($payload, 'createdAt'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'metric'),
            Fields::string($payload, 'ruleId'),
            Fields::string($payload, 'tenantSlug'),
            Fields::integer($payload, 'thresholdPercent'),
            Fields::string($payload, 'updatedAt'),
            Fields::optionalString($payload, 'emailRecipient'),
            $evaluation === null ? null : StorageAlertEvaluation::fromPayload($evaluation),
        );
    }
}
