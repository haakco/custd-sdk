<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePhraseUse is where one phrase appears in a draft and how often, with no target or verdict.
 * densityPercent is count over wordCount as a percentage, null when the draft has no words.
 */
final readonly class SitePhraseUse
{
    public function __construct(
        public string $phrase,
        public bool $inTitle,
        public bool $inDescription,
        public bool $inH1,
        public int $count,
        public int $wordCount,
        public ?float $densityPercent,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $wordCount = Fields::integer($payload, 'wordCount');

        return new self(
            Fields::string($payload, 'phrase'),
            Fields::boolean($payload, 'inTitle'),
            Fields::boolean($payload, 'inDescription'),
            Fields::boolean($payload, 'inH1'),
            Fields::integer($payload, 'count'),
            $wordCount,
            $wordCount === 0 ? null : Fields::optionalNumber($payload, 'densityPercent'),
        );
    }
}
