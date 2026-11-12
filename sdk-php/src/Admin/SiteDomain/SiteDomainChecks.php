<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteDomainChecks is a domain's uptime, certificate and warming state. The
 * problems the checks find are also findings, under the uptime.* and tls.* rules.
 */
final readonly class SiteDomainChecks
{
    public function __construct(
        public SiteCheckMode $mode,
        public SiteUptime $uptime,
        public SiteTls $tls,
        public SiteWarming $warming,
        public ?SiteIncident $openIncident = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $incident = Fields::optionalObject($payload, 'openIncident');

        return new self(
            SiteCheckMode::from(Fields::string($payload, 'mode')),
            SiteUptime::fromPayload(Fields::object($payload, 'uptime')),
            SiteTls::fromPayload(Fields::object($payload, 'tls')),
            SiteWarming::fromPayload(Fields::object($payload, 'warming')),
            $incident === null ? null : SiteIncident::fromPayload($incident),
        );
    }
}
