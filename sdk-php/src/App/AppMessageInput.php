<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageInput
{
    /**
     * @param list<string> $participants
     */
    public function __construct(
        public string $externalId,
        public ?string $threadId,
        public ?string $sender,
        public array $participants,
        public string $timestamp,
        public string $direction,
        public string $text,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'externalId' => $this->externalId,
            'threadId' => $this->threadId,
            'sender' => $this->sender,
            'participants' => $this->participants,
            'timestamp' => $this->timestamp,
            'direction' => $this->direction,
            'text' => $this->text,
        ];
    }
}
