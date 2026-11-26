<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardDefinition
{
    /**
     * @param list<string> $requiredScopes
     * @param list<WidgetDefinition> $widgets
     * @param list<ReportingExportFormat::*> $exportFormats
     * @param list<DashboardInteractionRule> $interactions
     * @param list<ReportSectionDefinition> $sections
     */
    public function __construct(
        public string $defaultRange,
        public string $key,
        public int $refreshSeconds,
        public array $requiredScopes,
        public string $title,
        public array $widgets,
        public ?string $description = null,
        public ?ExecutiveReportDefinition $executive = null,
        public array $exportFormats = [],
        public ?string $group = null,
        public array $interactions = [],
        public ?string $packKey = null,
        public array $sections = [],
        public ?DashboardSharePolicy $sharePolicy = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $executive = Fields::optionalObject($payload, 'executive');
        $sharePolicy = Fields::optionalObject($payload, 'sharePolicy');

        return new self(
            Fields::string($payload, 'defaultRange'),
            Fields::string($payload, 'key'),
            Fields::integer($payload, 'refreshSeconds'),
            Fields::strings($payload, 'requiredScopes'),
            Fields::string($payload, 'title'),
            array_map(WidgetDefinition::fromPayload(...), Fields::objects($payload, 'widgets')),
            Fields::optionalString($payload, 'description'),
            $executive === null ? null : ExecutiveReportDefinition::fromPayload($executive),
            Fields::optionalStrings($payload, 'exportFormats') ?? [],
            Fields::optionalString($payload, 'group'),
            array_map(DashboardInteractionRule::fromPayload(...), Fields::optionalObjects($payload, 'interactions') ?? []),
            Fields::optionalString($payload, 'packKey'),
            array_map(ReportSectionDefinition::fromPayload(...), Fields::optionalObjects($payload, 'sections') ?? []),
            $sharePolicy === null ? null : DashboardSharePolicy::fromPayload($sharePolicy),
        );
    }
}
