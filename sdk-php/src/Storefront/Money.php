<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Money
{
    public function __construct(
        public string $currency,
        public string $amountMinor,
    ) {
        if (preg_match('/^[A-Z]{3}$/D', $currency) !== 1 || preg_match('/^(0|-?[1-9][0-9]{0,18})$/D', $amountMinor) !== 1) {
            throw new \InvalidArgumentException('Invalid storefront money');
        }

        $negative = str_starts_with($amountMinor, '-');
        $digits = $negative ? substr($amountMinor, 1) : $amountMinor;
        if (strlen($digits) === 19 && strcmp($digits, $negative ? '9223372036854775808' : '9223372036854775807') > 0) {
            throw new \InvalidArgumentException('Storefront money overflows int64');
        }
    }

    /** @return array{currency:string, amountMinor:string} */
    public function serialise(): array
    {
        return ['currency' => $this->currency, 'amountMinor' => $this->amountMinor];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'currency'), Fields::string($payload, 'amountMinor'));
    }
}
