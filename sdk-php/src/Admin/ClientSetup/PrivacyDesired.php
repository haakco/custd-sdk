<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class PrivacyDesired
{
    /**
     * @param list<PrivacyRule>|null $rules
     */
    public function __construct(
        public bool $enabled,
        public ?string $applyMode = null,
        public ?array $rules = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabled' => $this->enabled,
        ];
        if ($this->applyMode !== null) {
            $body['applyMode'] = $this->applyMode;
        }
        if ($this->rules !== null) {
            $body['rules'] = array_map(static fn (PrivacyRule $item): array => $item->serialise(), $this->rules);
        }

        return $body;
    }
}
