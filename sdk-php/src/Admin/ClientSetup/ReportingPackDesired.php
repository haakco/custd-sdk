<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Admin\ReportingPack\PackDefinition;

final readonly class ReportingPackDesired
{
    public function __construct(
        public PackDefinition $definition,
        public ?int $expectedRevision = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'definition' => $this->definition->serialise(),
        ];
        if ($this->expectedRevision !== null) {
            $body['expectedRevision'] = $this->expectedRevision;
        }

        return $body;
    }
}
