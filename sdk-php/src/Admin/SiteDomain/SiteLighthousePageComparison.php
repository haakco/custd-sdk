<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteLighthousePageComparison is one measured page and profile's latest performance score against
 * the run before it; previousAt and previousScore are null until a second run exists.
 */
final readonly class SiteLighthousePageComparison
{
    /**
     * @param SiteLighthouseProfile::* $profile
     */
    public function __construct(
        public string $url,
        public string $profile,
        public string $latestAt,
        public int $latestScore,
        public bool $regressionOpen,
        public ?string $previousAt = null,
        public ?int $previousScore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'url'),
            Fields::string($payload, 'profile'),
            Fields::string($payload, 'latestAt'),
            Fields::integer($payload, 'latestScore'),
            Fields::boolean($payload, 'regressionOpen'),
            Fields::optionalString($payload, 'previousAt'),
            Fields::optionalInteger($payload, 'previousScore'),
        );
    }
}
