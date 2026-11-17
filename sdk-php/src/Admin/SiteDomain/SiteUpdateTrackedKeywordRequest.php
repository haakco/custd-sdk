<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteUpdateTrackedKeywordRequest pauses or resumes a tracked keyword. notifyPosition (1..100) sets its
 * alert position; null keeps the stored one.
 */
final readonly class SiteUpdateTrackedKeywordRequest
{
    public function __construct(
        public bool $paused,
        public ?int $notifyPosition = null,
    ) {
    }

    /** @return array{paused: bool, notifyPosition?: int} */
    public function serialise(): array
    {
        $body = ['paused' => $this->paused];
        if ($this->notifyPosition !== null && $this->notifyPosition !== 0) {
            $body['notifyPosition'] = $this->notifyPosition;
        }

        return $body;
    }
}
