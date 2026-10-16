<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * Grant is one principal's grant over one explicit target and action. The wire
 * shape is identical for the grant create/revoke request and the grant list
 * response, so one DTO serves both.
 */
final readonly class Grant
{
    /** The closed data actions. */
    public const ACTIONS = ['read', 'write'];

    public function __construct(
        public PrincipalRef $principal,
        public GrantTarget $target,
        public string $action,
    ) {
        if (!in_array($this->action, self::ACTIONS, true)) {
            throw new \InvalidArgumentException(
                'custd: data scope action must be one of ' . implode(', ', self::ACTIONS)
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        return [
            'principal' => $this->principal->serialise(),
            'target' => $this->target->serialise(),
            'action' => $this->action,
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            PrincipalRef::fromPayload(Fields::object($payload, 'principal')),
            GrantTarget::fromPayload(Fields::object($payload, 'target')),
            Fields::string($payload, 'action'),
        );
    }
}
