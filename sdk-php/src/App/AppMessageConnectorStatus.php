<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageConnectorStatus
{
    public function __construct(
        public AppMessageConnectorState $state,
        public ?string $grantId = null,
        public ?int $sourceGeneration = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
        public ?string $lastReportAt = null,
        public ?int $pendingMedia = null,
        public ?AppMessageConnectorConnection $connectionState = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $connectionState = Fields::optionalString($payload, 'connectionState');

        return new self(
            AppMessageConnectorState::from(Fields::string($payload, 'state')),
            Fields::optionalString($payload, 'grantId'),
            Fields::optionalInteger($payload, 'sourceGeneration'),
            Fields::optionalString($payload, 'createdAt'),
            Fields::optionalString($payload, 'updatedAt'),
            Fields::optionalString($payload, 'lastReportAt'),
            Fields::optionalInteger($payload, 'pendingMedia'),
            $connectionState === null ? null : AppMessageConnectorConnection::from($connectionState),
        );
    }
}
