<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Measurement\ProjectUpdateRequest;

final readonly class AppItemSettingsRequest
{
    public function __construct(
        public ?int $idleExpirySeconds = null,
        public ?string $name = null,
        public ?ProjectUpdateRequest $project = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->idleExpirySeconds !== null) {
            $body['idleExpirySeconds'] = $this->idleExpirySeconds;
        }
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->project !== null) {
            $body['project'] = $this->project->serialise();
        }

        return $body;
    }
}
