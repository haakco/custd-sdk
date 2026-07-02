<?php

declare(strict_types=1);

namespace HaakCo\Custd\Awthy;

final class AwthyAuditEvent
{
    private const EVENT_TYPE_SLUG = "awthy-audit-event";
    private const SCHEMA_VERSION = "1.1.0";
    private const SHA256_HASH_PATTERN = '/^sha256:[a-f0-9]{64}$/';
    private const SECRET_KEYS = [
        "apikey",
        "authorization",
        "billingemail",
        "clientsecret",
        "customeremail",
        "email",
        "oauthcode",
        "oauthtoken",
        "ordernumber",
        "passkeycredentialid",
        "password",
        "paymentcard",
        "paymentgateway",
        "paymenttoken",
        "providercredential",
        "rawapiresponse",
        "rawip",
        "recoverycode",
        "signedurl",
        "token",
        "totpsecret",
        "useragent",
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
    private const REPORTING_PAYLOAD_FIELDS = [
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
        "correlationId",
        "occurredAt",
        "flow",
        "woocommerce",
        "sanitizedContext",
        "targets",
        "correlations",
        "redacted",
        "redactionId",
        "redactionReason",
    ];
    private const REPORTING_ACTOR_FIELDS = ["type", "wordpressUserIdHash", "anonymized"];
    private const REPORTING_TARGET_FIELDS = ["type", "referenceHash", "anonymized"];
    private const REPORTING_FLOW_FIELDS = ["family", "step", "correlationHash", "sequence"];
    private const REPORTING_FLOW_FAMILIES = ["secure_checkout", "account_security", "store_operations_risk"];
    private const REPORTING_WOOCOMMERCE_FIELDS = ["checkoutFlow", "orderStatus", "paymentGatewayHash", "cartHash"];
    private const REPORTING_REFERENCE_FIELDS = ["type", "referenceHash"];

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
        self::assertOptionalObject($payload, "flow");
        self::assertOptionalObject($payload, "woocommerce");
        self::assertReportingSectionsShape($payload);
        self::assertHashFields($payload);

        return self::fromValidatedPayload($companySlug, $storeId, $payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function managedReportingPayload(string $companySlug, string $storeId, array $payload): self
    {
        self::assertNonEmpty($companySlug, "companySlug");
        self::assertNonEmpty($storeId, "storeId");
        self::assertRequiredPayloadFields($payload);
        self::assertNoSecretKeys($payload);
        self::assertOptionalObject($payload, "flow");
        self::assertOptionalObject($payload, "woocommerce");
        self::assertReportingPayloadShape($payload);
        self::assertHashFields($payload);

        return self::fromValidatedPayload($companySlug, $storeId, $payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function fromValidatedPayload(string $companySlug, string $storeId, array $payload): self
    {
        $payload = [
            "sourceSystem" => "awthy",
            "schemaVersion" => self::SCHEMA_VERSION,
            "storeId" => $storeId,
        ] + $payload;
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
     * @param array<string, mixed> $payload
     */
    private static function assertOptionalObject(array $payload, string $field): void
    {
        if (!array_key_exists($field, $payload)) {
            return;
        }
        if (!is_array($payload[$field]) || (array_is_list($payload[$field]) && $payload[$field] !== [])) {
            throw new \InvalidArgumentException("custd: Awthy audit {$field} must be an object");
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertReportingPayloadShape(array $payload): void
    {
        self::assertAllowedKeys($payload, self::REPORTING_PAYLOAD_FIELDS, "payload");
        self::assertAllowedObjectKeys($payload, "actor", self::REPORTING_ACTOR_FIELDS);
        self::assertAllowedObjectKeys($payload, "target", self::REPORTING_TARGET_FIELDS);
        self::assertAllowedObjectKeys($payload, "flow", self::REPORTING_FLOW_FIELDS);
        self::assertAllowedFlowFamily($payload);
        self::assertAllowedObjectKeys($payload, "woocommerce", self::REPORTING_WOOCOMMERCE_FIELDS);
        self::assertAllowedObjectKeys($payload, "sanitizedContext", []);
        self::assertAllowedObjectListKeys($payload, "targets", self::REPORTING_REFERENCE_FIELDS);
        self::assertAllowedObjectListKeys($payload, "correlations", self::REPORTING_REFERENCE_FIELDS);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertReportingSectionsShape(array $payload): void
    {
        if (!array_key_exists("flow", $payload) && !array_key_exists("woocommerce", $payload)) {
            return;
        }
        self::assertAllowedObjectKeys($payload, "flow", self::REPORTING_FLOW_FIELDS);
        self::assertAllowedFlowFamily($payload);
        self::assertAllowedObjectKeys($payload, "woocommerce", self::REPORTING_WOOCOMMERCE_FIELDS);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertHashFields(array $payload): void
    {
        self::assertHashField($payload, "storeHostnameHash");
        self::assertNestedHashField($payload, "actor", "wordpressUserIdHash");
        self::assertRequiredNestedHashField($payload, "target", "referenceHash");
        self::assertNestedHashField($payload, "flow", "correlationHash");
        self::assertNestedHashField($payload, "woocommerce", "paymentGatewayHash");
        self::assertNestedHashField($payload, "woocommerce", "cartHash");
        self::assertListHashField($payload, "targets", "referenceHash");
        self::assertListHashField($payload, "correlations", "referenceHash");
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertNestedHashField(array $payload, string $section, string $field): void
    {
        if (!array_key_exists($section, $payload) || !is_array($payload[$section]) || array_is_list($payload[$section])) {
            return;
        }
        self::assertHashField($payload[$section], $field, "{$section}.{$field}");
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertRequiredNestedHashField(array $payload, string $section, string $field): void
    {
        if (!array_key_exists($section, $payload) || !is_array($payload[$section]) || array_is_list($payload[$section])) {
            return;
        }
        if (!array_key_exists($field, $payload[$section])) {
            throw new \InvalidArgumentException("custd: Awthy audit {$section}.{$field} must be a sha256 hash");
        }
        self::assertHashField($payload[$section], $field, "{$section}.{$field}");
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertListHashField(array $payload, string $section, string $field): void
    {
        if (!array_key_exists($section, $payload) || !is_array($payload[$section]) || !array_is_list($payload[$section])) {
            return;
        }
        foreach ($payload[$section] as $index => $item) {
            if (is_array($item) && !array_is_list($item)) {
                self::assertHashField($item, $field, "{$section}[{$index}].{$field}");
            }
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertHashField(array $payload, string $field, ?string $path = null): void
    {
        if (!array_key_exists($field, $payload)) {
            return;
        }
        $value = $payload[$field];
        if (!is_string($value) || preg_match(self::SHA256_HASH_PATTERN, $value) !== 1) {
            $fieldPath = $path ?? $field;
            throw new \InvalidArgumentException("custd: Awthy audit {$fieldPath} must be a sha256 hash");
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @param list<string> $allowedKeys
     */
    private static function assertAllowedObjectKeys(array $payload, string $field, array $allowedKeys): void
    {
        if (!array_key_exists($field, $payload)) {
            return;
        }
        if (!is_array($payload[$field]) || (array_is_list($payload[$field]) && $payload[$field] !== [])) {
            throw new \InvalidArgumentException("custd: Awthy audit {$field} must be an object");
        }
        self::assertAllowedKeys($payload[$field], $allowedKeys, $field);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function assertAllowedFlowFamily(array $payload): void
    {
        if (!array_key_exists("flow", $payload) || !is_array($payload["flow"]) || array_is_list($payload["flow"])) {
            return;
        }
        if (!array_key_exists("family", $payload["flow"])) {
            return;
        }
        if (!is_string($payload["flow"]["family"]) || !in_array($payload["flow"]["family"], self::REPORTING_FLOW_FAMILIES, true)) {
            throw new \InvalidArgumentException("custd: unexpected Awthy reporting field flow.family");
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @param list<string> $allowedKeys
     */
    private static function assertAllowedObjectListKeys(array $payload, string $field, array $allowedKeys): void
    {
        if (!array_key_exists($field, $payload)) {
            return;
        }
        if (!is_array($payload[$field]) || !array_is_list($payload[$field])) {
            throw new \InvalidArgumentException("custd: Awthy audit {$field} must be a list");
        }
        foreach ($payload[$field] as $index => $item) {
            if (!is_array($item) || array_is_list($item)) {
                throw new \InvalidArgumentException("custd: Awthy audit {$field}[{$index}] must be an object");
            }
            self::assertAllowedKeys($item, $allowedKeys, "{$field}[{$index}]");
        }
    }

    /**
     * @param array<string, mixed> $value
     * @param list<string> $allowedKeys
     */
    private static function assertAllowedKeys(array $value, array $allowedKeys, string $path): void
    {
        foreach ($value as $key => $_) {
            if (!is_string($key) || !in_array($key, $allowedKeys, true)) {
                throw new \InvalidArgumentException("custd: unexpected Awthy reporting field {$path}.{$key}");
            }
        }
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
            $normalizedKey = self::normalizedPayloadKey((string) $key);
            if (in_array($normalizedKey, self::SECRET_KEYS, true)) {
                throw new \InvalidArgumentException("custd: Awthy audit payload contains forbidden key: {$key}");
            }

            if (is_array($value)) {
                self::assertNoSecretKeys($value);
            }
        }
    }

    private static function normalizedPayloadKey(string $key): string
    {
        return strtolower((string) preg_replace('/[^a-zA-Z0-9]+/', "", $key));
    }

    private static function assertNonEmpty(string $value, string $field): void
    {
        if ($value === "") {
            throw new \InvalidArgumentException("custd: {$field} is required");
        }
    }
}
