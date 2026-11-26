<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanAnnotationType names the values of Annotation.type, AnnotationInput.type, AnnotationSchema.allowedTypes.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanAnnotationType
{
    public const NOTE = 'note';
    public const MARKER = 'marker';
    public const DECISION = 'decision';
    public const ACTION = 'action';
}
