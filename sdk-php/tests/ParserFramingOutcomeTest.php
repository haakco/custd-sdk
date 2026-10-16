<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Parsers\ParserFraming;
use HaakCo\Custd\Parsers\ParserPreviewRequest;
use PHPUnit\Framework\TestCase;

final class ParserFramingOutcomeTest extends TestCase
{
    public function testPreviewDecodesTheFramingOutcome(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            [
                "results" => [
                    ["line" => 1, "ok" => true, "framing" => "complete", "payload" => new \stdClass()],
                    ["line" => 2, "ok" => false, "framing" => "oversize", "error" => "record exceeds the framing bound"],
                ],
                "parsed" => 1,
                "failed" => 1,
            ],
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
            maxLines: 5,
            framing: new ParserFraming("php-multiline"),
        ));

        self::assertSame("complete", $result->results[0]->framing);
        self::assertSame("oversize", $result->results[1]->framing);
    }

    public function testRejectsOutOfRangeFramingBounds(): void
    {
        $cases = [
            "negative bytes" => fn () => new ParserFraming("docker-json", -1),
            "bytes above ceiling" => fn () => new ParserFraming("docker-json", ParserFraming::MAX_RECORD_BYTES + 1),
            "negative lines" => fn () => new ParserFraming("php-multiline", maxLines: -1),
            "lines above ceiling" => fn () => new ParserFraming("php-multiline", maxLines: ParserFraming::MAX_LINES + 1),
        ];
        foreach ($cases as $name => $case) {
            try {
                $case();
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    /**
     * @param array<int, array<string, mixed>> $calls
     */
    private function clientWithResponse(mixed $response, array &$calls): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => 200, "body" => json_encode($response, JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
