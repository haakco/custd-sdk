<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class DeployCredential
{
    public function __construct(
        public string $app,
        public string $clientId,
        public string $clientSecret,
        public string $scope,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'app'),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'clientSecret'),
            Fields::string($payload, 'scope'),
        );
    }
}
