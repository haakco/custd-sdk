<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseSummary is one release in a list, without its file manifest. */
final readonly class AppReleaseSummary
{
    /**
     * @param AppReleaseState::* $state
     */
    public function __construct(
        public string $releaseId,
        public string $state,
        public bool $active,
        public int $fileCount,
        public int $totalBytes,
        public string $createdAt,
        public ?string $label = null,
        public ?string $verifiedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'releaseId'),
            Fields::string($payload, 'state'),
            Fields::boolean($payload, 'active'),
            Fields::integer($payload, 'fileCount'),
            Fields::integer($payload, 'totalBytes'),
            Fields::string($payload, 'createdAt'),
            Fields::optionalString($payload, 'label'),
            Fields::optionalString($payload, 'verifiedAt'),
        );
    }
}
