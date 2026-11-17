<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteLighthouseHistory
{
    /**
     * @param list<SiteLighthouseRun> $runs
     */
    public function __construct(
        public string $domainUuid,
        public int $days,
        public array $runs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::integer($payload, 'days'),
            array_map(SiteLighthouseRun::fromPayload(...), Fields::objects($payload, 'runs')),
        );
    }
}
