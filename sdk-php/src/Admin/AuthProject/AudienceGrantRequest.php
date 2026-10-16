<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** Directory, organisation and exact registered audience for a grant or revoke. */
final readonly class AudienceGrantRequest
{
    public function __construct(
        public string $directoryId,
        public string $audience,
        public string $organisationId,
    ) {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            'directoryId' => $this->directoryId,
            'audience' => $this->audience,
            'organisationId' => $this->organisationId,
        ];
    }
}
