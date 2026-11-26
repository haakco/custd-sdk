<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** PrivateUptimeRequest names the private network the agent checks the domain from. */
final readonly class PrivateUptimeRequest
{
    public function __construct(public string $networkLabel)
    {
    }

    /** @return array{networkLabel: string} */
    public function serialise(): array
    {
        return ['networkLabel' => $this->networkLabel];
    }
}
