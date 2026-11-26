<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelBoundState names the values of BoundInput.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelBoundState
{
    public const RESOLVED = 'resolved';
    public const SOURCE_MISSING = 'source_missing';
    public const VALUE_MISSING = 'value_missing';
}
