<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppDeployCredentialList
{
    /**
     * @param list<AppDeployCredentialSummary> $credentials
     */
    public function __construct(
        public array $credentials,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppDeployCredentialSummary::fromPayload(...), Fields::objects($payload, 'credentials')),
        );
    }
}
