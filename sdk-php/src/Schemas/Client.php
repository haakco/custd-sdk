<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\Fields;

/**
 * Client registers, reads and retires the tenant's event schemas on the schema registry's
 * /api/v1/schemas routes. The credential names the tenant, so no slug is ever supplied.
 */
final class Client
{
    private const PREFIX = '/api/v1';
    private const COLLECTION = '/schemas';

    /** @var callable|null */
    private $transport;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        ?callable $transport = null,
    ) {
        $this->token = $token;
        $this->transport = $transport;
    }

    /** List the tenant's event types. */
    public function list(): EventTypeList
    {
        return EventTypeList::fromPayloadList($this->send('GET', self::COLLECTION));
    }

    /** List one event type's schema versions. */
    public function listVersions(string $eventType): EventSchemaVersionList
    {
        return EventSchemaVersionList::fromPayloadList($this->send('GET', self::eventType($eventType) . '/versions'));
    }

    /** Read one version's JSON Schema document as stored. */
    public function get(string $eventType, string $version): EventSchemaDocument
    {
        return EventSchemaDocument::fromPayload($this->send('GET', self::version($eventType, $version)));
    }

    /** Store a schema version, creating the event type when it is new. */
    public function register(EventSchemaRegisterRequest $request): EventType
    {
        return EventType::fromPayload(
            Fields::jsonObject($this->send('POST', self::COLLECTION, $request->serialise()), 'event type response')
        );
    }

    /** Check a schema and its examples without registering anything. */
    public function validate(EventSchemaCheckRequest $request): EventSchemaCheckResult
    {
        return EventSchemaCheckResult::fromPayload($this->send('POST', self::COLLECTION . '/validate', $request->serialise()));
    }

    /** Report what registering the schema would do, without registering it. */
    public function dryRun(EventSchemaCheckRequest $request): EventSchemaCheckResult
    {
        return EventSchemaCheckResult::fromPayload($this->send('POST', self::COLLECTION . '/dry-run', $request->serialise()));
    }

    /** Propose a schema from sample events. */
    public function infer(EventSchemaInferRequest $request): EventSchemaInferResult
    {
        return EventSchemaInferResult::fromPayload($this->send('POST', self::COLLECTION . '/infer', $request->serialise()));
    }

    /** Make one version the event type's active schema. */
    public function activate(string $eventType, string $version): EventSchemaStateResult
    {
        return EventSchemaStateResult::fromPayload($this->send('POST', self::version($eventType, $version) . '/active'));
    }

    /** Let events validate against one version again. */
    public function enable(string $eventType, string $version): EventSchemaStateResult
    {
        return EventSchemaStateResult::fromPayload($this->send('PUT', self::version($eventType, $version) . '/enabled'));
    }

    /** Deprecate one version so new events no longer validate against it. */
    public function disable(string $eventType, string $version): EventSchemaStateResult
    {
        return EventSchemaStateResult::fromPayload($this->send('DELETE', self::version($eventType, $version) . '/enabled'));
    }

    /** Retire the tenant's event type. Its schemas and stored events stay readable. */
    public function disableEventType(string $eventType): EventSchemaStateResult
    {
        return EventSchemaStateResult::fromPayload($this->send('DELETE', self::eventType($eventType)));
    }

    private static function eventType(string $eventType): string
    {
        return self::COLLECTION . '/' . rawurlencode($eventType);
    }

    private static function version(string $eventType, string $version): string
    {
        return self::eventType($eventType) . '/' . rawurlencode($version);
    }

    /** @param array<string, mixed>|null $body */
    private function send(string $method, string $path, ?array $body = null): mixed
    {
        return Http::requestStructured($this->baseUrl, $this->token, $this->transport, $method, $path, $body, self::PREFIX);
    }
}
