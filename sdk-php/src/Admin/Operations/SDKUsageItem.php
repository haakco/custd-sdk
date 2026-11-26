<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SDKUsageItem
{
    public function __construct(
        public string $firstSeenAt,
        public string $lastSeenAt,
        public int $requests,
        public string $sdk,
        public string $state,
        public string $version,
        public ?SDKVersionDeprecation $deprecation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $deprecation = Fields::optionalObject($payload, 'deprecation');

        return new self(
            Fields::string($payload, 'firstSeenAt'),
            Fields::string($payload, 'lastSeenAt'),
            Fields::integer($payload, 'requests'),
            Fields::string($payload, 'sdk'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'version'),
            $deprecation === null ? null : SDKVersionDeprecation::fromPayload($deprecation),
        );
    }
}
