<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMeetingMinutesUpdate
{
    /**
     * @param list<AppMeetingAction> $actions
     */
    public function __construct(
        public array $actions,
        public string $decisions,
        public int $expectedRevision,
        public string $minutes,
        public ?string $planLinkToken = null,
        public ?string $planUuid = null,
        public ?string $sharedSummary = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'actions' => array_map(static fn (AppMeetingAction $item): array => $item->serialise(), $this->actions),
            'decisions' => $this->decisions,
            'expectedRevision' => $this->expectedRevision,
            'minutes' => $this->minutes,
        ];
        if ($this->planLinkToken !== null) {
            $body['planLinkToken'] = $this->planLinkToken;
        }
        if ($this->planUuid !== null) {
            $body['planUuid'] = $this->planUuid;
        }
        if ($this->sharedSummary !== null) {
            $body['sharedSummary'] = $this->sharedSummary;
        }

        return $body;
    }
}
