<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelRunTrigger names the values of RunDetail.trigger, RunSummary.trigger.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelRunTrigger
{
    public const REQUEST = 'request';
    public const SOURCE_CHANGED = 'source_changed';
}
