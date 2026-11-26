<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppRelease is one stored release of a hosted environment, with its manifest. */
final readonly class AppRelease
{
    public function __construct(
        public AppReleaseSummary $summary,
        public AppReleaseManifest $manifest,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'app release');

        return new self(
            AppReleaseSummary::fromPayload($object),
            AppReleaseManifest::fromPayload(Fields::object($object, 'manifest')),
        );
    }
}
