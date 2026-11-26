<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowDefinitionStatus names the values of WorkflowDefinition.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowDefinitionStatus
{
    public const ACTIVE = 'active';
    public const RETIRED = 'retired';
}
