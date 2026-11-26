<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Quantity
{
    /**
     * @param ModelQuantityKind::* $kind
     */
    public function __construct(
        public string $kind,
        public string $name,
        public ?string $description = null,
        public ?string $formula = null,
        public ?Input $input = null,
        public ?string $unit = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $input = Fields::optionalObject($payload, 'input');

        return new self(
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'name'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'formula'),
            $input === null ? null : Input::fromPayload($input),
            Fields::optionalString($payload, 'unit'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
            'name' => $this->name,
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->formula !== null) {
            $body['formula'] = $this->formula;
        }
        if ($this->input !== null) {
            $body['input'] = $this->input->serialise();
        }
        if ($this->unit !== null) {
            $body['unit'] = $this->unit;
        }

        return $body;
    }
}
