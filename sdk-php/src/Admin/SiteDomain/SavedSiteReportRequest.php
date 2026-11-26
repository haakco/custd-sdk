<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SavedSiteReportRequest builds and stores a report under a name unique to the domain. template is
 * a SiteReportTemplate value (the server defaults to full) and days the search window, 1 to 90
 * (default 28); null leaves either to the server.
 */
final readonly class SavedSiteReportRequest
{
    /**
     * @param SiteReportTemplate::*|null $template
     */
    public function __construct(
        public string $name,
        public ?string $template = null,
        public ?int $days = null,
    ) {
    }

    /** @return array{name: string, template?: string, days?: int} */
    public function serialise(): array
    {
        $body = ['name' => $this->name];
        if ($this->template !== null && $this->template !== '') {
            $body['template'] = $this->template;
        }
        if ($this->days !== null) {
            $body['days'] = $this->days;
        }

        return $body;
    }
}
