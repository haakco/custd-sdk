<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelRecommendation names the values of Information.recommended.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelRecommendation
{
    public const ACT = 'act';
    public const HOLD = 'hold';
}
