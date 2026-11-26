<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppPlanPartUpdate
{
    /**
     * @param list<string> $prerequisites
     */
    public function __construct(
        public string $itemUuid,
        public array $prerequisites,
        public bool $required,
        public ?string $linkToken = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'itemUuid' => $this->itemUuid,
            'prerequisites' => $this->prerequisites,
            'required' => $this->required,
        ];
        if ($this->linkToken !== null) {
            $body['linkToken'] = $this->linkToken;
        }

        return $body;
    }
}
