<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class RedactionRequest implements Dto
{
    public function __construct(public string $reason)
    {
        if (trim($reason) === "") {
            throw new \InvalidArgumentException("custd: redaction reason is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["reason" => $this->reason];
    }
}
