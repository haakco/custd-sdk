<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

final readonly class DeliveryRequest
{
    public function __construct(public string $url, public string $body)
    {
    }
}
