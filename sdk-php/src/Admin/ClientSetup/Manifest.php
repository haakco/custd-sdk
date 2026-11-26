<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class Manifest
{
    /**
     * @param list<EventTypeConfigDesired>|null $eventTypeConfigs
     * @param list<OAuthClientDesired>|null $oauthClients
     * @param list<ReportingPackDesired>|null $reportingPacks
     * @param list<SchemaDesired>|null $schemas
     */
    public function __construct(
        public ?array $eventTypeConfigs = null,
        public ?array $oauthClients = null,
        public ?PrivacyDesired $privacy = null,
        public ?array $reportingPacks = null,
        public ?RetentionDesired $retention = null,
        public ?array $schemas = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->eventTypeConfigs !== null) {
            $body['eventTypeConfigs'] = array_map(static fn (EventTypeConfigDesired $item): array => $item->serialise(), $this->eventTypeConfigs);
        }
        if ($this->oauthClients !== null) {
            $body['oauthClients'] = array_map(static fn (OAuthClientDesired $item): array => $item->serialise(), $this->oauthClients);
        }
        if ($this->privacy !== null) {
            $body['privacy'] = $this->privacy->serialise();
        }
        if ($this->reportingPacks !== null) {
            $body['reportingPacks'] = array_map(static fn (ReportingPackDesired $item): array => $item->serialise(), $this->reportingPacks);
        }
        if ($this->retention !== null) {
            $body['retention'] = $this->retention->serialise();
        }
        if ($this->schemas !== null) {
            $body['schemas'] = array_map(static fn (SchemaDesired $item): array => $item->serialise(), $this->schemas);
        }

        return $body;
    }
}
