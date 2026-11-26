<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

final readonly class StorageAlertRuleCreateRequest
{
    /**
     * @param StorageAlertChannel::* $channel
     */
    public function __construct(
        public string $channel,
        public string $emailRecipient,
        public bool $enabled,
        public string $metric,
        public int $thresholdPercent,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'channel' => $this->channel,
            'emailRecipient' => $this->emailRecipient,
            'enabled' => $this->enabled,
            'metric' => $this->metric,
            'thresholdPercent' => $this->thresholdPercent,
        ];

        return $body;
    }
}
