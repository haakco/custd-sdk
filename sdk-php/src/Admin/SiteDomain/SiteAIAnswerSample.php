<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** The latest AI answer sample for a domain. A null answer means no answer was received. */
final readonly class SiteAIAnswerSample
{
    /**
     * @param SiteAIProduct::* $product
     */
    public function __construct(
        public string $product,
        public string $observedAt,
        public ?string $answer = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'product'),
            Fields::string($payload, 'observedAt'),
            Fields::optionalString($payload, 'answer'),
        );
    }
}
