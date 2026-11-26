<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteKeywordListRequest creates or replaces the Site's keyword list of that name. seedTerm is an
 * optional topic whose Wikipedia trend is read; null or empty leaves it out. marketSampleEnabled allows
 * sampling the public seed topic and needs a seedTerm; false is left out, which the server reads as off.
 */
final readonly class SiteKeywordListRequest
{
    /** @param list<string> $keywords */
    public function __construct(
        public string $name,
        public array $keywords,
        public ?string $seedTerm = null,
        public bool $marketSampleEnabled = false,
    ) {
    }

    /** @return array{name: string, seedTerm?: string, keywords: list<string>, marketSampleEnabled?: true} */
    public function serialise(): array
    {
        $body = ['name' => $this->name];
        if ($this->seedTerm !== null && $this->seedTerm !== '') {
            $body['seedTerm'] = $this->seedTerm;
        }
        $body['keywords'] = array_values($this->keywords);
        if ($this->marketSampleEnabled) {
            $body['marketSampleEnabled'] = true;
        }

        return $body;
    }
}
