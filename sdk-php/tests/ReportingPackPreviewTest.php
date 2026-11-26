<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\ReportingPack\ReportingPackPreviewResponse;
use PHPUnit\Framework\TestCase;

/** The preview route answers its rendered widget under `data`, beside an optional executive view. */
final class ReportingPackPreviewTest extends TestCase
{
    public function testReadsTheRenderedWidgetUnderData(): void
    {
        $value = ['value' => 42.0, 'unit' => 'count', 'sampleCount' => 42, 'dataSufficiency' => 'sufficient', 'complete' => true];
        $response = ReportingPackPreviewResponse::fromPayload(json_decode((string) json_encode([
            'data' => [
                'buckets' => [['date' => '2026-11-24', 'value' => $value, 'source' => 'segments', 'queryDurationMs' => 3]],
                'value' => $value,
                'queryDurationMs' => 3,
                'snapshotAgeMs' => 0,
                'eventLagP95Ms' => 0,
            ],
        ]), false));

        self::assertSame(42.0, $response->data->value->value);
        self::assertCount(1, $response->data->buckets);
        self::assertNull($response->executive);
        self::assertNull($response->presentation);
    }
}
