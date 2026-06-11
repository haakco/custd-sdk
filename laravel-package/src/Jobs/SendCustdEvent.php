<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Jobs;

use HaakCo\Custd\CustdClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

final class SendCustdEvent implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;

    public int $tries;
    public int $backoff;

    /**
     * @param array<string, mixed> $event
     */
    public function __construct(private readonly array $event)
    {
        $this->tries = (int) config("custd.job.tries", 3);
        $this->backoff = (int) config("custd.job.backoff", 10);
    }

    public function handle(CustdClient $client): void
    {
        $client->track($this->event);
    }
}
