<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteMarket is a country (ISO 3166-1 alpha-2, such as ZA) and a language (ISO 639, such as en). */
final readonly class SiteMarket
{
    public function __construct(
        public string $country,
        public string $language,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'country'), Fields::string($payload, 'language'));
    }

    /** @return array{country: string, language: string} */
    public function serialise(): array
    {
        return ['country' => $this->country, 'language' => $this->language];
    }
}
