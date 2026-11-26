<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteRemedy says what a finding's fix changes; the recommendation itself is the finding's fix
 * text. kind and element are empty for a rule Custd has no remedy shape for. generated is
 * ready-to-copy code for rules with a generator, never a published change.
 */
final readonly class SiteRemedy
{
    /**
     * @param SiteRemedyKind::* $kind
     */
    public function __construct(
        public string $kind,
        public string $element,
        public ?SiteGeneratedFix $generated = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $generated = Fields::optionalObject($payload, 'generated');

        return new self(
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'element'),
            $generated === null ? null : SiteGeneratedFix::fromPayload($generated),
        );
    }
}
