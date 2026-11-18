<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteWordingCompareRequest is two drafts, as HTML or plain text (each at most 512 KiB), to compare. Nothing is stored. */
final readonly class SiteWordingCompareRequest
{
    public function __construct(
        public string $first,
        public string $second,
    ) {
    }

    /** @return array{first: string, second: string} */
    public function serialise(): array
    {
        return ['first' => $this->first, 'second' => $this->second];
    }
}
