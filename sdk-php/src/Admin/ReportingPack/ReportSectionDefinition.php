<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportSectionDefinition groups widgets into one report section. */
final readonly class ReportSectionDefinition
{
    /**
     * @param list<string>|null $widgetKeys
     * @param list<NarrativeBlock>|null $narrative
     */
    public function __construct(
        public string $key,
        public string $title,
        public string $layout,
        public int $columnSpan,
        public ?array $widgetKeys = null,
        public ?array $narrative = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $narrative = Fields::optionalObjects($payload, 'narrative');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'layout'),
            Fields::integer($payload, 'columnSpan'),
            Fields::optionalStrings($payload, 'widgetKeys'),
            $narrative === null
                ? null
                : array_map(static fn (\stdClass $item): NarrativeBlock => NarrativeBlock::fromPayload($item), $narrative),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'title' => $this->title,
            'layout' => $this->layout,
            'columnSpan' => $this->columnSpan,
        ];
        if ($this->widgetKeys !== null) {
            $payload['widgetKeys'] = $this->widgetKeys;
        }
        if ($this->narrative !== null) {
            $payload['narrative'] = array_map(static fn (NarrativeBlock $item): array => $item->serialise(), $this->narrative);
        }

        return $payload;
    }
}
