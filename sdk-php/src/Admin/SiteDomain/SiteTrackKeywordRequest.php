<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTrackKeywordRequest starts tracking a keyword. Null country and device track every country
 * and device (SiteTrackedKeyword::ALL); null notifyPosition alerts at DEFAULT_NOTIFY_POSITION.
 */
final readonly class SiteTrackKeywordRequest
{
    /** The position whose crossing alerts when none is given. */
    public const DEFAULT_NOTIFY_POSITION = 10;

    public function __construct(
        public string $keyword,
        public ?string $country = null,
        public ?string $device = null,
        public ?int $notifyPosition = null,
    ) {
    }

    /** @return array{keyword: string, country?: string, device?: string, notifyPosition?: int} */
    public function serialise(): array
    {
        $body = ['keyword' => $this->keyword];
        if ($this->country !== null && $this->country !== '') {
            $body['country'] = $this->country;
        }
        if ($this->device !== null && $this->device !== '') {
            $body['device'] = $this->device;
        }
        if ($this->notifyPosition !== null) {
            $body['notifyPosition'] = $this->notifyPosition;
        }

        return $body;
    }
}
