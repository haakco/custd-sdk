<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

/**
 * DataLabelSensitivity names the values of DataLabelDefinitionCreateRequest.sensitivity,
 * DataLabelDefinitionUpdateRequest.sensitivity.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataLabelSensitivity
{
    public const PUBLIC = 'public';
    public const INTERNAL = 'internal';
    public const PERSONAL = 'personal';
    public const RESTRICTED = 'restricted';
}
