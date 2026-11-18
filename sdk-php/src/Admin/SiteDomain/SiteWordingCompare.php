<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWordingCompare is how much wording two drafts share, measured as the content.near-duplicate
 * rule does; wording overlap, not plagiarism. Texts under minWords are not compared: compared is
 * false and sharedPercent null.
 */
final readonly class SiteWordingCompare
{
    public function __construct(
        public int $firstWords,
        public int $secondWords,
        public int $minWords,
        public bool $compared,
        public ?int $sharedPercent,
        public int $thresholdPercent,
        public bool $nearDuplicate,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $compared = Fields::boolean($payload, 'compared');

        return new self(
            Fields::integer($payload, 'firstWords'),
            Fields::integer($payload, 'secondWords'),
            Fields::integer($payload, 'minWords'),
            $compared,
            $compared ? Fields::optionalInteger($payload, 'sharedPercent') : null,
            Fields::integer($payload, 'thresholdPercent'),
            Fields::boolean($payload, 'nearDuplicate'),
        );
    }
}
