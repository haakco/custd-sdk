<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** BindAuthDomainRequest reserves a verified hostname, on one of the tenant's Site domains, for the environment. */
final readonly class BindAuthDomainRequest
{
    public function __construct(public string $siteDomainId, public string $host)
    {
    }

    /** @return array{siteDomainId: string, host: string} */
    public function serialise(): array
    {
        return ['siteDomainId' => $this->siteDomainId, 'host' => $this->host];
    }
}
