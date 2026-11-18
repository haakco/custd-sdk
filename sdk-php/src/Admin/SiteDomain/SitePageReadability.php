<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageReadability measures a page's visible text. fleschReadingEase is null for pages that
 * are not in English or have no words, never 0.
 */
final readonly class SitePageReadability
{
    public function __construct(
        public int $sentences,
        public float $wordsPerSentence,
        public int $readingTimeSeconds,
        public ?float $fleschReadingEase = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'sentences'),
            Fields::number($payload, 'wordsPerSentence'),
            Fields::integer($payload, 'readingTimeSeconds'),
            Fields::optionalNumber($payload, 'fleschReadingEase'),
        );
    }
}
