<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** SocialProviderStatus is one provider's state (`active`, `applying`, `unavailable` or `waiting_for_directory`). */
final readonly class SocialProviderStatus
{
    /**
     * @param AuthProjectSocialProviderMode::* $mode
     * @param AuthProjectSocialProviderName::* $provider
     * @param AuthProjectSocialProviderState::* $state
     */
    public function __construct(
        public string $provider,
        public string $mode,
        public string $state,
        public string $note,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'mode'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'note'),
        );
    }
}
