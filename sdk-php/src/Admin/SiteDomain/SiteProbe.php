<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteProbe
{
    /**
     * @param list<string>|null $expectedAddresses
     */
    public function __construct(
        public string $kind,
        public ?int $port,
        public ?array $expectedAddresses,
        public ?string $protocol,
        public string $status,
        public ?string $lastCheckedAt,
        public ?int $responseMs,
        public ?string $lastFailure,
        public ?SiteProbeDetail $detail,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $detail = Fields::optionalObject($payload, 'detail');

        return new self(
            Fields::string($payload, 'kind'),
            Fields::optionalInteger($payload, 'port'),
            Fields::optionalStrings($payload, 'expectedAddresses'),
            Fields::optionalString($payload, 'protocol'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'lastCheckedAt'),
            Fields::optionalInteger($payload, 'responseMs'),
            Fields::optionalString($payload, 'lastFailure'),
            $detail === null ? null : SiteProbeDetail::fromPayload($detail),
        );
    }
}
