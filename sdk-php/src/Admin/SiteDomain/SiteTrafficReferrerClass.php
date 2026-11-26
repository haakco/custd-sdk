<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficReferrerClass is the referred requests of one SiteReferrerClass value. */
final readonly class SiteTrafficReferrerClass
{
    /**
     * @param SiteReferrerClass::* $class
     */
    public function __construct(
        public string $class,
        public int $requests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'class'),
            Fields::integer($payload, 'requests'),
        );
    }
}
