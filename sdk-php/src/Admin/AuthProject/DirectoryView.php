<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** DirectoryView is one directory's credential-store state as reported. */
final readonly class DirectoryView
{
    public function __construct(
        public string $poolId = '',
        public string $poolSlug = '',
        public string $state = '',
        public string $slotRef = '',
        public string $runtimePublicUrl = '',
        public int $revision = 0,
        public int $attemptCount = 0,
        public string $lastErrorCategory = '',
        public string $readyAt = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project directory');

        return new self(
            Fields::string($object, 'poolId'),
            Fields::string($object, 'poolSlug'),
            Fields::string($object, 'state'),
            Fields::optionalString($object, 'slotRef') ?? '',
            Fields::optionalString($object, 'runtimePublicUrl') ?? '',
            Fields::integer($object, 'revision'),
            Fields::integer($object, 'attemptCount'),
            Fields::optionalString($object, 'lastErrorCategory') ?? '',
            Fields::optionalString($object, 'readyAt') ?? '',
        );
    }
}
