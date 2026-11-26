<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppLinkKind is the kind of application item linked to an environment. */
final class AppLinkKind
{
    public const MEASUREMENT_PROJECT = 'measurement_project';
    public const LINK_COLLECTION = 'link_collection';
    public const MEETING = 'meeting';
    public const UNCERTAINTY_MODEL = 'uncertainty_model';
}
