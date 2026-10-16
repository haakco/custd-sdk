<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** PackDashboardDefinition is one pack dashboard with its widgets and sections. */
final readonly class PackDashboardDefinition
{
    /**
     * @param list<string> $requiredScopes
     * @param list<PackWidgetDefinition> $widgets
     * @param list<string>|null $exportFormats
     * @param list<DashboardInteractionRule>|null $interactions
     * @param list<ReportSectionDefinition>|null $sections
     */
    public function __construct(
        public string $key,
        public string $title,
        public string $defaultRange,
        public int $refreshSeconds,
        public array $requiredScopes,
        public array $widgets,
        public ?string $packKey = null,
        public ?array $exportFormats = null,
        public ?string $description = null,
        public ?string $group = null,
        public ?array $interactions = null,
        public ?DashboardSharePolicy $sharePolicy = null,
        public ?array $sections = null,
        public ?ExecutiveReportDefinition $executive = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $interactions = Fields::optionalObjects($payload, 'interactions');
        $sections = Fields::optionalObjects($payload, 'sections');
        $sharePolicy = Fields::optionalObject($payload, 'sharePolicy');
        $executive = Fields::optionalObject($payload, 'executive');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'defaultRange'),
            Fields::integer($payload, 'refreshSeconds'),
            Fields::strings($payload, 'requiredScopes'),
            array_map(static fn (\stdClass $item): PackWidgetDefinition => PackWidgetDefinition::fromPayload($item), Fields::objects($payload, 'widgets')),
            Fields::optionalString($payload, 'packKey'),
            Fields::optionalStrings($payload, 'exportFormats'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'group'),
            $interactions === null ? null : array_map(static fn (\stdClass $item): DashboardInteractionRule => DashboardInteractionRule::fromPayload($item), $interactions),
            $sharePolicy === null ? null : DashboardSharePolicy::fromPayload($sharePolicy),
            $sections === null ? null : array_map(static fn (\stdClass $item): ReportSectionDefinition => ReportSectionDefinition::fromPayload($item), $sections),
            $executive === null ? null : ExecutiveReportDefinition::fromPayload($executive),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'title' => $this->title,
            'defaultRange' => $this->defaultRange,
            'refreshSeconds' => $this->refreshSeconds,
            'requiredScopes' => $this->requiredScopes,
            'widgets' => array_map(static fn (PackWidgetDefinition $item): array => $item->serialise(), $this->widgets),
        ];
        if ($this->packKey !== null) {
            $payload['packKey'] = $this->packKey;
        }
        if ($this->exportFormats !== null) {
            $payload['exportFormats'] = $this->exportFormats;
        }
        if ($this->description !== null) {
            $payload['description'] = $this->description;
        }
        if ($this->group !== null) {
            $payload['group'] = $this->group;
        }
        if ($this->interactions !== null) {
            $payload['interactions'] = array_map(static fn (DashboardInteractionRule $item): array => $item->serialise(), $this->interactions);
        }
        if ($this->sharePolicy !== null) {
            $payload['sharePolicy'] = $this->sharePolicy->serialise();
        }
        if ($this->sections !== null) {
            $payload['sections'] = array_map(static fn (ReportSectionDefinition $item): array => $item->serialise(), $this->sections);
        }
        if ($this->executive !== null) {
            $payload['executive'] = $this->executive->serialise();
        }

        return $payload;
    }
}
