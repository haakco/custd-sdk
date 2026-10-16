<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackDraftListResponse is the named result of GET /reporting-packs/drafts. */
final readonly class ReportingPackDraftListResponse
{
    /** @param list<ReportingPackDraft> $drafts */
    public function __construct(
        public array $drafts,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'reporting pack draft list response');

        return new self(array_map(
            static fn (\stdClass $item): ReportingPackDraft => ReportingPackDraft::fromPayload($item),
            Fields::objects($object, 'drafts'),
        ));
    }
}
