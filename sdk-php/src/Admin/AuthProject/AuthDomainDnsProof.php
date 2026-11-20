<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class AuthDomainDnsProof
{
    public function __construct(public string $recordName, public string $recordValue)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, "recordName"), Fields::string($payload, "recordValue"));
    }
}
