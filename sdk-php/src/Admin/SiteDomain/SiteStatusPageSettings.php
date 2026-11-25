<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteStatusPageSettings is the saved draft and the current publication. Both are null before the
 * first publish; after an unpublish the draft stays and the publication is null.
 */
final readonly class SiteStatusPageSettings
{
    public function __construct(
        public ?SiteStatusPageDraft $draft = null,
        public ?SiteStatusPagePublication $publication = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $draft = Fields::optionalObject($payload, 'draft');
        $publication = Fields::optionalObject($payload, 'publication');

        return new self(
            $draft === null ? null : SiteStatusPageDraft::fromPayload($draft),
            $publication === null ? null : SiteStatusPagePublication::fromPayload($publication),
        );
    }
}
