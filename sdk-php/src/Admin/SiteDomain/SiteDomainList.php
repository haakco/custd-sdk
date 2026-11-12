<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteDomainList is one site's domains, from the `{domains:[...]}` envelope. */
final readonly class SiteDomainList
{
    /** @param list<SiteDomain> $domains */
    public function __construct(
        public array $domains = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $domains = [];
        foreach (Fields::objects($payload, 'domains') as $domain) {
            $domains[] = SiteDomain::fromPayload($domain);
        }

        return new self($domains);
    }
}
