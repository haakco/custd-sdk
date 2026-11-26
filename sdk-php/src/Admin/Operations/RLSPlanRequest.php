<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

final readonly class RLSPlanRequest
{
    public function __construct(
        public string $gitCommit,
        public string $label,
        public ?int $expiresInSeconds = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'git_commit' => $this->gitCommit,
            'label' => $this->label,
        ];
        if ($this->expiresInSeconds !== null) {
            $body['expires_in_seconds'] = $this->expiresInSeconds;
        }

        return $body;
    }
}
