<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteNextActions is one domain's status (unknown, up, failing, down or paused), one plain
 * headline, what Custd cannot check yet (NOT_CHECKED_* values) and its most important actions,
 * most important first. actionCount counts every action; at most MAX_ACTIONS are returned.
 */
final readonly class SiteNextActions
{
    public const MAX_ACTIONS = 3;
    public const NOT_CHECKED_UPTIME = 'uptime';
    public const NOT_CHECKED_AUDIT = 'audit';
    public const NOT_CHECKED_SEARCH = 'search';

    /**
     * @param list<string> $notChecked
     * @param list<SiteNextAction> $actions
     */
    public function __construct(
        public string $domainUuid,
        public string $host,
        public string $status,
        public string $headline,
        public array $notChecked,
        public int $actionCount,
        public array $actions,
        public ?string $checkedAt = null,
        public ?SiteAIMode $aiMode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $mode = Fields::optionalString($payload, 'aiMode');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'host'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'headline'),
            Fields::strings($payload, 'notChecked'),
            Fields::integer($payload, 'actionCount'),
            array_map(SiteNextAction::fromPayload(...), Fields::objects($payload, 'actions')),
            Fields::optionalString($payload, 'checkedAt'),
            $mode === null ? null : SiteAIMode::tryFrom($mode),
        );
    }
}
