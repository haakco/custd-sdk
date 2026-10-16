<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** One audience's resulting grant state. */
final readonly class AudienceGrant
{
    public function __construct(
        public string $principalId,
        public string $organisationId,
        public string $audience,
        public bool $granted,
        public bool $managed,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'audience state');

        return new self(
            Fields::string($object, 'principalId'),
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'audience'),
            Fields::boolean($object, 'granted'),
            Fields::boolean($object, 'managed'),
        );
    }
}
