<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingExport
{
    /**
     * @param  list<AccountingRecord>  $records
     * @param  list<AccountingGap>  $sourceGaps
     */
    public function __construct(
        public string $sellerCompanyUuid,
        public string $month,
        public string $businessTimeZone,
        public array $records,
        public array $sourceGaps,
        public ?string $nextAfter = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'month'),
            Fields::string($payload, 'businessTimeZone'),
            array_map(AccountingRecord::fromPayload(...), Fields::optionalObjects($payload, 'records') ?? []),
            array_map(AccountingGap::from(...), Fields::optionalStrings($payload, 'sourceGaps') ?? []),
            Fields::optionalString($payload, 'nextAfter'),
        );
    }
}
