<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/**
 * ProducerEnvironmentUpdateRequest sets the environment recorded for a producer: the authenticated
 * default for events that do not declare their own. allowedEnvironments, when given, replaces the
 * environments its events may declare.
 */
final readonly class ProducerEnvironmentUpdateRequest
{
    /** @param list<string> $allowedEnvironments */
    public function __construct(
        public string $environment,
        public array $allowedEnvironments = [],
    ) {
    }

    /** @return array{environment: string, allowedEnvironments?: list<string>} */
    public function serialise(): array
    {
        $body = ['environment' => $this->environment];
        if ($this->allowedEnvironments !== []) {
            $body['allowedEnvironments'] = $this->allowedEnvironments;
        }

        return $body;
    }
}
