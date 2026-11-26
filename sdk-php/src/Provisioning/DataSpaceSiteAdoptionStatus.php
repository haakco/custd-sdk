<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** DataSpaceSiteAdoptionStatus is whether an adoption moved the Site or found it already moved. */
final class DataSpaceSiteAdoptionStatus
{
    public const ADOPTED = 'adopted';
    public const ALREADY_ADOPTED = 'already_adopted';
}
