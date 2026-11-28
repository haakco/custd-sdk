<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class EnrollUsageRequest
{
    public function __construct(
        public string $tariffRevisionUuid,
        public string $periodStart,
        public string $closeNotBefore,
        public ?string $dataSpaceCompanyUuid = null,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'tariffRevisionUuid' => $this->tariffRevisionUuid,
            'periodStart' => $this->periodStart,
            'closeNotBefore' => $this->closeNotBefore,
        ];

        if ($this->dataSpaceCompanyUuid !== null) {
            $payload['dataSpaceCompanyUuid'] = $this->dataSpaceCompanyUuid;
        }

        return $payload;
    }
}
