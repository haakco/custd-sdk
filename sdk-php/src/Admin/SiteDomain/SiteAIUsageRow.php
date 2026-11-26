<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAIUsageRow
{
    /**
     * @param SiteAIProduct::*|null $samplingProduct
     */
    public function __construct(
        public ?string $tenantSlug,
        public string $feature,
        public ?string $samplingProduct,
        public string $provider,
        public string $method,
        public string $model,
        public string $payer,
        public string $priceRevision,
        public int $attempts,
        public int $unsettledAttempts,
        public int $unknownCostAttempts,
        public int $failedAttempts,
        public int $notSentAttempts,
        public int $inputTokens,
        public int $cachedInputTokens,
        public int $outputTokens,
        public int $searches,
        public int $pages,
        public int $audioMilliseconds,
        public int $confirmedCostUsdMicros,
        public int $estimatedCostUsdMicros,
        public int $capAccountedUsdMicros,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'tenantSlug'),
            Fields::string($payload, 'feature'),
            Fields::optionalString($payload, 'samplingProduct'),
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'method'),
            Fields::string($payload, 'model'),
            Fields::string($payload, 'payer'),
            Fields::string($payload, 'priceRevision'),
            Fields::integer($payload, 'attempts'),
            Fields::integer($payload, 'unsettledAttempts'),
            Fields::integer($payload, 'unknownCostAttempts'),
            Fields::integer($payload, 'failedAttempts'),
            Fields::integer($payload, 'notSentAttempts'),
            Fields::integer($payload, 'inputTokens'),
            Fields::integer($payload, 'cachedInputTokens'),
            Fields::integer($payload, 'outputTokens'),
            Fields::integer($payload, 'searches'),
            Fields::integer($payload, 'pages'),
            Fields::integer($payload, 'audioMilliseconds'),
            Fields::integer($payload, 'confirmedCostUsdMicros'),
            Fields::integer($payload, 'estimatedCostUsdMicros'),
            Fields::integer($payload, 'capAccountedUsdMicros'),
        );
    }
}
