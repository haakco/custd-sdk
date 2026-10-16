<?php

declare(strict_types=1);

namespace HaakCo\Custd\RawIngest;

use HaakCo\Custd\Admin\DataScope\DataScopeValidation;

/**
 * RawSourceTarget is the declarative default data-scope target for one raw
 * upload. Both fields are registered immutable CODES supplied as a pair, never
 * numeric platform identities: the backend fills a record that carries no
 * canonical selection and refuses a record whose explicit selection disagrees.
 */
final readonly class RawSourceTarget
{
    public function __construct(
        public string $subClient,
        public string $resource,
    ) {
        if (!DataScopeValidation::isValidCode($this->subClient) || !DataScopeValidation::isValidCode($this->resource)) {
            throw new \InvalidArgumentException(
                'custd: raw source target requires subClient and resource as a pair of valid codes'
            );
        }
    }

    /**
     * @return array{subClient: string, resource: string}
     */
    public function queryParams(): array
    {
        return ['subClient' => $this->subClient, 'resource' => $this->resource];
    }
}
