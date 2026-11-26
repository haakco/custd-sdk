<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

/**
 * SubjectExportStatus names the values of SubjectExportResponse.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class SubjectExportStatus
{
    public const QUEUED = 'queued';
    public const RUNNING = 'running';
    public const COMPLETE = 'complete';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';
    public const EXPIRED = 'expired';
}
