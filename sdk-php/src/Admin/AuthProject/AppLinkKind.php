<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppLinkKind is the kind of application item linked to an environment. */
enum AppLinkKind: string
{
    case MeasurementProject = 'measurement_project';
    case LinkCollection = 'link_collection';
    case Meeting = 'meeting';
    case UncertaintyModel = 'uncertainty_model';
}
