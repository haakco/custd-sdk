<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteUpdateTrackedKeywordRequest pauses or resumes a tracked keyword and sets its alert position (1..100). */
final readonly class SiteUpdateTrackedKeywordRequest
{
    public function __construct(
        public bool $paused,
        public int $notifyPosition,
    ) {
    }

    /** @return array{paused: bool, notifyPosition: int} */
    public function serialise(): array
    {
        return ['paused' => $this->paused, 'notifyPosition' => $this->notifyPosition];
    }
}
