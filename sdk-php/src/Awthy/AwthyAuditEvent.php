<?php

declare(strict_types=1);

namespace HaakCo\Custd\Awthy;

final class AwthyAuditEvent
{
    private const EVENT_TYPE_SLUG = "awthy.audit_event";
    private const SCHEMA_VERSION = "1.0.0";
    private const SECRET_KEYS = [
        "email",
        "raw_ip",
        "user_agent",
        "token",
        "recovery_code",
        "totp_secret",
        "passkey_credential_id",
        "oauth_token",
        "payment_card",
        "payment_token",
    ];
    private const REQUIRED_PAYLOAD_FIELDS = [
        "storeHostnameHash",
        "localAuditEventId",
        "localAuditEventUuid",
        "eventType",
        "actor",
        "action",
        "target",
        "outcome",
        "source",
        "reasonCategory",
        "stream",
        "severity",
        "occurredAt",
    ];

    /** @var array<string, mixed> */
    private array $event;

    /**
     * @param array<string, mixed> $event
     */
    private function __construct(array $event)
    {
        $this->event = $event;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(string $companySlug, string $storeId, array $payload): self
    {
        self::assertNonEmpty($companySlug, "companySlug");
        self::assertNonEmpty($storeId, "storeId");
        self::assertRequiredPayloadFields($payload);
        self::assertNoSecretKeys($payload);

        $payload["sourceSystem"] = "awthy";
        $payload["schemaVersion"] = self::SCHEMA_VERSION;
        $payload["storeId"] = $storeId;
        $payload["sanitizedContext"] = $payload["sanitizedContext"] ?? [];
        $payload["targets"] = $payload["targets"] ?? [];
        $payload["correlations"] = $payload["correlations"] ?? [];

        return new self([
            "eventTypeSlug" => self::EVENT_TYPE_SLUG,
            "schemaVersion" => self::SCHEMA_VERSION,
            "timestamp" => (string) $payload["occurredAt"],
            "companySlug" => $companySlug,
            "context" => [
                "device" => [
                    "type" => "server",
                ],
            ],
            "payload" => $payload,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->event;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertRequiredPayloadFields(array $payload): void
    {
        $missing = [];
        foreach (self::REQUIRED_PAYLOAD_FIELDS as $field) {
            if (!array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === "") {
                $missing[] = $field;
            }
        }

        if ($missing !== []) {
            throw new \InvalidArgumentException("custd: missing Awthy audit fields: " . implode(", ", $missing));
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertNoSecretKeys(array $payload): void
    {
        foreach ($payload as $key => $value) {
            $normalizedKey = strtolower((string) $key);
            if (in_array($normalizedKey, self::SECRET_KEYS, true)) {
                throw new \InvalidArgumentException("custd: Awthy audit payload contains forbidden key: {$key}");
            }

            if (is_array($value)) {
                self::assertNoSecretKeys($value);
            }
        }
    }

    private static function assertNonEmpty(string $value, string $field): void
    {
        if ($value === "") {
            throw new \InvalidArgumentException("custd: {$field} is required");
        }
    }
}
