<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class Event
{
    /**
     * @param list<Exception> $exceptions
     */
    public function __construct(
        public array $exceptions,
        public string $fingerprint,
        public ?string $correlationId = null,
        public ?string $environment = null,
        public ?string $level = null,
        public ?string $platform = null,
        public ?string $release = null,
        public ?string $runtimeName = null,
        public ?string $runtimeVersion = null,
        public ?string $sdkName = null,
        public ?string $sdkVersion = null,
        public ?string $siteUuid = null,
        public ?bool $truncated = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Exception::fromPayload(...), Fields::objects($payload, 'exceptions')),
            Fields::string($payload, 'fingerprint'),
            Fields::optionalString($payload, 'correlationId'),
            Fields::optionalString($payload, 'environment'),
            Fields::optionalString($payload, 'level'),
            Fields::optionalString($payload, 'platform'),
            Fields::optionalString($payload, 'release'),
            Fields::optionalString($payload, 'runtimeName'),
            Fields::optionalString($payload, 'runtimeVersion'),
            Fields::optionalString($payload, 'sdkName'),
            Fields::optionalString($payload, 'sdkVersion'),
            Fields::optionalString($payload, 'siteUuid'),
            Fields::optionalBoolean($payload, 'truncated'),
        );
    }
}
