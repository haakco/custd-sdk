<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingQueryDocument is a query the caller already holds as JSON, such as one saved from the console or
 * built by another tool. It is sent byte for byte, so nothing the server accepts is lost in translation;
 * ReportingQueryRequest is the typed builder for the same request.
 */
final readonly class ReportingQueryDocument
{
    private function __construct(public string $json)
    {
    }

    /** @throws \InvalidArgumentException when the text is not one JSON object. */
    public static function fromJson(string $json): self
    {
        try {
            $decoded = json_decode($json, false, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $error) {
            throw new \InvalidArgumentException('custd: reporting query document must be JSON', 0, $error);
        }
        if (!$decoded instanceof \stdClass) {
            throw new \InvalidArgumentException('custd: reporting query document must be a JSON object');
        }

        return new self($json);
    }
}
