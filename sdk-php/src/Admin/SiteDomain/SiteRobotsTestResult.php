<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteRobotsTestResult says whether the crawler may fetch the path, which user-agent groups
 * applied and which rule decided. rule is null when no rule matched; robotsStatus is the live
 * file's HTTP status, null for a pasted or unreachable file; note says why a live file decided
 * without a rule.
 */
final readonly class SiteRobotsTestResult
{
    /**
     * @param list<string> $groups
     * @param SiteRobotsSource::* $source
     */
    public function __construct(
        public bool $allowed,
        public string $userAgent,
        public string $path,
        public string $source,
        public array $groups,
        public ?int $robotsStatus = null,
        public ?SiteRobotsRule $rule = null,
        public ?string $note = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $rule = Fields::optionalObject($payload, 'rule');

        return new self(
            Fields::boolean($payload, 'allowed'),
            Fields::string($payload, 'userAgent'),
            Fields::string($payload, 'path'),
            Fields::string($payload, 'source'),
            Fields::strings($payload, 'groups'),
            Fields::optionalInteger($payload, 'robotsStatus'),
            $rule === null ? null : SiteRobotsRule::fromPayload($rule),
            Fields::optionalString($payload, 'note'),
        );
    }
}
