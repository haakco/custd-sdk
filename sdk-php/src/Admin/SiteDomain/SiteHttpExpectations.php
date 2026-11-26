<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Optional checks on the final home page response. An absent field is not checked. */
final readonly class SiteHttpExpectations
{
    public function __construct(
        public ?int $statusCode = null,
        public ?int $maxResponseMs = null,
        public ?string $bodyContains = null,
        public ?SiteHttpJsonExpectation $json = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $json = Fields::optionalObject($payload, 'json');

        return new self(
            Fields::optionalInteger($payload, 'statusCode'),
            Fields::optionalInteger($payload, 'maxResponseMs'),
            Fields::optionalString($payload, 'bodyContains'),
            $json === null ? null : SiteHttpJsonExpectation::fromPayload($json),
        );
    }
}
