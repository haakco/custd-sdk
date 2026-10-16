<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\Fields;

/**
 * Client owns the tenant parser routes served by the schema registry: the
 * built-in preset catalog, tenant-owned parser CRUD, and the bounded dry-run
 * preview.
 *
 * The routes are authenticated by the caller's tenant credential, so no tenant
 * slug is ever supplied. Every method returns a named typed DTO, never a bare
 * array. The shared {@see Http} owner performs the request, so no parser-specific
 * transport exists.
 */
final class Client
{
    /** The tenant API prefix the schema-registry routes are served under. */
    private const PREFIX = "/api/v1";

    /** @var callable|null */
    private $transport;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        ?callable $transport = null
    ) {
        $this->transport = $transport;
    }

    /** List the built-in reusable parser catalog. */
    public function listPresets(): ParserPresetList
    {
        return ParserPresetList::fromPayload(
            Fields::jsonObject($this->send("GET", "/parsers/presets"), "parser presets response")
        );
    }

    /** List this tenant's own parsers, wrapped in the named ParserList DTO. */
    public function list(): ParserList
    {
        $payload = $this->send("GET", "/parsers");
        if (!is_array($payload) || !array_is_list($payload)) {
            throw new \UnexpectedValueException("custd: parser list response must be a JSON array");
        }

        return ParserList::fromPayloadList($payload);
    }

    /** Create a tenant-owned parser. */
    public function create(SaveParserRequest $request): ParserDefinition
    {
        return ParserDefinition::fromPayload(
            Fields::jsonObject($this->send("POST", "/parsers", $request->serialise()), "parser response")
        );
    }

    /** Replace a tenant-owned parser addressed by its explicit UUID. */
    public function update(string $uuid, SaveParserRequest $request): ParserDefinition
    {
        return ParserDefinition::fromPayload(
            Fields::jsonObject(
                $this->send("PUT", "/parsers/" . rawurlencode($uuid), $request->serialise()),
                "parser response"
            )
        );
    }

    /** Delete a tenant-owned parser addressed by its explicit UUID. */
    public function delete(string $uuid): ParserDeleteResponse
    {
        return ParserDeleteResponse::fromPayload(
            Fields::jsonObject($this->send("DELETE", "/parsers/" . rawurlencode($uuid)), "parser delete response")
        );
    }

    /** Run a parser definition against a bounded sample. Writes and retains nothing. */
    public function preview(ParserPreviewRequest $request): ParserPreviewResult
    {
        return ParserPreviewResult::fromPayload(
            Fields::jsonObject($this->send("POST", "/parser-preview", $request->serialise()), "parser preview response")
        );
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function send(string $method, string $path, ?array $body = null): mixed
    {
        return Http::requestStructured(
            $this->baseUrl,
            $this->token,
            $this->transport,
            $method,
            $path,
            $body,
            self::PREFIX
        );
    }
}
