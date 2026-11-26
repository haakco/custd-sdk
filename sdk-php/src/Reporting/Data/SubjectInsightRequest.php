<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class SubjectInsightRequest
{
    public function __construct(
        public string $subject,
        public string $template,
        public ?string $from = null,
        public ?int $rangeDays = null,
        public ?string $to = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'subject' => $this->subject,
            'template' => $this->template,
        ];
        if ($this->from !== null) {
            $body['from'] = $this->from;
        }
        if ($this->rangeDays !== null) {
            $body['rangeDays'] = $this->rangeDays;
        }
        if ($this->to !== null) {
            $body['to'] = $this->to;
        }

        return $body;
    }
}
