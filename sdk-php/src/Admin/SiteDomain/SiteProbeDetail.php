<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteProbeDetail
{
    /**
     * @param list<string>|null $addresses
     * @param list<string>|null $missingAddresses
     * @param list<string>|null $unexpectedAddresses
     */
    public function __construct(
        public ?string $resolvedIp,
        public ?array $addresses,
        public ?array $missingAddresses,
        public ?array $unexpectedAddresses,
        public ?int $statusCode,
        public ?string $negotiatedProtocol,
        public ?string $tlsVersion,
        public ?int $bytesRead,
        public ?SiteProbeTimings $timings,
        public ?SiteProbeCache $cache,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $timings = Fields::optionalObject($payload, 'timings');
        $cache = Fields::optionalObject($payload, 'cache');

        return new self(
            Fields::optionalString($payload, 'resolvedIp'),
            Fields::optionalStrings($payload, 'addresses'),
            Fields::optionalStrings($payload, 'missingAddresses'),
            Fields::optionalStrings($payload, 'unexpectedAddresses'),
            Fields::optionalInteger($payload, 'statusCode'),
            Fields::optionalString($payload, 'negotiatedProtocol'),
            Fields::optionalString($payload, 'tlsVersion'),
            Fields::optionalInteger($payload, 'bytesRead'),
            $timings === null ? null : SiteProbeTimings::fromPayload($timings),
            $cache === null ? null : SiteProbeCache::fromPayload($cache),
        );
    }
}
