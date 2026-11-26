<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

/**
 * DataLabelPropagationPolicy names the values of DataLabelDefinitionCreateRequest.propagationPolicy,
 * DataLabelDefinitionUpdateRequest.propagationPolicy.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataLabelPropagationPolicy
{
    public const NONE = 'none';
    public const EVENT_TYPE_TO_EVENT = 'event_type_to_event';
    public const PACK_SELECTED = 'pack_selected';
}
