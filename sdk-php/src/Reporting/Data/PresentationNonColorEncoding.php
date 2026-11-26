<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * PresentationNonColorEncoding names the values of PresentationPresetSelection.nonColorEncoding.
 * A value Custd adds later still decodes as a plain string.
 */
final class PresentationNonColorEncoding
{
    public const LINE_SYMBOL_LABEL = 'line_symbol_label';
    public const SIGNED_BAR_LABEL = 'signed_bar_label';
    public const BAND_BOUNDARY_LABEL = 'band_boundary_label';
}
