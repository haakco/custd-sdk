<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppItemKind names the values of AppItemCreateRequest.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppItemKind
{
    public const MEASUREMENT_PROJECT = 'measurement_project';
    public const LINK_COLLECTION = 'link_collection';
    public const MEETING = 'meeting';
    public const UNCERTAINTY_MODEL = 'uncertainty_model';
    public const PLAN = 'plan';
}
