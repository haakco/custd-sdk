<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class RequestedFilter
{
    /**
     * @param FilterOperator::* $operator
     */
    public function __construct(
        public string $dimension,
        public string $operator,
        public ?string $value = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'dimension' => $this->dimension,
            'operator' => $this->operator,
        ];
        if ($this->value !== null) {
            $body['value'] = $this->value;
        }

        return $body;
    }
}
