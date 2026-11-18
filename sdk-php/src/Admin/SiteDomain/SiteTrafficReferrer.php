<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficReferrer is one external referrer domain; class is a SiteTrafficReferrerClass::CLASS_* value. */
final readonly class SiteTrafficReferrer
{
    public function __construct(
        public string $class,
        public string $domain,
        public int $requests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'class'),
            Fields::string($payload, 'domain'),
            Fields::integer($payload, 'requests'),
        );
    }
}
