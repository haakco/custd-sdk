<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppOverview
{
    public function __construct(
        public AppSummary $app,
        public int $ownerLinks,
        public int $releaseCount,
        public int $shareLinks,
        public ?ReleaseSummary $latestRelease = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latestRelease = Fields::optionalObject($payload, 'latestRelease');

        return new self(
            AppSummary::fromPayload(Fields::object($payload, 'app')),
            Fields::integer($payload, 'ownerLinks'),
            Fields::integer($payload, 'releaseCount'),
            Fields::integer($payload, 'shareLinks'),
            $latestRelease === null ? null : ReleaseSummary::fromPayload($latestRelease),
        );
    }
}
