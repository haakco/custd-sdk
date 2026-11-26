<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSStatus
{
    /**
     * @param list<RLSTableDiff> $tables
     */
    public function __construct(
        public string $catalogDigest,
        public string $catalogVersion,
        public array $tables,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'catalog_digest'),
            Fields::string($payload, 'catalog_version'),
            array_map(RLSTableDiff::fromPayload(...), Fields::objects($payload, 'tables')),
        );
    }
}
