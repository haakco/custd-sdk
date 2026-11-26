/**
 * Reporting reads and generations served by the analytics API: the dashboard catalogue, dashboard
 * data generations, unpublished pack previews and completed time-plan run exports.
 */

import type { PackDefinition, ReportingFilter, ReportingQueryRequest } from "./index.js";

/** The file formats a report export or dashboard can produce. */
export type ReportingExportFormat = "csv" | "xlsx" | "html" | "pdf" | "svg" | "png" | "parquet" | "manifest";

export type ReportingDashboardInteraction = "filter" | "drill_down";

export type ReportingDashboardCatalogueTrust = { serverOwned: boolean; tenantScoped: boolean };

/** One dashboard the tenant can open. */
export type ReportingDashboardCatalogueEntry = {
  key: string;
  title?: string;
  description?: string;
  group: string;
  defaultRange: string;
  refreshSeconds: number;
  trust: ReportingDashboardCatalogueTrust;
  interactions: ReportingDashboardInteraction[];
  exportFormats: ReportingExportFormat[];
};

export type ReportingDashboardCatalogue = { dashboards: ReportingDashboardCatalogueEntry[] };

/** The range, filters and comparison a dashboard generation or export is built for. */
export type ReportingExportParameters = {
  filters?: ReportingFilter[];
  selections?: string[];
  comparison?: "previous_period" | "previous_year";
  from?: string;
  to?: string;
  rangeDays?: number;
  maxRows?: number;
};

export type ReportingDashboardGenerationRequest = {
  dashboardKey: string;
  parameters: ReportingExportParameters;
};

export type ReportingDatasetRowCount = { key: string; count: number };

export type ReportingSnapshotColumnType =
  | "text"
  | "integer"
  | "number"
  | "percentage"
  | "currency"
  | "date"
  | "datetime"
  | "duration"
  | "boolean"
  | "null";

export type ReportingSnapshotColumn = {
  key: string;
  label: string;
  description?: string;
  nullable: boolean;
  type: ReportingSnapshotColumnType;
  unit?: string;
};

export type ReportingSnapshotDatasetSchema = { key: string; label: string; columns: ReportingSnapshotColumn[] };

export type ReportingDashboardGenerationState = "building" | "ready" | "unavailable";

/**
 * A dashboard data generation. While `building`, poll again after `pollAfterSeconds`; once `ready`, the
 * snapshot downloads from `downloadUrl` until `urlExpiresAt`.
 */
export type ReportingDashboardGeneration = {
  generationId: string;
  state: ReportingDashboardGenerationState;
  pollAfterSeconds?: number;
  snapshotSha256?: string;
  contractVersion?: number;
  mediaType?: string;
  compression?: string;
  byteLength?: number;
  downloadUrl?: string;
  urlExpiresAt?: string;
  validUntil?: string;
  datasetRowCounts: ReportingDatasetRowCount[];
  datasetSchemas: ReportingSnapshotDatasetSchema[];
};

/**
 * Renders one query against a pack definition that is not published. `tenantSlug` must be the
 * credential's tenant unless the caller is a system administrator.
 */
export type ReportingDraftPreviewRequest = {
  tenantSlug: string;
  definition: PackDefinition;
  query: ReportingQueryRequest;
};

export type CompletedRunExportIdentity = {
  tenantId: string;
  runId: string;
  planId: string;
  versionId: string;
  packKey: string;
  packGeneration: number;
};

export type CompletedRunExportAllocation = { block_uuid: string; duration_ms: number; sequence: number };

export type CompletedRunExportAllocationChange = { block_uuid: string; from_ms: number; to_ms: number };

export type CompletedRunExportCalculationReceipt = {
  allocator_version?: string;
  changes?: CompletedRunExportAllocationChange[];
  reason?: string;
  result?: CompletedRunExportAllocation[];
  source?: CompletedRunExportAllocation[];
  summary?: string;
};

