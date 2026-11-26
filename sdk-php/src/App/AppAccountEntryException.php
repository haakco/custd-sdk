<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAccountEntryException is an issuer that refused an account entry ticket. It carries the status only:
 * the issuer's error body is never read, so it cannot expose ticket material.
 */
final class AppAccountEntryException extends \RuntimeException
{
    public function __construct(public readonly int $status)
    {
        parent::__construct("custd: app account entry request failed with status {$status}", $status);
    }
}
