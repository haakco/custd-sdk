<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementProject
{
    /**
     * @param list<MeasurementSeriesResponse> $series
     */
    public function __construct(
        public string $createdAt,
        public MeasurementProjectDelivery $delivery,
        public string $description,
        public string $kind,
        public string $name,
        public string $projectCode,
        public string $projectUuid,
        public MeasurementProjectRun $run,
        public string $status,
        public string $updatedAt,
        public array $series = [],
        public ?MeasurementTargetResponse $target = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $target = Fields::optionalObject($payload, 'target');

        return new self(
            Fields::string($payload, 'createdAt'),
            MeasurementProjectDelivery::fromPayload(Fields::object($payload, 'delivery')),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'projectCode'),
            Fields::string($payload, 'projectUuid'),
            MeasurementProjectRun::fromPayload(Fields::object($payload, 'run')),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'updatedAt'),
            array_map(MeasurementSeriesResponse::fromPayload(...), Fields::optionalObjects($payload, 'series') ?? []),
            $target === null ? null : MeasurementTargetResponse::fromPayload($target),
        );
    }
}
