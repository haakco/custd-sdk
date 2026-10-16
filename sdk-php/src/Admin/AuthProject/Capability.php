<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Capability is the configured modes one environment may use, so a caller can
 * show unavailable options honestly rather than offering them. The legal
 * vocabularies are server-owned and surfaced unchanged.
 */
final readonly class Capability
{
    /**
     * @param  list<string>  $identityModes
     * @param  list<string>  $registrationPolicies
     * @param  list<string>  $profileFieldKeys
     */
    public function __construct(
        public array $identityModes = [],
        public array $registrationPolicies = [],
        public array $profileFieldKeys = [],
        public string $audienceConstraints = '',
        public string $subjectUniqueness = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project capability');

        return new self(
            Fields::optionalStrings($object, 'identityModes') ?? [],
            Fields::optionalStrings($object, 'registrationPolicies') ?? [],
            Fields::optionalStrings($object, 'profileFieldKeys') ?? [],
            Fields::string($object, 'audienceConstraints'),
            Fields::string($object, 'subjectUniqueness'),
        );
    }
}
