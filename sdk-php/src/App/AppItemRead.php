<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Measurement\MeasurementProject;
use HaakCo\Custd\Admin\Measurement\ProjectEstimateListResponse;
use HaakCo\Custd\Admin\Uncertainty\ModelDetail;
use HaakCo\Custd\Fields;

final readonly class AppItemRead
{
    /**
     * @param list<AppItemLink> $links
     * @param list<AppPlanMeetingSummary> $planMeetingSummaries
     */
    public function __construct(
        public AppItem $item,
        public ?AppItemCounterProgress $counterProgress = null,
        public ?ProjectEstimateListResponse $estimates = null,
        public ?AppLinkCollection $linkCollection = null,
        public array $links = [],
        public ?MeasurementProject $measurementProject = null,
        public ?AppItemRunPage $measurementRuns = null,
        public ?AppMeeting $meeting = null,
        public ?AppMeetingMinutes $meetingMinutes = null,
        public ?AppModelPreview $modelPreview = null,
        public ?AppPlan $plan = null,
        public array $planMeetingSummaries = [],
        public ?ModelDetail $uncertaintyModel = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $counterProgress = Fields::optionalObject($payload, 'counterProgress');
        $estimates = Fields::optionalObject($payload, 'estimates');
        $linkCollection = Fields::optionalObject($payload, 'linkCollection');
        $measurementProject = Fields::optionalObject($payload, 'measurementProject');
        $measurementRuns = Fields::optionalObject($payload, 'measurementRuns');
        $meeting = Fields::optionalObject($payload, 'meeting');
        $meetingMinutes = Fields::optionalObject($payload, 'meetingMinutes');
        $modelPreview = Fields::optionalObject($payload, 'modelPreview');
        $plan = Fields::optionalObject($payload, 'plan');
        $uncertaintyModel = Fields::optionalObject($payload, 'uncertaintyModel');

        return new self(
            AppItem::fromPayload(Fields::object($payload, 'item')),
            $counterProgress === null ? null : AppItemCounterProgress::fromPayload($counterProgress),
            $estimates === null ? null : ProjectEstimateListResponse::fromPayload($estimates),
            $linkCollection === null ? null : AppLinkCollection::fromPayload($linkCollection),
            array_map(AppItemLink::fromPayload(...), Fields::optionalObjects($payload, 'links') ?? []),
            $measurementProject === null ? null : MeasurementProject::fromPayload($measurementProject),
            $measurementRuns === null ? null : AppItemRunPage::fromPayload($measurementRuns),
            $meeting === null ? null : AppMeeting::fromPayload($meeting),
            $meetingMinutes === null ? null : AppMeetingMinutes::fromPayload($meetingMinutes),
            $modelPreview === null ? null : AppModelPreview::fromPayload($modelPreview),
            $plan === null ? null : AppPlan::fromPayload($plan),
            array_map(AppPlanMeetingSummary::fromPayload(...), Fields::optionalObjects($payload, 'planMeetingSummaries') ?? []),
            $uncertaintyModel === null ? null : ModelDetail::fromPayload($uncertaintyModel),
        );
    }
}
