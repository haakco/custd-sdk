<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

final readonly class PrivacyErasureSelector
{
    /**
     * @param list<string>|null $values
     */
    public function __construct(
        public string $type,
        public ?string $value = null,
        public ?array $values = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'type' => $this->type,
        ];
        if ($this->value !== null) {
            $body['value'] = $this->value;
        }
        if ($this->values !== null) {
            $body['values'] = $this->values;
        }

        return $body;
    }
}
