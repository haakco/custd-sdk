<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class TenantOffboardingReceipt
{
    /**
     * @param list<TenantReceiptPerStore> $perStore
     */
    public function __construct(
        public int $companyId,
        public string $completedAt,
        public string $finalState,
        public array $perStore,
        public string $requestedAt,
        public string $requestedByKind,
        public string $sha256,
        public ?TenantReceiptWaiver $waiver = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $waiver = Fields::optionalObject($payload, 'waiver');

        return new self(
            Fields::integer($payload, 'company_id'),
            Fields::string($payload, 'completed_at'),
            Fields::string($payload, 'final_state'),
            array_map(TenantReceiptPerStore::fromPayload(...), Fields::objects($payload, 'per_store')),
            Fields::string($payload, 'requested_at'),
            Fields::string($payload, 'requested_by_kind'),
            Fields::string($payload, 'sha256'),
            $waiver === null ? null : TenantReceiptWaiver::fromPayload($waiver),
        );
    }
}
