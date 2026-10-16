<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** The addressed principal's audience admission states. */
final readonly class PrincipalAudiences
{
    /** @param list<PrincipalAudience> $audiences */
    public function __construct(
        public string $audienceEntitlementMode,
        public array $audiences,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'principal audiences');
        $audiences = [];
        foreach (Fields::objects($object, 'audiences') as $audience) {
            $audiences[] = PrincipalAudience::fromPayload($audience);
        }

        return new self(Fields::string($object, 'audienceEntitlementMode'), $audiences);
    }
}
