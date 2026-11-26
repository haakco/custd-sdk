<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteRobotsRule is the robots.txt rule that decided a test, with its line number from 1. */
final readonly class SiteRobotsRule
{
    /**
     * @param SiteRobotsDirective::* $directive
     */
    public function __construct(
        public int $line,
        public string $directive,
        public string $pattern,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'line'),
            Fields::string($payload, 'directive'),
            Fields::string($payload, 'pattern'),
        );
    }
}
