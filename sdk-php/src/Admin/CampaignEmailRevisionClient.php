<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class CampaignEmailRevisionClient
{
    /** @var string|callable():string */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport,
    ) {
        $this->token = $token;
    }

    /**
     * Render the SHA-256 revision published in the bearer credential's tenant without sending.
     *
     * @param array<string, string> $slots
     */
    public function render(string $revision, array $slots): CampaignEmailRenderResult
    {
        if (preg_match('/\A[a-f0-9]{64}\z/', $revision) !== 1) {
            throw new \InvalidArgumentException('Campaign email revision must be a lowercase SHA-256 digest');
        }

        return CampaignEmailRenderResult::fromPayload(Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'POST',
            '/campaign-email-revisions/' . $revision . '/render',
            ['slots' => (object) $slots],
        ) ?? []);
    }
}
