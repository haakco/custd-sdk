<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusPageSelection is one verified domain of the Site and the label customers see for it. */
final readonly class SiteStatusPageSelection
{
    public function __construct(
        public string $domainUuid,
        public string $label,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'domainUuid'), Fields::string($payload, 'label'));
    }

    /** @return array{domainUuid: string, label: string} */
    public function serialise(): array
    {
        return ['domainUuid' => $this->domainUuid, 'label' => $this->label];
    }
}
