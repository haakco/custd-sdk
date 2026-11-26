<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAIOwnerHandoff is the single-use code, valid for one minute, and the address it is redeemed at. */
final readonly class SiteAIOwnerHandoff
{
    public function __construct(
        public string $code,
        public string $redeemUrl,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'code'), Fields::string($payload, 'redeemUrl'));
    }
}
