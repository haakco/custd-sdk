<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Optional checks on the final response from a public HTTPS path. An absent field is not checked. */
final readonly class SiteHttpExpectations
{
    public function __construct(
        public ?int $statusCode = null,
        public ?int $maxResponseMs = null,
        public ?string $bodyContains = null,
        public ?SiteHttpJsonExpectation $json = null,
        public ?string $path = null,
    ) {
    }

    public function toPayload(): \stdClass
    {
        return (object) array_filter(get_object_vars($this), static fn (mixed $value): bool => $value !== null);
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $json = Fields::optionalObject($payload, 'json');

        return new self(
            Fields::optionalInteger($payload, 'statusCode'),
            Fields::optionalInteger($payload, 'maxResponseMs'),
            Fields::optionalString($payload, 'bodyContains'),
            $json === null ? null : SiteHttpJsonExpectation::fromPayload($json),
            Fields::optionalString($payload, 'path'),
        );
    }
}
