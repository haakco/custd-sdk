<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * ReconcileResult reports what one declaration changed.
 *
 * The outcome is part of the contract, not decoration: `created` says whether the
 * tenant had this workflow at all, and `revisionChanged` says whether the declared
 * shape moved to a new forward-only revision. A consumer that discards them cannot
 * tell a no-op redeploy from a shape change, which is the difference between a
 * stable duration series and one that just forked.
 */
final readonly class ReconcileResult
{
    public function __construct(
        public Definition $definition = new Definition(),
        public bool $created = false,
        public bool $revisionChanged = false,
    ) {
    }

    /** wasNoOp reports whether the declaration matched the stored shape exactly. */
    public function wasNoOp(): bool
    {
        return !$this->created && !$this->revisionChanged;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Definition::fromPayload(Payload::object($payload, 'definition')),
            Payload::boolean($payload, 'created'),
            Payload::boolean($payload, 'revisionChanged'),
        );
    }
}
