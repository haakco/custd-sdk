<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleasePromotion is the receipt for one promotion; previousReleaseId is null when nothing was served before. */
final readonly class AppReleasePromotion
{
    public function __construct(
        public string $releaseId,
        public string $host,
        public string $promotedAt,
        public ?string $previousReleaseId = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'app release promotion');

        return new self(
            Fields::string($object, 'releaseId'),
            Fields::string($object, 'host'),
            Fields::string($object, 'promotedAt'),
            Fields::optionalString($object, 'previousReleaseId'),
        );
    }
}
