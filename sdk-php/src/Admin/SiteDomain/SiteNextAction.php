<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteNextAction is one thing to do. kind is one of the KIND_* values, in the order Custd ranks
 * them; Custd may add kinds, so show one this SDK does not name by its title and why.
 * affectedCount counts a finding's pages and is 0 for an action about the whole site; rule is set
 * for a finding; recheckable means Check again can confirm the fix at once.
 */
final readonly class SiteNextAction
{
    public const KIND_VERIFY = 'verify';
    public const KIND_OUTAGE = 'outage';
    public const KIND_CERTIFICATE = 'certificate';
    public const KIND_RECONNECT_SEARCH = 'reconnect-search';
    public const KIND_FINDING = 'finding';
    public const KIND_FIRST_AUDIT_PENDING = 'first-audit-pending';
    public const KIND_CONNECT_SEARCH = 'connect-search';

    /**
     * @param SiteFindingSeverity::* $severity
     */
    public function __construct(
        public string $kind,
        public string $title,
        public string $why,
        public string $severity,
        public int $affectedCount,
        public SiteNextActionTarget $target,
        public bool $recheckable,
        public ?string $rule = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'why'),
            Fields::string($payload, 'severity'),
            Fields::integer($payload, 'affectedCount'),
            SiteNextActionTarget::fromPayload(Fields::object($payload, 'target')),
            Fields::boolean($payload, 'recheckable'),
            Fields::optionalString($payload, 'rule'),
        );
    }
}
