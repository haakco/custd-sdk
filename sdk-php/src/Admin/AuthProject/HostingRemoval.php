<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * HostingRemoval is what a delete removed from one environment's hosted application. The counts are
 * what this request deleted, so a repeated delete reports only the remainder.
 */
final readonly class HostingRemoval
{
    public function __construct(
        public int $releases,
        public int $releaseObjects,
        public int $shareCardObjects,
        public int $sites,
        public int $requestSummaries,
        public int $items,
        public int $links,
        public int $collectionEntries,
        public int $measurementProjects,
        public int $meetings,
        public int $uncertaintyModels,
        public int $alertRules,
        public int $alertSubscriptions,
        public int $alertWebhooks,
        public int $alertDeliveries,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'releases'),
            Fields::integer($payload, 'releaseObjects'),
            Fields::integer($payload, 'shareCardObjects'),
            Fields::integer($payload, 'sites'),
            Fields::integer($payload, 'requestSummaries'),
            Fields::integer($payload, 'items'),
            Fields::integer($payload, 'links'),
            Fields::integer($payload, 'collectionEntries'),
            Fields::integer($payload, 'measurementProjects'),
            Fields::integer($payload, 'meetings'),
            Fields::integer($payload, 'uncertaintyModels'),
            Fields::integer($payload, 'alertRules'),
            Fields::integer($payload, 'alertSubscriptions'),
            Fields::integer($payload, 'alertWebhooks'),
            Fields::integer($payload, 'alertDeliveries'),
        );
    }
}
