<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

/** One envelope delivery: the HTTP method, the envelope URL and the envelope body. */
final readonly class DeliveryRequest
{
    public const METHOD = 'POST';

    public string $method;

    public function __construct(public string $url, public string $body)
    {
        $this->method = self::METHOD;
    }
}
