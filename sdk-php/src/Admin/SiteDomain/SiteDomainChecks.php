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
    /**
     * @param SiteCheckMode::* $mode
     */
    public function __construct(
        public string $mode,
        public SiteUptime $uptime,
        public SiteTls $tls,
        public SiteWarming $warming,
        public ?SiteIncident $openIncident = null,
        public ?SiteChromeUx $chromeUx = null,
        public ?SiteRegistration $registration = null,
        public ?SiteHttpExpectations $httpExpectations = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $incident = Fields::optionalObject($payload, 'openIncident');
        $chromeUx = Fields::optionalObject($payload, 'chromeUx');
        $registration = Fields::optionalObject($payload, 'registration');
        $httpExpectations = Fields::optionalObject($payload, 'httpExpectations');

        return new self(
            Fields::string($payload, 'mode'),
            SiteUptime::fromPayload(Fields::object($payload, 'uptime')),
            SiteTls::fromPayload(Fields::object($payload, 'tls')),
            SiteWarming::fromPayload(Fields::object($payload, 'warming')),
            $incident === null ? null : SiteIncident::fromPayload($incident),
            $chromeUx === null ? null : SiteChromeUx::fromPayload($chromeUx),
            $registration === null ? null : SiteRegistration::fromPayload($registration),
            $httpExpectations === null ? null : SiteHttpExpectations::fromPayload($httpExpectations),
        );
    }
}
