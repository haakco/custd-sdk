<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** PrivateUptimeReport is one check the private agent ran. failure names the step a failed check stopped at. */
final readonly class PrivateUptimeReport
{
    public function __construct(
        public string $reportUuid,
        public string $observedAt,
        public int $responseMs,
        public ?int $statusCode = null,
        public ?PrivateUptimeFailure $failure = null,
    ) {
    }

    /** @return array{reportUuid: string, observedAt: string, responseMs: int, statusCode?: int, failure?: string} */
    public function toPayload(): array
    {
        $payload = ['reportUuid' => $this->reportUuid, 'observedAt' => $this->observedAt, 'responseMs' => $this->responseMs];
        if ($this->statusCode !== null) {
            $payload['statusCode'] = $this->statusCode;
        }
        if ($this->failure !== null) {
            $payload['failure'] = $this->failure->value;
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $failure = Fields::optionalString($payload, 'failure');

        return new self(
            Fields::string($payload, 'reportUuid'),
            Fields::string($payload, 'observedAt'),
            Fields::integer($payload, 'responseMs'),
            Fields::optionalInteger($payload, 'statusCode'),
            $failure === null ? null : PrivateUptimeFailure::from($failure),
        );
    }
}
