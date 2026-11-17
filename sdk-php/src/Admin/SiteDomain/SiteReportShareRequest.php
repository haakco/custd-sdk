<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * The server defaults to 30 days and accepts a lifetime of 1 to 90 days. reportUuid shares one of
 * the domain's saved reports instead of the live report.
 */
final readonly class SiteReportShareRequest
{
    public function __construct(public int $expiresInDays = 30, public ?string $reportUuid = null)
    {
    }

    /** @return array{expiresInDays: int, reportUuid?: string} */
    public function serialise(): array
    {
        $body = ['expiresInDays' => $this->expiresInDays];
        if ($this->reportUuid !== null && $this->reportUuid !== '') {
            $body['reportUuid'] = $this->reportUuid;
        }

        return $body;
    }
}
