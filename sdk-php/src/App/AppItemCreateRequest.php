<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Uncertainty\CreateModelRequest;

final readonly class AppItemCreateRequest
{
    /**
     * @param AppItemKind::* $kind
     */
    public function __construct(
        public string $kind,
        public ?int $idleExpirySeconds = null,
        public ?AppMeasurementProjectCreate $measurementProject = null,
        public ?AppMeetingCreate $meeting = null,
        public ?string $name = null,
        public ?CreateModelRequest $uncertaintyModel = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
        ];
        if ($this->idleExpirySeconds !== null) {
            $body['idleExpirySeconds'] = $this->idleExpirySeconds;
        }
        if ($this->measurementProject !== null) {
            $body['measurementProject'] = $this->measurementProject->serialise();
        }
        if ($this->meeting !== null) {
            $body['meeting'] = $this->meeting->serialise();
        }
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->uncertaintyModel !== null) {
            $body['uncertaintyModel'] = $this->uncertaintyModel->serialise();
        }

        return $body;
    }
}
