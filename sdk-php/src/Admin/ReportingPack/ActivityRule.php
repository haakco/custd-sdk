<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ActivityRule declares the activity bucket window for an identity. */
final readonly class ActivityRule
{
    public function __construct(
        public string $key,
        public string $identity,
        public int $bucketDays,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'identity'),
            Fields::integer($payload, 'bucketDays'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['key' => $this->key, 'identity' => $this->identity, 'bucketDays' => $this->bucketDays];
    }
}
