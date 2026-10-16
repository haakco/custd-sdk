<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * EnvironmentOffboardRequest offboards one environment. `confirmSlug` must equal
 * the stored environment slug exactly: a caller that cannot name the environment
 * cannot retire it, which stops a mistyped identifier from withdrawing the wrong
 * boundary.
 */
final readonly class EnvironmentOffboardRequest
{
    public function __construct(public string $confirmSlug)
    {
        if (trim($confirmSlug) === '') {
            throw new \InvalidArgumentException(
                'custd: environment offboarding needs the stored environment slug to confirm'
            );
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['confirmSlug' => $this->confirmSlug];
    }
}
