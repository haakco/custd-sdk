<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Parsers\ParserFraming;
use HaakCo\Custd\Parsers\ParserList;
use HaakCo\Custd\Parsers\ParserPresetList;
use HaakCo\Custd\Parsers\SaveParserRequest;
use HaakCo\Custd\Parsers\ParserPreviewRequest;
use HaakCo\Custd\Parsers\ParserPreviewResult;
use PHPUnit\Framework\TestCase;

final class ParsersClientTest extends TestCase
{
    public function testListPresetsUsesTheSchemaRegistryRoute(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["presets" => [$this->preset()]], $calls);

        $presets = $client->parsers()->listPresets();

        self::assertSame(["http://localhost:8080/api/v1/parsers/presets"], array_column($calls, "url"));
        self::assertInstanceOf(ParserPresetList::class, $presets);
        self::assertSame("apache-combined", $presets->presets[0]->code);
        self::assertSame(["combined"], $presets->presets[0]->variants);
    }

    public function testListWrapsTheBareArrayResponse(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([$this->parser()], $calls);

        $list = $client->parsers()->list();

        self::assertSame(["http://localhost:8080/api/v1/parsers"], array_column($calls, "url"));
        self::assertInstanceOf(ParserList::class, $list);
        self::assertSame("nginx-combined", $list->parsers[0]->code);
        // Newer optional fields carry the server's value when present.
        self::assertTrue($list->parsers[0]->enabled);
        self::assertSame(3, $list->parsers[0]->revision);
    }

    public function testListRejectsANonArrayResponse(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["parsers" => [$this->parser()]], $calls);

        $this->expectException(\UnexpectedValueException::class);
        $client->parsers()->list();
    }

    public function testCreateOmitsUnsetEnabledAndCarriesFraming(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->parser(), $calls);

        $client->parsers()->create(new SaveParserRequest(
            code: "nginx-combined",
            name: "Nginx combined",
            parserType: "regex",
            pattern: "^\\S+",
            timestampFormat: "2006-01-02T15:04:05Z07:00",
            fieldMapping: ["client_ip" => "context.ip"],
            framing: new ParserFraming("docker-json", 262144, 200),
        ));

        self::assertSame("http://localhost:8080/api/v1/parsers", $calls[0]["url"]);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertArrayNotHasKey("enabled", $calls[0]["body"]);
        self::assertSame(
            ["type" => "docker-json", "maxRecordBytes" => 262144, "maxLines" => 200],
            $calls[0]["body"]["framing"]
        );
    }

    public function testUpdateAndDeleteAddressTheExplicitUuid(): void
    {
        $uuid = "11111111-1111-1111-1111-111111111111";

        $updateCalls = [];
        $updateClient = $this->clientWithResponse($this->parser(), $updateCalls);
        $updateClient->parsers()->update($uuid, new SaveParserRequest(
            code: "nginx-combined",
            name: "Nginx combined",
            parserType: "regex",
            pattern: "^\\S+",
            timestampFormat: "2006-01-02T15:04:05Z07:00",
            fieldMapping: [],
            enabled: false,
        ));
        self::assertSame("http://localhost:8080/api/v1/parsers/{$uuid}", $updateCalls[0]["url"]);
        self::assertSame("PUT", $updateCalls[0]["method"]);
        self::assertFalse($updateCalls[0]["body"]["enabled"]);

        $deleteCalls = [];
        $deleteClient = $this->clientWithResponse(["deleted" => true], $deleteCalls);
        $deleted = $deleteClient->parsers()->delete($uuid);
        self::assertSame("http://localhost:8080/api/v1/parsers/{$uuid}", $deleteCalls[0]["url"]);
        self::assertSame("DELETE", $deleteCalls[0]["method"]);
        self::assertTrue($deleted->deleted);
    }

    public function testPreviewCarriesTheSameFramingWithoutEnabled(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            ["results" => [["line" => 1, "ok" => true], ["line" => 2, "ok" => false, "error" => "no match"]],
             "parsed" => 1, "failed" => 1],
            $calls,
        );

        $result = $client->parsers()->preview(new ParserPreviewRequest(
            code: "php",
            name: "PHP",
            parserType: "regex",
            pattern: "^\\S+",
            timestampFormat: "2006-01-02T15:04:05Z07:00",
            fieldMapping: [],
            sample: "line",
            maxLines: 20,
            framing: new ParserFraming("php-multiline", maxLines: 200),
        ));

        self::assertSame("http://localhost:8080/api/v1/parser-preview", $calls[0]["url"]);
        self::assertSame(
            ["type" => "php-multiline", "maxLines" => 200],
            $calls[0]["body"]["parser"]["framing"]
        );
        self::assertArrayNotHasKey("enabled", $calls[0]["body"]["parser"]);
        self::assertInstanceOf(ParserPreviewResult::class, $result);
        self::assertSame(1, $result->parsed);
        self::assertSame(1, $result->failed);
        self::assertSame("no match", $result->results[1]->error);
    }

    public function testRejectsAnUnsupportedFramingType(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new ParserFraming("idle");
    }

    /**
     * @return array<string, mixed>
     */
    private function parser(): array
    {
        return [
            "uuid" => "11111111-1111-1111-1111-111111111111",
            "code" => "nginx-combined",
            "name" => "Nginx combined",
            "parserType" => "regex",
            "pattern" => "^\\S+",
            "timestampFormat" => "2006-01-02T15:04:05Z07:00",
            "fieldMapping" => ["client_ip" => "context.ip"],
            "generatedFields" => null,
            "enabled" => true,
            "revision" => 3,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function preset(): array
    {
        return [
            "code" => "apache-combined",
            "name" => "Apache combined",
            "family" => "apache",
            "description" => "Access log",
            "parserType" => "regex",
            "pattern" => "^\\S+",
            "timestampFormat" => "2006-01-02T15:04:05Z07:00",
            "fieldMapping" => ["client_ip" => "context.ip"],
            "sample" => "127.0.0.1 - -",
            "variants" => ["combined"],
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $calls
     */
    private function clientWithResponse(mixed $response, array &$calls, int $status = 200): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response, $status): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => $status, "body" => json_encode($response, JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
