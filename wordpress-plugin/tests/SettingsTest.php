<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress\Tests;

use HaakCo\Custd\WordPress\Settings;
use PHPUnit\Framework\TestCase;

final class SettingsTest extends TestCase
{
    public function testSettingsSanitizeExternalInputAndKeepSecretsOutOfArray(): void
    {
        $settings = Settings::fromArray([
            "base_url" => " https://custd.com/ ",
            "company_slug" => " Acme Store! ",
            "environment" => " Production Site ",
            "enabled" => "1",
            "token" => " static-token ",
            "oauth_client_id" => " wp-client ",
            "oauth_client_secret" => " oauth-secret ",
            "oauth_token_url" => " https://auth.custd.com/oauth2/token ",
            "oauth_audience" => " custd ",
            "oauth_scopes" => " events.write, managed-audit.write ",
        ]);

        $this->assertTrue($settings->enabled());
        $this->assertSame("https://custd.com", $settings->baseUrl());
        $this->assertSame("acme-store", $settings->companySlug());
        $this->assertSame("production-site", $settings->environment());
        $this->assertSame(["events.write", "managed-audit.write"], $settings->oauthScopes());
        $this->assertArrayNotHasKey("token", $settings->toPublicArray());
        $this->assertArrayNotHasKey("oauth_client_secret", $settings->toPublicArray());
        $this->assertArrayNotHasKey("batch_max_size", $settings->toPublicArray());
        $this->assertArrayNotHasKey("queue_enabled", $settings->toPublicArray());
        $this->assertArrayNotHasKey("queue_max_size", $settings->toPublicArray());
    }

    public function testSettingsLoadSdkSetupWordPressEnvironmentBlock(): void
    {
        $settings = Settings::fromEnvironment([
            "CUSTD_WP_BASE_URL" => "http://localhost:8080",
            "CUSTD_WP_OAUTH_CLIENT_ID" => "wp-client",
            "CUSTD_WP_OAUTH_CLIENT_SECRET" => "secret",
            "CUSTD_WP_OAUTH_TOKEN_URL" => "http://localhost:4444/oauth2/token",
            "CUSTD_WP_OAUTH_AUDIENCE" => "custd",
            "CUSTD_WP_OAUTH_SCOPES" => "events.write",
            "CUSTD_WP_TENANT_SLUG" => "acme",
            "CUSTD_WP_ENVIRONMENT" => "staging",
            "CUSTD_WP_ENABLED" => "true",
        ]);

        $this->assertTrue($settings->enabled());
        $this->assertSame("http://localhost:8080", $settings->baseUrl());
        $this->assertSame("acme", $settings->companySlug());
        $this->assertSame("staging", $settings->environment());
        $this->assertSame("wp-client", $settings->oauthClientId());
        $this->assertSame("secret", $settings->oauthClientSecret());
    }

    public function testWordPressOptionsOverrideEnvironmentWithoutDroppingSecrets(): void
    {
        $settings = Settings::fromWordPressOptions(
            ["company_slug" => "override-store"],
            [
                "CUSTD_WP_BASE_URL" => "http://localhost:8080",
                "CUSTD_WP_OAUTH_CLIENT_ID" => "wp-client",
                "CUSTD_WP_OAUTH_CLIENT_SECRET" => "secret",
                "CUSTD_WP_OAUTH_TOKEN_URL" => "http://localhost:4444/oauth2/token",
                "CUSTD_WP_TENANT_SLUG" => "env-store",
                "CUSTD_WP_ENABLED" => "true",
            ],
        );

        $this->assertSame("override-store", $settings->companySlug());
        $this->assertSame("secret", $settings->oauthClientSecret());
    }
}
