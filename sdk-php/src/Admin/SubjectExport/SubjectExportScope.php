<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

/**
 * SubjectExportScope names the values of SubjectExportArtifactResponse.scope, SubjectExportCreateRequest.scope,
 * SubjectExportResponse.scope.
 * A value Custd adds later still decodes as a plain string.
 */
final class SubjectExportScope
{
    public const ACCESS = 'access';
    public const PORTABILITY = 'portability';
    public const BOTH = 'both';
}
