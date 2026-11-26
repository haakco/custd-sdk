<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Hosting serves the environment as a hosted application. `mode` is `enabled` or `disabled`;
 * `capabilities` are the ones it turns on (`tracking`, `error_capture`, `app_data`, `sign_in`).
 * The host name is not part of it: the server derives it and reports it on {@see Status::$hosting}.
 */
final readonly class Hosting
{
    /** @param list<string> $capabilities */
    public function __construct(
        public string $mode,
        public array $capabilities = [],
        public ?HostingIngestTarget $ingestTarget = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        $payload = ['mode' => $this->mode, 'capabilities' => $this->capabilities];
        if ($this->ingestTarget !== null) {
            $payload['ingestTarget'] = $this->ingestTarget->toPayload();
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $ingestTarget = Fields::optionalObject($payload, 'ingestTarget');

        return new self(
            Fields::string($payload, 'mode'),
            Fields::strings($payload, 'capabilities'),
            $ingestTarget === null ? null : HostingIngestTarget::fromPayload($ingestTarget),
        );
    }
}
