<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** MintAuthDomainRequest names the attested Site domain a platform-generated issuer hostname is reserved for. */
final readonly class MintAuthDomainRequest
{
    public function __construct(public string $siteDomainId)
    {
    }

    /** @return array{siteDomainId: string} */
    public function serialise(): array
    {
        return ['siteDomainId' => $this->siteDomainId];
    }
}
