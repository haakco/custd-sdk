<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress;

final class Plugin
{
    /**
     * @param callable|CustdClientFactory $clientFactory
     * @param array<string, callable> $wordpress
     */
    public function __construct(
        private readonly Settings $settings,
        private readonly mixed $clientFactory = new CustdClientFactory(),
        private readonly array $wordpress = [],
    ) {
    }

    public function register(): void
    {
        $this->addAction("wp_login", [$this, "recordLogin"], 10, 2);
        $this->addAction("user_register", [$this, "recordUserRegister"], 10, 1);
        $this->addAction("transition_post_status", [$this, "recordPostStatusTransition"], 10, 3);
        $this->addAction("custd_heartbeat", [$this, "recordHeartbeat"], 10, 0);
        $this->addAction("admin_init", [$this, "registerSettings"], 10, 0);
    }

    public function registerSettings(): void
    {
        $registerSetting = $this->wordpress["register_setting"] ?? null;
        $args = [
            "type" => "array",
            "sanitize_callback" => [Settings::class, "sanitizeOptionArray"],
            "default" => [],
        ];
        if (is_callable($registerSetting)) {
            $registerSetting("custd", "custd_settings", $args);
            return;
        }
        if (function_exists("register_setting")) {
            register_setting("custd", "custd_settings", $args);
        }
    }

    public function recordLogin(string $login, mixed $user): void
    {
        $this->track("wordpress.user_login", [
            "wordpressUserId" => $this->userId($user),
            "roles" => $this->userRoles($user),
        ]);
    }

    public function recordUserRegister(int $wordpressUserId): void
    {
        $this->track("wordpress.user_register", ["wordpressUserId" => $wordpressUserId]);
    }

    public function recordPostStatusTransition(string $newStatus, string $oldStatus, mixed $post): void
    {
        $this->track("wordpress.post_status_transition", [
            "postId" => $this->postId($post),
            "postType" => $this->postType($post),
            "oldStatus" => $oldStatus,
            "newStatus" => $newStatus,
        ]);
    }

    public function recordHeartbeat(): void
    {
        $this->track("wordpress.plugin_heartbeat", ["status" => "ok"]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function track(string $eventTypeSlug, array $payload): void
    {
        if (!$this->settings->enabled() || $this->settings->companySlug() === "") {
            return;
        }

        $client = $this->client();
        $payload["environment"] = $this->settings->environment();
        $client->track([
            "eventTypeSlug" => $eventTypeSlug,
            "schemaVersion" => "1.0.0",
            "timestamp" => gmdate("Y-m-d\\TH:i:s\\Z"),
            "companySlug" => $this->settings->companySlug(),
            "context" => ["device" => ["type" => "server"]],
            "payload" => $payload,
        ]);
    }

    private function addAction(string $hook, callable $callback, int $priority, int $acceptedArgs): void
    {
        $addAction = $this->wordpress["add_action"] ?? null;
        if (is_callable($addAction)) {
            $addAction($hook, $callback, $priority, $acceptedArgs);
            return;
        }
        if (function_exists("add_action")) {
            add_action($hook, $callback, $priority, $acceptedArgs);
        }
    }

    private function client(): object
    {
        if (is_callable($this->clientFactory)) {
            return ($this->clientFactory)($this->settings);
        }
        return $this->clientFactory->create($this->settings);
    }

    private function userId(mixed $user): int
    {
        $userId = $this->wordpress["user_id"] ?? null;
        if (is_callable($userId)) {
            return (int) $userId($user);
        }
        return (int) ($user->ID ?? 0);
    }

    /**
     * @return array<int, string>
     */
    private function userRoles(mixed $user): array
    {
        $userRoles = $this->wordpress["user_roles"] ?? null;
        if (is_callable($userRoles)) {
            return array_values($userRoles($user));
        }
        return array_values($user->roles ?? []);
    }

    private function postId(mixed $post): int
    {
        return (int) ($post->ID ?? 0);
    }

    private function postType(mixed $post): string
    {
        return (string) ($post->post_type ?? "");
    }

}
