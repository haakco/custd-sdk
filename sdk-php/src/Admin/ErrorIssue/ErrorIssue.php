<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class ErrorIssue
{
    /**
     * @param list<string> $environments
     * @param ErrorIssueState::* $state
     */
    public function __construct(
        public string $culprit,
        public array $environments,
        public int $eventCount,
        public string $exceptionType,
        public string $fingerprint,
        public string $firstRelease,
        public string $firstSeenAt,
        public string $lastRelease,
        public string $lastSeenAt,
        public string $platform,
        public string $siteName,
        public string $siteUuid,
        public string $state,
        public string $title,
        public string $uuid,
        public ?string $regressedAt = null,
        public ?string $resolvedAt = null,
        public ?string $resolvedRelease = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'culprit'),
            Fields::strings($payload, 'environments'),
            Fields::integer($payload, 'eventCount'),
            Fields::string($payload, 'exceptionType'),
            Fields::string($payload, 'fingerprint'),
            Fields::string($payload, 'firstRelease'),
            Fields::string($payload, 'firstSeenAt'),
            Fields::string($payload, 'lastRelease'),
            Fields::string($payload, 'lastSeenAt'),
            Fields::string($payload, 'platform'),
            Fields::string($payload, 'siteName'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'regressedAt'),
            Fields::optionalString($payload, 'resolvedAt'),
            Fields::optionalString($payload, 'resolvedRelease'),
        );
    }
}
