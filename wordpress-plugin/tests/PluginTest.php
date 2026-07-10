<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress\Tests;

use HaakCo\Custd\WordPress\Plugin;
use HaakCo\Custd\WordPress\Settings;
use PHPUnit\Framework\TestCase;

final class PluginTest extends TestCase
{
    public function testRegisterAddsExpectedWordPressHooks(): void
    {
        $registered = [];
        $plugin = new Plugin($this->settings(), $this->fakeClientFactory(), [
            "add_action" => function (string $hook, callable $callback, int $priority, int $acceptedArgs) use (&$registered): void {
                $registered[] = compact("hook", "priority", "acceptedArgs");
                $this->assertIsCallable($callback);
            },
        ]);

        $plugin->register();

        $this->assertSame([
            ["hook" => "wp_login", "priority" => 10, "acceptedArgs" => 2],
            ["hook" => "user_register", "priority" => 10, "acceptedArgs" => 1],
            ["hook" => "transition_post_status", "priority" => 10, "acceptedArgs" => 3],
            ["hook" => "custd_heartbeat", "priority" => 10, "acceptedArgs" => 0],
            ["hook" => "admin_init", "priority" => 10, "acceptedArgs" => 0],
        ], $registered);
    }

    public function testRegisterSettingsRegistersSanitizedOption(): void
    {
        $registered = [];
        $plugin = new Plugin($this->settings(), $this->fakeClientFactory(), [
            "register_setting" => function (string $group, string $name, array $args) use (&$registered): void {
                $registered = compact("group", "name", "args");
            },
        ]);

        $plugin->registerSettings();

        $this->assertSame("custd", $registered["group"]);
        $this->assertSame("custd_settings", $registered["name"]);
        $sanitized = $registered["args"]["sanitize_callback"]([
            "base_url" => " https://custd.com/ ",
            "company_slug" => " Acme Store! ",
            "token" => " token ",
        ]);
        $this->assertSame("https://custd.com", $sanitized["base_url"]);
        $this->assertSame("acme-store", $sanitized["company_slug"]);
        $this->assertSame("token", $sanitized["token"]);
    }

    public function testLoginEventUsesSharedClientAndRedactsEmail(): void
    {
        $sent = [];
        $plugin = new Plugin($this->settings(), $this->fakeClientFactory($sent), [
            "user_id" => static fn (object $user): int => (int) $user->ID,
            "user_roles" => static fn (object $user): array => $user->roles,
        ]);

        $plugin->recordLogin("tim@example.com", (object) [
            "ID" => 42,
            "user_email" => "tim@example.com",
            "roles" => ["administrator"],
        ]);

        $this->assertSame("wordpress.user_login", $sent[0]["eventTypeSlug"]);
        $this->assertSame("acme", $sent[0]["companySlug"]);
        $this->assertSame("production", $sent[0]["payload"]["environment"]);
        $this->assertSame(42, $sent[0]["payload"]["wordpressUserId"]);
        $this->assertSame(["administrator"], $sent[0]["payload"]["roles"]);
        $this->assertArrayNotHasKey("email", $sent[0]["payload"]);
        $this->assertArrayNotHasKey("loginHash", $sent[0]["payload"]);
        $this->assertStringNotContainsString("tim@example.com", json_encode($sent[0], JSON_THROW_ON_ERROR));
    }

    public function testDisabledPluginDoesNotSendEvents(): void
    {
        $sent = [];
        $plugin = new Plugin(Settings::fromArray(["enabled" => false]), $this->fakeClientFactory($sent));

        $plugin->recordHeartbeat();

        $this->assertSame([], $sent);
    }

    private function settings(): Settings
    {
        return Settings::fromArray([
            "enabled" => true,
            "base_url" => "http://localhost:8080",
            "token" => "token",
            "company_slug" => "acme",
            "environment" => "production",
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $sent
     */
    private function fakeClientFactory(array &$sent = []): callable
    {
        return static function () use (&$sent): object {
            return new class ($sent) {
                /** @var array<int, array<string, mixed>> */
                private array $events = [];

                /**
                 * @param array<int, array<string, mixed>> $sent
                 */
                public function __construct(private array &$sent)
                {
                }

                /**
                 * @param array<string, mixed> $event
                 */
                public function track(array $event): void
                {
                    $this->events[] = $event;
                    $this->sent = $this->events;
                }
            };
        };
    }
}
