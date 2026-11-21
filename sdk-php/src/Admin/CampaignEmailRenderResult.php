<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class CampaignEmailRenderResult
{
    public function __construct(
        public readonly string $companyUuid,
        public readonly string $subject,
        public readonly string $html,
        public readonly string $text,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        foreach (['companyUuid', 'subject', 'html', 'text'] as $field) {
            if (!is_string($payload[$field] ?? null) || $payload[$field] === '') {
                throw new \UnexpectedValueException('Campaign email render response lacks ' . $field);
            }
        }

        return new self($payload['companyUuid'], $payload['subject'], $payload['html'], $payload['text']);
    }
}
