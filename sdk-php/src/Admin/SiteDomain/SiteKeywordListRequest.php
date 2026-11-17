<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteKeywordListRequest creates or replaces the Site's keyword list of that name. seedTerm is an
 * optional topic whose Wikipedia trend is read; null or empty leaves it out.
 */
final readonly class SiteKeywordListRequest
{
    /** @param list<string> $keywords */
    public function __construct(
        public string $name,
        public array $keywords,
        public ?string $seedTerm = null,
    ) {
    }

    /** @return array{name: string, seedTerm?: string, keywords: list<string>} */
    public function serialise(): array
    {
        $body = ['name' => $this->name];
        if ($this->seedTerm !== null && $this->seedTerm !== '') {
            $body['seedTerm'] = $this->seedTerm;
        }
        $body['keywords'] = array_values($this->keywords);

        return $body;
    }
}
