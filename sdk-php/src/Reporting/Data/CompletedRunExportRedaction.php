<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportRedaction
{
    public function __construct(
        public int $redactedAnnotationCount,
        public string $result,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'redactedAnnotationCount' => $this->redactedAnnotationCount,
            'result' => $this->result,
        ];

        return $body;
    }
}
