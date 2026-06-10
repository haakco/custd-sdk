<?php

declare(strict_types=1);

namespace HaakCo\Custd\Awthy;

final class AwthyAuditRedactionRequest
{
    private const ALLOWED_FIELDS = ["actor", "target", "sanitizedContext"];

    /** @var array<string, mixed> */
    private array $request;

    /**
     * @param array<string, mixed> $request
     */
    private function __construct(array $request)
    {
        $this->request = $request;
    }

    /**
     * @param array<string, mixed> $input
     */
    public static function fromArray(string $storeId, array $input): self
    {
        self::assertNonEmpty($storeId, "storeId");
        self::assertNonEmpty((string) ($input["redactionId"] ?? ""), "redactionId");
        self::assertNonEmpty((string) ($input["reason"] ?? ""), "reason");

        $events = $input["events"] ?? null;
        if (!is_array($events) || $events === []) {
            throw new \InvalidArgumentException("custd: redaction events are required");
        }

        return new self([
            "sourceSystem" => "awthy",
            "storeId" => $storeId,
            "redactionId" => (string) $input["redactionId"],
            "reason" => (string) $input["reason"],
            "events" => self::normalizeEvents($events),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->request;
    }

    /**
     * @param array<int, mixed> $events
     * @return array<int, array<string, mixed>>
     */
    private static function normalizeEvents(array $events): array
    {
        $normalized = [];
        foreach ($events as $event) {
            if (!is_array($event)) {
                throw new \InvalidArgumentException("custd: redaction event must be an object");
            }

            $localAuditEventId = (string) ($event["localAuditEventId"] ?? "");
            $localAuditEventUuid = (string) ($event["localAuditEventUuid"] ?? "");
            if ($localAuditEventId === "" && $localAuditEventUuid === "") {
                throw new \InvalidArgumentException(
                    "custd: redaction event requires localAuditEventId or localAuditEventUuid"
                );
            }

            $fields = $event["fields"] ?? null;
            if (!is_array($fields) || $fields === []) {
                throw new \InvalidArgumentException("custd: redaction event fields are required");
            }

            $normalizedEvent = [
                "fields" => self::normalizeFields($fields),
            ];
            if ($localAuditEventId !== "") {
                $normalizedEvent["localAuditEventId"] = $localAuditEventId;
            }
            if ($localAuditEventUuid !== "") {
                $normalizedEvent["localAuditEventUuid"] = $localAuditEventUuid;
            }

            $normalized[] = $normalizedEvent;
        }

        return $normalized;
    }

    /**
     * @param array<int, mixed> $fields
     * @return array<int, string>
     */
    private static function normalizeFields(array $fields): array
    {
        $normalized = [];
        foreach ($fields as $field) {
            if (!is_string($field) || !in_array($field, self::ALLOWED_FIELDS, true)) {
                throw new \InvalidArgumentException("custd: unsupported redaction field");
            }
            $normalized[] = $field;
        }

        return array_values(array_unique($normalized));
    }

    private static function assertNonEmpty(string $value, string $field): void
    {
        if ($value === "") {
            throw new \InvalidArgumentException("custd: {$field} is required");
        }
    }
}
