<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/**
 * DataSpaceSiteAdoption is the result of moving a parent's Site into an owned data space. The Site's
 * credentials keep their client id and secret and now belong to the data space.
 */
final readonly class DataSpaceSiteAdoption
{
    /**
     * @param DataSpaceSiteAdoptionStatus::* $status
     * @param list<string> $credentialClientIds
     */
    public function __construct(
        public string $siteUuid,
        public string $dataSpaceSlug,
        public string $parentCompanySlug,
        public string $status,
        public int $movedRecords,
        public array $credentialClientIds,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'dataSpaceSlug'),
            Fields::string($payload, 'parentCompanySlug'),
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'movedRecords'),
            Fields::strings($payload, 'credentialClientIds'),
        );
    }
}
