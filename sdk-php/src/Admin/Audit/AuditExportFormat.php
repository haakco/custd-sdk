<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditExportFormat names the file formats an audit trail export downloads as.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuditExportFormat
{
    public const CSV = 'csv';
    public const JSON = 'json';
}
