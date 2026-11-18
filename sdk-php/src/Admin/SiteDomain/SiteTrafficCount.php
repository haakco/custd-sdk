<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTrafficCount is the requests of one key (a status class, path, country or assistant domain);
 * OTHER_KEY collects the rest beyond each day's top rows.
 */
final readonly class SiteTrafficCount
{
    public const OTHER_KEY = '(other)';

    public function __construct(
        public string $key,
        public int $requests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::integer($payload, 'requests'),
        );
    }
}
