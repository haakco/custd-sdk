<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests\Admin;

/**
 * AdminTransportRecorder holds a test transport's response queue and the calls it saw, shared by
 * reference between the transport closure and the test.
 */
final class AdminTransportRecorder
{
    /** @var array<int, array{method:string, url:string, body:mixed, token:string, headers:array<string, string>}> */
    public array $calls = [];

    /** @param list<array{0: string, 1: string, 2?: array<string, string>}> $queue */
    public function __construct(public array $queue)
    {
    }
}
