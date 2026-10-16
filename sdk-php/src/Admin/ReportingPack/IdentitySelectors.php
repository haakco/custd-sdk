<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** IdentitySelectors names the optional identity selectors a pack declares. */
final readonly class IdentitySelectors
{
    public function __construct(
        public ?SelectorDefinition $subject = null,
        public ?SelectorDefinition $session = null,
        public ?SelectorDefinition $entity = null,
        public ?SelectorDefinition $cohort = null,
        public ?SelectorDefinition $correlation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $read = static function (\stdClass $source, string $key): ?SelectorDefinition {
            $value = Fields::optionalObject($source, $key);

            return $value === null ? null : SelectorDefinition::fromPayload($value);
        };

        return new self(
            $read($payload, 'subject'),
            $read($payload, 'session'),
            $read($payload, 'entity'),
            $read($payload, 'cohort'),
            $read($payload, 'correlation'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [];
        foreach (['subject' => $this->subject, 'session' => $this->session, 'entity' => $this->entity, 'cohort' => $this->cohort, 'correlation' => $this->correlation] as $key => $value) {
            if ($value !== null) {
                $payload[$key] = $value->serialise();
            }
        }

        return $payload;
    }
}
