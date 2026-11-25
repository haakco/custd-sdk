<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteStatusUpdateRequest is a customer message of up to 1000 characters. Reuse the same
 * requestUuid when retrying, so a retry does not post or notify twice.
 */
final readonly class SiteStatusUpdateRequest
{
    public function __construct(
        public string $requestUuid,
        public string $message,
    ) {
    }

    /** @return array{requestUuid: string, message: string} */
    public function serialise(): array
    {
        return ['requestUuid' => $this->requestUuid, 'message' => $this->message];
    }
}
