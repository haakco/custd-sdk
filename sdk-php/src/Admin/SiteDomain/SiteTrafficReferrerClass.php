<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrafficReferrerClass is the referred requests of one CLASS_* value. */
final readonly class SiteTrafficReferrerClass
{
    public const CLASS_SEARCH = 'search';
    public const CLASS_AI = 'ai';
    public const CLASS_SOCIAL = 'social';
    public const CLASS_OTHER = 'other';

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
