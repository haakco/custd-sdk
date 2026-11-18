<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteIndexNowSubmission is one batch of URLs sent to IndexNow. providerStatus is IndexNow's HTTP
 * status and submittedAt the send time, both null until it was sent.
 */
final readonly class SiteIndexNowSubmission
{
    /** @param list<string> $urls */
    public function __construct(
        public string $submissionUuid,
        public SiteIndexNowSubmissionStatus $status,
        public array $urls,
        public string $requestedAt,
        public ?int $providerStatus = null,
        public ?string $failure = null,
        public ?string $submittedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'submissionUuid'),
            SiteIndexNowSubmissionStatus::from(Fields::string($payload, 'status')),
            Fields::strings($payload, 'urls'),
            Fields::string($payload, 'requestedAt'),
            Fields::optionalInteger($payload, 'providerStatus'),
            Fields::optionalString($payload, 'failure'),
            Fields::optionalString($payload, 'submittedAt'),
        );
    }
}
