<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

/**
 * PrivacyErasureForceResponse is the erasure request after a force, with the safe next action the server names
 * when the force could not run (retry or cancel, and its code).
 */
final readonly class PrivacyErasureForceResponse
{
    public function __construct(
        public ?PrivacyErasureResponse $request = null,
        public ?string $safeNextAction = null,
        public ?string $safeNextActionCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $request = Fields::optionalObject($payload, 'request');

        return new self(
            $request === null ? null : PrivacyErasureResponse::fromPayload($request),
            Fields::optionalString($payload, 'safe_next_action'),
            Fields::optionalString($payload, 'safe_next_action_code'),
        );
    }
}
