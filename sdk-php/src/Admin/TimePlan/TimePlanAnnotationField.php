<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanAnnotationField names the values of AnnotationSchema.fields.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanAnnotationField
{
    public const TEXT = 'text';
    public const MARKER_LABEL = 'markerLabel';
    public const DECISION_STATUS = 'decisionStatus';
    public const ASSIGNEE_REF = 'assigneeRef';
    public const DUE_DATE = 'dueDate';
    public const ACTION_STATUS = 'actionStatus';
}