export type CompletedRunExportAdjustment = {
  transition_uuid: string;
  command_id: string;
  type: string;
  stream_version: number;
  occurred_at: string;
  receipt: CompletedRunExportCalculationReceipt;
  actor_kind?: string;
  actor_ref?: string;
  allocator_version?: string;
  client_occurred_at?: string;
  current_status?: string;
  previous_status?: string;
  reason?: string;
  schema_version?: string;
  supersedes_transition_id?: string;
};

export type CompletedRunExportAnnotation = {
  uuid: string;
  type: string;
  actor_kind: string;
  recorded_at: string;
  action_status?: string;
  actor_ref?: string;
  assignee_ref?: string;
  block_uuid?: string;
  decision_status?: string;
  due_date?: string;
  marker_label?: string;
  redacted_at?: string;
  supersedes_uuid?: string;
  text?: string;
};

export type CompletedRunExportBlock = {
  block_uuid: string;
  semantic_key: string;
  sequence: number;
  status: string;
  outcome: string;
  planned_ms: number;
  current_ms: number;
  actual_ms?: number;
  allocated_at_start_ms?: number;
  category?: string;
  tags?: string[];
  wall_started_at?: string;
  wall_ended_at?: string;
};

export type CompletedRunExportPredictionComparison = {
  block_uuid: string;
  method: string;
  method_version: string;
  input_hash: string;
  point_ms: number;
  predicted_at: string;
  sample_count: number;
  absolute_error_ms?: number;
  actual_ms?: number;
  interval_covered?: boolean;
  p10_ms?: number;
  p90_ms?: number;
  warnings?: string[];
};

export type CompletedRunExportProvenance = {
  adjustment_count: number;
  annotation_count: number;
  corrected: boolean;
  generated_at: string;
  input_hash: string;
  prediction_count: number;
  report_version: string;
  forecast_evaluation_hash?: string;
  measurement_input_hash?: string;
  measurement_projection_version?: string;
};

export type CompletedRunExportSummary = {
  plan_id: string;
  run_id: string;
  version_id: string;
  run_status: string;
  stream_version: number;
  completed_at: string;
  actual_block_count: number;
  actual_complete: boolean;
  actual_total_ms: number;
  baseline_horizon_ms: number;
  block_count: number;
  cancelled_block_count: number;
  censored_block_count: number;
  completed_block_count: number;
  current_total_ms: number;
  final_variance_ms: number;
  lost_ms: number;
  not_run_block_count: number;
  overrun_ms: number;
  planned_total_ms: number;
  skipped_block_count: number;
  unused_ms: number;
  effective_starts_at?: string;
  effective_ends_at?: string;
  executable_horizon_ms?: number;
  scheduled_starts_at?: string;
  scheduled_ends_at?: string;
};

export type CompletedRunExportSections = {
  order: string[];
  summary: CompletedRunExportSummary;
  blocks: { items: CompletedRunExportBlock[] };
  adjustments: { items: CompletedRunExportAdjustment[] };
  annotationsActions: { items: CompletedRunExportAnnotation[] };
  predictionComparison: { items: CompletedRunExportPredictionComparison[] };
  provenance: CompletedRunExportProvenance;
};

export type CompletedRunExportRedaction = { result: "not_required" | "applied"; redactedAnnotationCount: number };

export type CompletedRunExportMetadata = { reportVersion: string; generatedAt: string; corrected: boolean };

export type CompletedRunExportIntegrity = {
  sourceInputSha256: string;
  sourceReportSha256: string;
  exportSha256: string;
};

/** The frozen, integrity-checked content of one completed time-plan run, as the export renders it. */
export type CompletedRunExportSource = {
  contractVersion: string;
  identity: CompletedRunExportIdentity;
  sections: CompletedRunExportSections;
  redaction: CompletedRunExportRedaction;
  metadata: CompletedRunExportMetadata;
  integrity: CompletedRunExportIntegrity;
};

/** Exports a completed time-plan run in one to eight formats. */
export type CompletedRunExportRequest = {
  source: CompletedRunExportSource;
  formats: ReportingExportFormat[];
  idempotencyKey?: string;
};
