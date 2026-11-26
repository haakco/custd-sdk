<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingExportFormat names the values of ArtifactResponse.fallbackForFormat, ArtifactResponse.format,
 * CompletedRunExportRequest.formats, CreateRequest.formats, DashboardCatalogueEntry.exportFormats,
 * DashboardDefinition.exportFormats, JobResponse.formats, Pack.exportFormats.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingExportFormat
{
    public const CSV = 'csv';
    public const XLSX = 'xlsx';
    public const HTML = 'html';
    public const PDF = 'pdf';
    public const SVG = 'svg';
    public const PNG = 'png';
    public const PARQUET = 'parquet';
    public const MANIFEST = 'manifest';
}
