<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress;

use HaakCo\Custd\CustdClient;

final class CustdClientFactory
{
    public function create(Settings $settings): CustdClient
    {
        return new CustdClient(
            $settings->baseUrl(),
            $this->token($settings),
            $this->options($settings),
        );
    }

    private function token(Settings $settings): ?string
    {
        return $settings->token() !== "" ? $settings->token() : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function options(Settings $settings): array
    {
        return array_filter([
            "oauth" => $this->oauthOptions($settings),
        ], static fn (?array $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function oauthOptions(Settings $settings): ?array
    {
        if ($settings->oauthClientId() === "") {
            return null;
        }

        return [
            "client_id" => $settings->oauthClientId(),
            "client_secret" => $settings->oauthClientSecret(),
            "token_url" => $settings->oauthTokenUrl(),
            "audience" => $settings->oauthAudience(),
            "scopes" => $settings->oauthScopes(),
        ];
    }
}
