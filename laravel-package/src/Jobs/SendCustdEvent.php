<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Jobs;

use HaakCo\Custd\CustdClient;
use Illuminate\Contracts\Queue\ShouldQueue;

final class SendCustdEvent implements ShouldQueue
{
    /**
     * @param array<string, mixed> $event
     */
    public function __construct(private readonly array $event)
    {
    }

    public function handle(CustdClient $client): void
    {
        $client->track($this->event);
    }
}
