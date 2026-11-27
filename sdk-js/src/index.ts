import { AuthProjectAdminClient } from "./admin-auth-projects.js";
import { ClientSetupClient } from "./admin-client-setup.js";
import { DataLabelAdminClient } from "./admin-data-labels.js";
import { DataScopeAdminClient, validDataScopeCode } from "./admin-data-scopes.js";
import {
  OffboardingClient,
  type OffboardingDownloadStream,
  type OffboardingReceiptPerStore,
} from "./admin-offboarding.js";
import { PredictionAdminClient } from "./admin-predictions.js";
import { PrivacyErasureClient } from "./admin-privacy-erasures.js";
import { RetentionClient } from "./admin-retention.js";
import { SiteDomainAdminClient } from "./admin-site-domains.js";
import { SiteInsightsAdminClient } from "./admin-site-insights-tasks.js";
import { SubjectExportClient } from "./admin-subject-exports.js";
import { TenantStorageClient } from "./admin-tenant-storage.js";
import { type CustdDownloadStream, responseDownloadStream } from "./download-stream.js";
import { isLocalHostname } from "./secure-url.js";
import { StorefrontClient } from "./storefront.js";

export {
  AUTH_PROJECT_DOMAIN_CONVERGENCES,
  AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS,
  AUTH_PROJECT_DOMAIN_IMAGE_SOURCES,
  AUTH_PROJECT_DOMAIN_LIFECYCLES,
  AUTH_PROJECT_DOMAIN_STATUSES,
  type AuthProjectAppLink,
  type AuthProjectAppLinkList,
  type AuthProjectBrandLogo,
  type AuthProjectDomainBinding,
  type AuthProjectDomainBindRequest,
  type AuthProjectDomainConvergence,
  type AuthProjectDomainDNSProof,
  type AuthProjectDomainImageComponent,
  type AuthProjectDomainImageOverride,
  type AuthProjectDomainImageOverrideRequest,
  type AuthProjectDomainImageSet,
  type AuthProjectDomainImageSource,
  type AuthProjectDomainImages,
  type AuthProjectDomainLifecycle,
  type AuthProjectDomainMintRequest,
  type AuthProjectDomainStatus,
} from "./admin-auth-project-domain.js";
export {
  ADMIN_USER_GLOBAL_STATES,
  ADMIN_USER_MEMBERSHIP_STATES,
  ADMIN_USER_ROLES,
  type AdminUser,
  AdminUserAdminClient,
  type AdminUserCreateRequest,
  type AdminUserDisableRequest,
  type AdminUserEnableRequest,
  type AdminUserGlobalState,
  type AdminUserListQuery,
  type AdminUserListResponse,
  type AdminUserMembershipCreateRequest,
  type AdminUserMembershipState,
  type AdminUserPasswordReset,
  type AdminUserRemovalRequest,
  type AdminUserRole,
  type AdminUserScope,
  type AdminUserUpdateRequest,
} from "./admin-users.js";
export {
  WORKFLOW_TIMING_FACT_KINDS,
  WORKFLOW_TIMING_STATES,
  WorkflowTimingAdminClient,
  type WorkflowTimingAttempt,
  type WorkflowTimingBatchResult,
  type WorkflowTimingContribution,
  type WorkflowTimingDeclaration,
  type WorkflowTimingDefinition,
  type WorkflowTimingDefinitionList,
  type WorkflowTimingDimensionDefinition,
  type WorkflowTimingDurationHistory,
  type WorkflowTimingDurationHistoryEntry,
  type WorkflowTimingDurationProjection,
  type WorkflowTimingEvaluation,
  type WorkflowTimingEvaluationArtifact,
  type WorkflowTimingExcludedStep,
  type WorkflowTimingExpectation,
  type WorkflowTimingFact,
  type WorkflowTimingFactKind,
  type WorkflowTimingObservation,
  type WorkflowTimingObservationResult,
  type WorkflowTimingOutcomeCounts,
  type WorkflowTimingPrediction,
  type WorkflowTimingProjectionStatus,
  type WorkflowTimingProvenance,
  type WorkflowTimingRebuildResult,
  type WorkflowTimingReconcileResult,
  type WorkflowTimingRevision,
  type WorkflowTimingRun,
  type WorkflowTimingRunDuration,
  type WorkflowTimingRunFact,
  type WorkflowTimingRunList,
  type WorkflowTimingRunListQuery,
  type WorkflowTimingRunProjection,
  type WorkflowTimingRunSummary,
  type WorkflowTimingRunTiming,
  type WorkflowTimingState,
  type WorkflowTimingStepDeclaration,
  type WorkflowTimingStepDefinition,
  type WorkflowTimingStepDuration,
  type WorkflowTimingStepFact,
} from "./admin-workflow-timings.js";

import { AccountingEvidenceAdminClient } from "./admin-accounting-evidence.js";
import { CampaignEmailAdminClient } from "./admin-campaign-email.js";
import { EmailRelayAdminClient } from "./admin-email-relay.js";
import { EnvironmentPolicyAdminClient } from "./admin-environment-policy.js";
import { ErrorIssueAdminClient } from "./admin-error-issues.js";
import { EventTypeAdminClient } from "./admin-event-types.js";
import { ImpersonationAdminClient } from "./admin-impersonation.js";
import { IngestClaimAdminClient } from "./admin-ingest-claims.js";
import { MachineAccessAdminClient, type MachineAccessBlock } from "./admin-machine-access.js";
import { ManagedAuditAdminClient } from "./admin-managed-audit.js";
import { AdminMeasurementNamespace } from "./admin-measurement-projects.js";
import { NotificationDestinationAdminClient } from "./admin-notification-destinations.js";
import { NotificationWebhookAdminClient } from "./admin-notification-webhooks.js";
import { OAuthClientAdmissionAdminClient } from "./admin-oauth-client-admissions.js";
import { RlsAdminClient } from "./admin-rls.js";
import { SdkUsageAdminClient } from "./admin-sdk-usage.js";
import type { SiteAIOwnerHandoff } from "./admin-site-ai.js";
import { SupportAccessAdminClient } from "./admin-support-access.js";
import { SystemAdminClient } from "./admin-system.js";
import { TimePlanAdminClient } from "./admin-timeplans.js";
import { UncertaintyModelAdminClient } from "./admin-uncertainty-models.js";
import { UsageAdminClient } from "./admin-usage.js";
import { AdminUserAdminClient } from "./admin-users.js";
import { WorkflowTimingAdminClient } from "./admin-workflow-timings.js";
import { AnalyticsEventClient } from "./analytics-events.js";
import { BackendLifecycleClient } from "./backend-lifecycle.js";
import { IngestOperationsClient } from "./ingest-operations.js";
import { MeasurementClient } from "./measurement.js";
import { basicAuthorization } from "./oauth.js";
import { ParserClient } from "./parsers.js";
import { PublicReadClient } from "./public-reads.js";
import type {
  CompletedRunExportRequest,
  ReportingDashboardCatalogue,
  ReportingDashboardCatalogueEntry,
  ReportingDashboardGeneration,
  ReportingDashboardGenerationRequest,
  ReportingDraftPreviewRequest,
  ReportingSnapshotColumn,
  ReportingSnapshotDatasetSchema,
} from "./reporting-catalogue.js";
import { emptyApiNullLists } from "./response-lists.js";
import {
  type EventSchemaDocument,
  type EventSchemaRegisterRequest,
  type EventSchemaStateResult,
  type EventSchemaVersion,
  type EventSchemaVersionList,
  eventSchemaPath,
  type RegisteredEventType,
  type RegisteredEventTypeList,
  schemaRegistryPath,
} from "./schema-registry.js";
import { redeemSiteAIOwnerHandoff, type SiteAIOwnerSession } from "./site-ai-owner.js";
import { SDK_IDENTITY } from "./version.js";

export type {
  AppRelease,
  AppReleaseCacheMode,
  AppReleaseCacheRule,
  AppReleaseCreateRequest,
  AppReleaseFile,
  AppReleaseFramingMode,
  AppReleaseHeaderRule,
  AppReleaseList,
  AppReleaseManifest,
  AppReleasePromotion,
  AppReleaseResponseHeader,
  AppReleaseRouting,
  AppReleaseShareableRoute,
  AppReleaseSiteCard,
  AppReleaseSpaFallback,
  AppReleaseState,
  AppReleaseSummary,
  AppReleaseUploadedFile,
} from "./admin-app-releases.js";
export {
  APP_ERROR_CODES,
  APP_REASON_CODES,
  APP_SIGN_IN_MODES,
  APP_STATUSES,
  type AppCreateRequest,
  type AppCreation,
  type AppDeployCredential,
  type AppDeployCredentialList,
  type AppDeployCredentialSummary,
  type AppListResponse,
  type AppOverview,
  type AppReason,
  type AppReasonCode,
  type AppSignInMode,
  type AppSignInRequest,
  type AppStatus,
  type AppSummary,
  type AppTrafficReporting,
} from "./admin-apps.js";
export {
  type ApplicationIdentityTrait,
  type ApplicationIdentityTraitsStatus,
  type ApplicationIdentityTraitValue,
  type ApplicationMembershipChoice,
  type ApplicationMembershipContext,
  type ApplicationMembershipRevocation,
  type ApplicationMembershipRevokeRequest,
  type ApplicationPrincipalErasure,
  type ApplicationPrincipalErasureRequest,
  type ApplicationPrincipalExport,
  type ApplicationPrincipalIdentityExport,
  type ApplicationPrincipalListItem,
  type ApplicationPrincipalListQuery,
  type ApplicationPrincipalListResponse,
  type ApplicationPrincipalMembershipView,
  type ApplicationPrincipalProfile,
  type ApplicationPrincipalProfileValueView,
  type ApplicationPrincipalSuspension,
  type ApplicationPrincipalTarget,
  type ApplicationProfileField,
  type ApplicationProfileValue,
  type ApplicationProfileValuesRequest,
  type ApplicationSession,
  type ApplicationSessionInventory,
  type ApplicationSessionRevocation,
  type ApplicationSessionRevokeRequest,
  type ApplicationSessionsRevokeAllRequest,
  type AudienceGrant,
  type AudienceGrantRequest,
  type AuthEnvironmentClientCleanup,
  type AuthEnvironmentHostingRemoval,
  type AuthEnvironmentHostingWithdrawal,
  type AuthEnvironmentRetainedResources,
  AuthProjectAdminClient,
  type AuthProjectApplicationSessionPolicy,
  type AuthProjectAudienceBinding,
  type AuthProjectBrandMode,
  type AuthProjectBrandPalette,
  type AuthProjectCapability,
  type AuthProjectChange,
  type AuthProjectClientRegistration,
  type AuthProjectClientSync,
  type AuthProjectClientSyncRegistration,
  type AuthProjectClientSyncReport,
  type AuthProjectClientSyncRequest,
  type AuthProjectConfiguredState,
  type AuthProjectCreateRequest,
  type AuthProjectCreation,
  type AuthProjectDeletion,
  type AuthProjectDeletionRequest,
  type AuthProjectDesiredState,
  type AuthProjectDesiredStateRequest,
  type AuthProjectDirectoryAction,
  type AuthProjectDirectoryCapacity,
  type AuthProjectDirectoryRequest,
  type AuthProjectDirectoryStatus,
  type AuthProjectDirectoryView,
  type AuthProjectEnvironmentCreateRequest,
  type AuthProjectEnvironmentDeletion,
  type AuthProjectEnvironmentDeletionRequest,
  type AuthProjectEnvironmentOffboarding,
  type AuthProjectEnvironmentOffboardRequest,
  type AuthProjectEnvironmentOrganisation,
  type AuthProjectEnvironmentOrganisationList,
  type AuthProjectEnvironmentReleasedResources,
  type AuthProjectHostedSignIn,
  type AuthProjectHosting,
  type AuthProjectHostingCapability,
  type AuthProjectHostingIngestTarget,
  type AuthProjectHostingMode,
  type AuthProjectHostingRemoval,
  type AuthProjectHostingStatus,
  type AuthProjectIdentityMode,
  type AuthProjectInvitation,
  type AuthProjectInvitationIssued,
  type AuthProjectInvitationIssueRequest,
  type AuthProjectInvitationListResponse,
  type AuthProjectInvitationRedeliveryRequest,
  type AuthProjectInvitationRevocationRequest,
  type AuthProjectListResponse,
  type AuthProjectOperation,
  type AuthProjectPreview,
  type AuthProjectProfileField,
  AuthProjectRealmNotConvergedError,
  AuthProjectRealmProvisionError,
  type AuthProjectRealmProvisionReceipt,
  type AuthProjectRealmProvisionRequest,
  type AuthProjectRealmStep,
  type AuthProjectReleasedResources,
  type AuthProjectSocialProvider,
  type AuthProjectSocialProviderName,
  type AuthProjectSocialSignIn,
  type AuthProjectSocialSignInStatus,
  type AuthProjectStatus,
  type AuthProjectSummary,
  type PrincipalAudience,
  type PrincipalAudiences,
} from "./admin-auth-projects.js";
export {
  type ClientSetupApplyAndWaitOptions,
  type ClientSetupApplyAndWaitResult,
  type ClientSetupApplyOptions,
  type ClientSetupApplyResponse,
  ClientSetupClient,
  type ClientSetupEventTypeDesiredState,
  type ClientSetupManifest,
  type ClientSetupOAuthClientDesiredState,
  type ClientSetupOAuthPurposeProfile,
  type ClientSetupOperationPending,
  type ClientSetupOperationStatus,
  type ClientSetupPrivacyDesiredState,
  type ClientSetupPrivacyRule,
  type ClientSetupReadinessResponse,
  type ClientSetupReportingPackDesiredState,
  type ClientSetupResourceStatus,
  type ClientSetupRetentionDesiredState,
  type ClientSetupSchemaDesiredState,
  validateClientSetupManifest,
} from "./admin-client-setup.js";
export {
  DataLabelAdminClient,
  type DataLabelAssignmentListResponse,
  type DataLabelCatalogue,
  type DataLabelCatalogueAssignment,
  type DataLabelCatalogueDataset,
  type DataLabelCataloguePack,
  type DataLabelCatalogueResponse,
  type DataLabelDefinition,
  type DataLabelDefinitionCreateRequest,
  type DataLabelDefinitionListResponse,
  type DataLabelDefinitionUpdateRequest,
  type DataLabelPropagationPolicy,
  type DataLabelSensitivity,
  type DataLabelUsage,
  type DataLabelUsageListResponse,
  type DataLabelValue,
  type DataLabelValueCreateRequest,
  type DataLabelValueUpdateRequest,
  type DescriptiveDataLabel,
  type EventTypeDataLabelDefault,
  type EventTypeDataLabelDefaultRequest,
  type SchemaFieldDataLabelAssignment,
  type SchemaFieldDataLabelAssignmentRequest,
} from "./admin-data-labels.js";
export {
  type DataScope,
  type DataScopeAction,
  DataScopeAdminClient,
  type DataScopeCreateRequest,
  type DataScopeGrant,
  type DataScopeGrantListResponse,
  type DataScopeGrantTarget,
  type DataScopeGrantTargetKind,
  type DataScopeListResponse,
  type DataScopePrincipalKind,
  type DataScopePrincipalRef,
  type DataScopeResource,
  type DataScopeResourceCreateRequest,
  type DataScopeResourceListResponse,
  type DataScopeResourceUpdateRequest,
  type DataScopeStatus,
  type DataScopeUpdateRequest,
  validDataScopeCode,
  validDataScopeName,
} from "./admin-data-scopes.js";
export {
  type OffboardingAcknowledgeResponse,
  type OffboardingCancelRequest,
  OffboardingClient,
  type OffboardingDownloadResponse,
  type OffboardingDownloadStream,
  type OffboardingExecuteResponse,
  type OffboardingExportResponse,
  type OffboardingPreviewExclusion,
  type OffboardingPreviewResponse,
  type OffboardingPreviewStore,
  type OffboardingReceiptPerStore,
  type OffboardingReceiptResponse,
  type OffboardingRequest,
  type OffboardingRequestCreate,
  type OffboardingRequesterKind,
  type OffboardingRetryResponse,
  type OffboardingSchedule,
  type OffboardingScheduleListResponse,
  type OffboardingScheduleRequest,
  type OffboardingWaiver,
} from "./admin-offboarding.js";
export {
  type PredictionActivateRequest,
  PredictionAdminClient,
  type PredictionDefinition,
  type PredictionDefinitionCreateRequest,
  type PredictionDefinitionListResponse,
  type PredictionDefinitionUpdateRequest,
  type PredictionEvaluationSummary,
  type PredictionOutcomeListResponse,
  type PredictionOutcomeSummary,
  type PredictionPauseRequest,
  type PredictionProjectKind,
  type PredictionRunListResponse,
  type PredictionRunNowRequest,
  type PredictionRunSummary,
  type PredictionSignalSource,
  type PredictionSignalSourceCreateRequest,
  type PredictionSignalSourceListResponse,
  type PredictionThresholdEvent,
  type PredictionThresholdEventListResponse,
  type PredictionVersion,
  type PredictionVersionPublishRequest,
} from "./admin-predictions.js";
export {
  type PrivacyErasure,
  PrivacyErasureClient,
  type PrivacyErasureCreateRequest,
  PrivacyErasureError,
  type PrivacyErasureListResponse,
  type PrivacyErasureRetryClassification,
  type PrivacyErasureSelector,
  type PrivacyErasureState,
  type PrivacyErasureWaitOptions,
} from "./admin-privacy-erasures.js";
export {
  type RetentionClass,
  RetentionClient,
  type RetentionPolicy,
  type RetentionPolicyListResponse,
  type RetentionPolicyUpsertRequest,
  type RetentionRun,
  type RetentionRunPreview,
  type RetentionRunsListResponse,
  type RetentionRunsPage,
  type RetentionScope,
  type RetentionStoreBreakdown,
} from "./admin-retention.js";
export type {
  SiteAIConsentRequest,
  SiteAIMode,
  SiteAIOwnerHandoff,
  SiteAIOwnerHandoffRequest,
  SiteAIPlatformUsage,
  SiteAIProduct,
  SiteAISettings,
  SiteAISettingsRequest,
  SiteAITenantUsage,
  SiteAIUsage,
  SiteAIUsagePeriod,
  SiteAIUsageRow,
} from "./admin-site-ai.js";
export {
  SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE,
  SITE_ANALYTICS_PROPERTY_INVALID_CODE,
  SITE_ANALYTICS_PROVIDER_GA4,
  type SiteAnalyticsConnection,
  type SiteAnalyticsConnectionRequest,
  type SiteAnalyticsReport,
  type SiteAnalyticsRow,
  type SiteAnalyticsUnavailable,
  SiteAnalyticsUnavailableReport,
} from "./admin-site-analytics.js";
export {
  SITE_AUDIT_PAGES_DEFAULT_LIMIT,
  SITE_AUDIT_PAGES_MAX_LIMIT,
  SITE_LIGHTHOUSE_MAX_EXTRA_PAGES,
  SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE,
  type SiteAuditDelta,
  type SiteAuditPage,
  SiteAuditPageIndexability,
  type SiteAuditPageList,
  SiteAuditRun,
  type SiteLighthousePages,
  type SiteLighthouseRequestOptions,
} from "./admin-site-audit-pages.js";
export {
  SITE_CAMPAIGN_LINK_LIMIT_CODE,
  SITE_CAMPAIGN_LINK_TAKEN_CODE,
  SITE_CAMPAIGN_LINKS_MAX,
  type SiteCampaignLink,
  type SiteCampaignLinkList,
  type SiteCampaignLinkRequest,
} from "./admin-site-campaign-links.js";
export {
  SITE_BROWSER_COLLECTOR_MODES,
  SITE_DOMAIN_NOT_VERIFIED_CODE,
  SITE_FINDING_DISMISSAL_SCOPES,
  SITE_SEARCH_CONNECTION_NOT_FOUND_CODE,
  SITE_SEARCH_NOT_CONFIGURED_CODE,
  SITE_SEARCH_RETRY_NOT_FAILING_CODE,
  type SiteAlertDestination,
  type SiteAlertDestinationRequest,
  type SiteAuditSummary,
  type SiteBrowserCollector,
  type SiteBrowserCollectorMode,
  type SiteBrowserCollectorRequest,
  type SiteCheckMode,
  type SiteChromeUX,
  type SiteChromeUXObservation,
  type SiteDomain,
  SiteDomainAdminClient,
  type SiteDomainAttestation,
  type SiteDomainAudit,
  type SiteDomainChecks,
  type SiteDomainCreateRequest,
  type SiteDomainList,
  type SiteDomainOwnership,
  type SiteDomainRequestOptions,
  type SiteDomainVerification,
  type SiteDomainVerifiedBy,
  type SiteFinding,
  type SiteFindingDismissal,
  type SiteFindingDismissalRequest,
  type SiteFindingDismissalScope,
  type SiteFindingDismissals,
  type SiteFindingHistory,
  type SiteFindingList,
  type SiteFindingSeverity,
  type SiteFindingState,
  type SiteFindingSuggestion,
  type SiteIncident,
  type SiteIncidentList,
  type SiteProbe,
  type SiteProbeDetail,
  type SiteProbeList,
  type SiteProbeSpec,
  type SiteRegistration,
  SiteRule,
  type SiteRuleId,
  type SiteSearchAccount,
  type SiteSearchConnection,
  type SiteSearchConnectionRequest,
  type SiteSearchConnectionStatus,
  type SiteSearchDay,
  type SiteSearchPerformance,
  type SiteSearchProvider,
  type SiteSearchRow,
  type SiteSearchSource,
  type SiteSearchTotals,
  type SiteTLS,
  type SiteUptime,
  type SiteUptimeStatus,
  type SiteWarming,
} from "./admin-site-domains.js";
export {
  SITE_INSIGHTS_EXPORT_SCHEMA,
  SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT,
  type SiteInsightsExport,
  type SiteInsightsMonitoringExport,
  type SiteInsightsReportsExport,
  type SiteInsightsSearchExport,
  type SiteInsightsSiteExport,
  type SiteSearchMetricDay,
  SiteSearchMetricDimension,
  type SiteSearchMetricPage,
  type SiteSearchMetricsQuery,
} from "./admin-site-export.js";
export {
  type IndexNowState,
  type IndexNowSubmission,
  type IndexNowSubmissionRequest,
  IndexNowSubmissionStatus,
  SITE_CHOICE_REQUIRED_CODE,
  SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE,
  SITE_INDEXNOW_KEY_UNVERIFIED_CODE,
  SITE_INDEXNOW_LIMIT_CODE,
  SITE_INDEXNOW_NOT_ENABLED_CODE,
  SITE_INDEXNOW_URLS_INVALID_CODE,
  SITE_PAGE_NOT_ON_DOMAIN_CODE,
  SITE_PAGE_NOT_READ_CODE,
  SITE_PAGE_RECHECK_LIMIT_CODE,
  SITE_PAGE_RECHECK_READ_LIMIT,
  SITE_SEARCH_INSPECTION_LIMIT_CODE,
  SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE,
  SITE_SEARCH_INSPECTION_URL_INVALID_CODE,
  type SiteGeneratedFix,
  SiteGeneratedFormat,
  type SiteHreflangLink,
  type SiteLighthouseHistory,
  type SiteLighthouseMetrics,
  type SiteLighthousePageComparison,
  type SiteLighthouseProfile,
  type SiteLighthouseRun,
  type SiteLighthouseScores,
  type SiteMarket,
  type SiteObservedWording,
  type SitePageCheckRequest,
  type SitePageCheckResponse,
  SitePageCheckScope,
  type SitePageFacts,
  type SitePageFinding,
  type SitePageHeading,
  type SitePageOpenGraph,
  type SitePageReadability,
  type SitePageRecheck,
  type SitePageRecheckList,
  SitePageRecheckState,
  type SitePageRobots,
  type SitePageTwitter,
  type SitePageWordingQuery,
  type SitePhraseUse,
  type SiteProjectContext,
  type SiteProjectContextRequest,
  type SiteRemedy,
  SiteRemedyKind,
  type SiteReport,
  type SiteReportAudit,
  type SiteReportCertificate,
  type SiteReportFinding,
  type SiteReportSearch,
  type SiteReportShare,
  type SiteReportShareCreated,
  type SiteReportShareList,
  type SiteReportShareRequest,
  type SiteReportSpeed,
  type SiteReportUptime,
  type SiteResponseHour,
  type SiteRobotsRule,
  type SiteRobotsTestRequest,
  type SiteRobotsTestResponse,
  type SiteSearchDimension,
  type SiteSearchInspection,
  type SiteSearchInspectionList,
  type SiteSearchInspectionStatus,
  type SiteSearchRowPage,
  type SiteSearchRowsQuery,
  type SiteSearchUnavailable,
  type SiteUptimeDay,
  type SiteUptimeHistory,
  type SiteUptimeWindow,
  type SiteUptimeWindows,
  type SiteWordingCompare,
  type SiteWordingCompareRequest,
  type SiteWordingObservation,
  type SiteWordingObservationState,
} from "./admin-site-insights.js";
export {
  SiteInsightsAdminClient,
  type SiteInsightsBacklog,
  type SiteInsightsTaskList,
  SiteInsightsTaskName,
  type SiteInsightsTaskStatus,
} from "./admin-site-insights-tasks.js";
export {
  type SiteDomainAuthority,
  SiteLinkSource,
  SiteLinkSourceStatus,
  type SiteLinkSourceTotal,
  type SiteLostLinks,
  type SiteLostReferringDomain,
  type SiteReferringDomain,
  type SiteReferringDomains,
} from "./admin-site-links.js";
export {
  PRIVATE_UPTIME_FAILURES,
  PRIVATE_UPTIME_STATUSES,
  type PrivateUptimeCredential,
  type PrivateUptimeFailure,
  type PrivateUptimeMonitor,
  type PrivateUptimeReport,
  type PrivateUptimeStatus,
  type PrivateUptimeWork,
  SITE_HEARTBEAT_OUTCOMES,
  SITE_HEARTBEAT_STATUSES,
  type SiteHeartbeatCreateRequest,
  type SiteHeartbeatCredential,
  type SiteHeartbeatList,
  type SiteHeartbeatMonitor,
  type SiteHeartbeatOutcome,
  type SiteHeartbeatReceipt,
  type SiteHeartbeatReport,
  type SiteHeartbeatSchedule,
  type SiteHeartbeatStatus,
  type SiteMaintenanceWindow,
  type SiteMaintenanceWindowRequest,
  type SiteMaintenanceWindows,
} from "./admin-site-monitors.js";
export {
  SITE_NEXT_ACTIONS_MAX,
  type SiteFindingCounts,
  type SiteNextAction,
  SiteNextActionKind,
  SiteNextActionPlace,
  type SiteNextActions,
  type SiteNextActionTarget,
  SiteNotChecked,
  type SitePortfolioDomain,
  type SitePortfolioSummary,
} from "./admin-site-next-actions.js";
export {
  type SitePageLinkSource,
  SitePageLinkSourceWhere,
  SitePageQueriesState,
  type SitePageQuery,
  type SitePageQueryWindow,
  type SitePageSearchQueries,
  type SiteTitleOption,
  SiteTitleTemplate,
} from "./admin-site-page-queries.js";
export {
  SITE_RANKINGS_DAYS_INVALID_CODE,
  SITE_RANKINGS_DEFAULT_DAYS,
  SITE_RANKINGS_MAX_DAYS,
  SITE_TRACKED_KEYWORD_ALL,
  SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION,
  SITE_TRACKED_KEYWORD_DUPLICATE_CODE,
  SITE_TRACKED_KEYWORD_INVALID_CODE,
  SITE_TRACKED_KEYWORD_LIMIT_CODE,
  SITE_TRACKED_KEYWORD_NOT_FOUND_CODE,
  SITE_TRACKED_KEYWORDS_MAX,
  SiteRankDevice,
  type SiteRankings,
  SiteRankingsSource,
  type SiteRankObservation,
  SiteRankState,
  type SiteTrackedKeyword,
  SiteTrackedKeywordStatus,
  type SiteTrackedKeywordUpdate,
  type SiteTrackKeywordRequest,
} from "./admin-site-rankings.js";
export {
  SAVED_SITE_REPORT_LIMIT_CODE,
  SAVED_SITE_REPORT_NAME_TAKEN_CODE,
  type SavedSiteReport,
  type SavedSiteReportList,
  type SavedSiteReportRequest,
  type SavedSiteReportSummary,
  SITE_SAVED_REPORTS_MAX,
  type SiteReportRequestOptions,
  SiteReportTemplate,
} from "./admin-site-saved-reports.js";
export {
  SEARCH_POOL_MIN_CONTRIBUTORS,
  SEARCH_POOL_MIN_IMPRESSIONS,
  SEARCH_POOL_QUERIES_DEFAULT_LIMIT,
  SEARCH_POOL_QUERIES_MAX_LIMIT,
  SEARCH_POOL_SEARCH_MAX_LENGTH,
  SEARCH_POOL_TERMS_VERSION,
  SEARCH_POOL_WINDOW_DAYS,
  SearchPoolAccess,
  type SearchPoolBand,
  SearchPoolDemandBand,
  type SearchPoolPositions,
  type SearchPoolQuery,
  type SearchPoolQueryPage,
  type SearchPoolSetting,
  SITE_SEARCH_POOL_NOT_JOINED_CODE,
  SITE_SEARCH_POOL_QUERY_INVALID_CODE,
  SITE_SEARCH_POOL_SETTING_INVALID_CODE,
  SITE_SEARCH_POOL_SITE_BOUND_CODE,
} from "./admin-site-search-pool.js";
export {
  SITE_FINDING_IMPACT_DEFAULT_DAYS,
  SITE_FINDING_IMPACT_MAX_DAYS,
  SITE_FINDING_IMPACT_MIN_DAYS,
  SITE_SEARCH_VALUE_DEFAULT_DAYS,
  SITE_SEARCH_VALUE_MAX_DAYS,
  SITE_SEARCH_VALUE_MAX_GOALS,
  SITE_SEARCH_VALUE_MAX_PAGES,
  type SiteFindingImpact,
  type SiteFindingImpactPeriod,
  type SiteFindingImpactSource,
  SiteFindingImpactStatus,
  type SiteFindingImpactWindow,
  SiteSearchGoalStatus,
  type SiteSearchValue,
  type SiteSearchValuePage,
} from "./admin-site-search-value.js";
export {
  type SiteStatusComponent,
  type SiteStatusComponentStatus,
  type SiteStatusPage,
  type SiteStatusPageDraft,
  type SiteStatusPagePublication,
  type SiteStatusPageSelection,
  type SiteStatusPageSettings,
  type SiteStatusUpdate,
  type SiteStatusUpdateHistory,
  type SiteStatusUpdateRequest,
  siteStatusPagePublicUrl,
} from "./admin-site-status-page.js";
export {
  ACCESS_LOG_HOUR_INVALID_CODE,
  type AccessLogHourReplay,
  AccessLogHourStatus,
  type SiteAIPage,
  type SiteAIVisibility,
  SiteCrawlerIdentity,
  SiteReferrerClass,
  type SiteTraffic,
  type SiteTrafficCount,
  type SiteTrafficCoverage,
  type SiteTrafficCrawler,
  type SiteTrafficDay,
  SiteTrafficDayCoverage,
  type SiteTrafficReferrer,
  type SiteTrafficReferrerClass,
  type SiteTrafficSlowPath,
  type SiteTrafficTotals,
  TRAFFIC_OTHER_KEY,
} from "./admin-site-traffic.js";
export {
  SITE_KEYWORD_DEMAND_SOURCE_BING,
  SITE_KEYWORD_LIST_LIMIT_CODE,
  SITE_KEYWORD_LIST_NOT_FOUND_CODE,
  type SiteContentGap,
  type SiteContentGapCompetitor,
  SiteContentGapCoverage,
  type SiteContentGapPage,
  type SiteContentGapTopic,
  type SiteKeywordCluster,
  type SiteKeywordClusters,
  type SiteKeywordDemand,
  type SiteKeywordDemandSet,
  SiteKeywordDemandState,
  type SiteKeywordList,
  type SiteKeywordListRequest,
  type SiteKeywordLists,
  type SiteRelatedKeyword,
  type SiteRelatedKeywords,
  type SiteStrikingKeyword,
  type SiteTopicTrend,
  type SiteTopicTrendMonth,
  SiteTopicTrendSource,
  SiteTopicTrendStatus,
  SiteTrancoBand,
  type SiteWebDomain,
  SiteWebDomainRole,
  type SiteWebDomains,
  SiteWebInventoryStatus,
  type SiteWebPage,
  SiteWebPageSource,
  type SiteWebPages,
  type SiteWebPagesQuery,
} from "./admin-site-web-data.js";
export {
  type SubjectExport,
  type SubjectExportArtifactScope,
  SubjectExportClient,
  type SubjectExportCreateRequest,
  type SubjectExportDownloadResponse,
  type SubjectExportForceOptions,
  type SubjectExportListResponse,
  type SubjectExportScope,
  type SubjectExportStatus,
  type SubjectExportStoreProgress,
} from "./admin-subject-exports.js";
export {
  TenantStorageClient,
  type TenantStorageListResponse,
  type TenantStorageLocation,
} from "./admin-tenant-storage.js";
export {
  type TimePlan,
  TimePlanAdminClient,
  type TimePlanAllocation,
  type TimePlanAllocationBasis,
  type TimePlanAllocationPreview,
  type TimePlanAnnotation,
  type TimePlanAnnotationField,
  type TimePlanAnnotationInput,
  type TimePlanAnnotationListResponse,
  type TimePlanAnnotationSchema,
  type TimePlanAnnotationType,
  type TimePlanCalculationChange,
  type TimePlanCalculationReceipt,
  type TimePlanCommandRequest,
  type TimePlanCommandResult,
  type TimePlanCorrectedCommand,
  type TimePlanCreatedRun,
  type TimePlanDefinition,
  type TimePlanDefinitionBlock,
  type TimePlanDraftRequest,
  type TimePlanDraftRevisionRequest,
  type TimePlanHistoryResponse,
  type TimePlanListResponse,
  type TimePlanRedactionRequest,
  type TimePlanRevisionRequest,
  type TimePlanRun,
  type TimePlanRunBlock,
  type TimePlanRunRequest,
  type TimePlanStoredDefinition,
  type TimePlanThresholdCue,
  type TimePlanThresholdCueSeverity,
  type TimePlanTransition,
  type TimePlanVersion,
  validateTimePlanDefinition,
} from "./admin-timeplans.js";
export {
  USAGE_DEFAULT_LIMIT,
  USAGE_MAX_LIMIT,
  UsageAdminClient,
  type UsageCompletenessState,
  type UsageQuery,
  type UsageReport,
  type UsageRow,
  type UsageTotal,
} from "./admin-usage.js";
export {
  ANALYTICS_MAX_LABEL_FILTERS,
  ANALYTICS_MAX_RANGE_DAYS,
  ANALYTICS_RANGE_GROUP_BY,
  AnalyticsEventClient,
  type AnalyticsEventQueryRequest,
  type AnalyticsEventQueryResponse,
  type AnalyticsEventRangeBucket,
  type AnalyticsEventRangeQueryRequest,
  type AnalyticsEventRangeQueryResponse,
  type AnalyticsEventRow,
  type AnalyticsEventSourceSummary,
  type AnalyticsEventTiming,
  type AnalyticsLabelFilter,
  type AnalyticsQuerySource,
  type AnalyticsRangeQuerySource,
} from "./analytics-events.js";
export {
  BackendLifecycleClient,
  type BackendLifecycleDownloader,
  type BackendLifecycleRequester,
  type CompleteOffboardingOptions,
  type CompleteOffboardingResult,
  createVerifiedOffboardingExportReceiver,
  type OneTimeCredentialSecret,
  type PersistOffboardingExport,
  type PersistOneTimeCredentialSecret,
  type ReceiveAndVerifyOffboardingExport,
  type RotateCredentialOptions,
  type RotateCredentialResult,
  type VerifiedExportReceiverOptions,
  type VerifyZeroState,
  type ZeroStateReconciliationOptions,
  type ZeroStateReconciliationResult,
} from "./backend-lifecycle.js";
export {
  BrowserSignIn,
  type BrowserSignInConfig,
  type BrowserSignInEndpoints,
  type CustdDiscoveryDocument,
  type CustdDiscoverySignIn,
  createSignInCodeChallenge,
  DEFAULT_SIGN_IN_SCOPES,
  SIGN_IN_ERROR_CODES,
  SIGN_IN_STATUSES,
  type SignInCompletion,
  type SignInDiscoveryOptions,
  SignInError,
  type SignInErrorCode,
  type SignInRestoreResult,
  type SignInSession,
  type SignInStart,
  type SignInStartOptions,
  type SignInState,
  type SignInStatus,
  type SignInStorage,
  type SignOutOptions,
  type SignOutResult,
  signInConfigFromDiscovery,
} from "./browser-sign-in.js";
export type { CustdDownloadStream } from "./download-stream.js";
export {
  DEFAULT_PARSER_FRAMING_MAX_LINES,
  DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES,
  MAX_PARSER_FRAMING_LINES,
  MAX_PARSER_FRAMING_RECORD_BYTES,
  ParserClient,
  type ParserDefinition,
  type ParserDeleteResponse,
  type ParserFraming,
  type ParserFramingOutcome,
  type ParserFramingType,
  type ParserGeneratedFieldConfig,
  type ParserListResponse,
  type ParserPreset,
  type ParserPresetListResponse,
  type ParserPreviewDefinition,
  type ParserPreviewRequest,
  type ParserPreviewResponse,
  type ParserPreviewRow,
  type ParserSaveRequest,
  type ParserType,
} from "./parsers.js";
export {
  classifyReportingData,
  getReportingViewState,
  type ReportingDataState,
  type ReportingQueryState,
  type ReportingViewState,
  reportingQueryKey,
} from "./reporting-state.js";
export {
  checkRuntimeReadiness,
  type RuntimeReadinessCredentialResult,
  type RuntimeReadinessOAuthConfig,
  type RuntimeReadinessOptions,
  type RuntimeReadinessResult,
} from "./runtime-readiness.js";

export type EventContext = {
  page?: {
    url?: string;
    path?: string;
    title?: string;
    referrer?: string;
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
  };
  locale?: string;
  timezone?: string;
  ip?: string;
  appVersion?: string;
  networkState?: "offline" | "online" | "unknown";
};

export {
  createMobileAsyncQueueStorage,
  createMobileFlushTriggers,
  type MobileAppState,
  type MobileFlushTriggerOptions,
  type MobileKeyValueStorage,
  type MobileNetwork,
  type MobileNetworkState,
  type MobileSubscription,
} from "./mobile-adapter.js";
export {
  createMobileEvent,
  type MobileEventContext,
  type MobileEventInput,
  type MobileNetworkState as MobileEventNetworkState,
  type MobilePlatform,
  type MobileSubject,
} from "./mobile-context.js";
export { AsyncEventQueue, type AsyncQueueStorage } from "./mobile-queue.js";

export type EventEnvelope = {
  eventUuid?: string;
  eventTypeSlug: string;
  schemaVersion: string;
  timestamp: string;
  sessionId?: string;
  anonymousId?: string;
  userUuid?: string | null;
  companySlug?: string;
  /**
   * The environment this event came from. One credential serves every
   * environment, so this is how a preview build, a staging deploy, or a local
   * machine declares itself without provisioning another credential. It is sent
   * as the reserved `custd.environment` label, not as a field of its own.
   */
  environment?: string;
  labels?: Record<string, string>;
  context: EventContext;
  payload: Record<string, unknown>;
};

export type DogfoodEventInput = {
  eventTypeSlug: string;
  schemaVersion: string;
  companySlug: string;
  sourceSystem: string;
  sourceCompany: string;
  environment: string;
  correlationId?: string;
  strictPayloadKeys?: boolean;
  payload?: Record<string, unknown>;
};

// ProblemDetails is an RFC 9457 problem document (application/problem+json).
// The ingest API returns it for error responses and embeds it as the `error`
// field of a failed per-event batch result. detail/code/instance/traceId/fields
// are omitempty server-side and may be absent.
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  instance?: string;
  traceId?: string;
  fields?: Record<string, string>;
  retryability?: "none" | "bounded";
  nextAction?: {
    action: "none" | "poll" | "retry" | "rotate" | "escalate";
    pollAfterSeconds?: number;
    maxRetries?: number;
  };
  /** Present on a `machine_access_blocked` problem: the setting that refused the request. */
  machineAccess?: MachineAccessBlock;
};

type EventResult = {
  eventUuid?: string;
  success?: boolean;
  status?: number;
  error?: ProblemDetails;
};

type EventBatchResponse = {
  success?: boolean;
  results?: EventResult[];
};

/**
 * The declarative default data-scope target for one raw upload. Both fields are
 * registered immutable codes supplied as a pair, never numeric identities.
 */
export type RawSourceTarget = {
  subClient: string;
  resource: string;
};

/** One raw, line-delimited upload for the bound parser. */
export type RawIngestRequest = {
  content: string;
  /** Binds the parser executed for every line (X-Parser-UUID). */
  parserUuid: string;
  target?: RawSourceTarget;
  /**
   * Opts the upload into stable admission. Absent means the existing one-shot
   * unkeyed behavior with no safe replay.
   */
  idempotencyKey?: RawRequestIdempotencyKey;
};

/** The caller-supplied raw upload intent. */
export type RawIngestInput = {
  content: string;
  parserUuid: string;
  target?: RawSourceTarget;
};

/**
 * A standard raw-upload idempotency key: `<unix-milliseconds>:<uuid-v4>`. The
 * same key and the same body/parser/target let the backend return the accepted
 * receipt again instead of landing a second copy; a changed intent under the
 * same key is refused with a conflict. It carries no payload or credential.
 */
export type RawRequestIdempotencyKey = string;

/**
 * Mint a fresh key from the current time and a random UUIDv4. Mint it ONCE per
 * request object so a resend reuses the key; a genuinely repeated occurrence
 * needs a new request object and therefore a new key.
 */
export function createRawRequestIdempotencyKey(): RawRequestIdempotencyKey {
  return `${Date.now()}:${randomUUID()}`;
}

/** Mint one prepared request with a fresh, retained idempotency key. */
export function createRawIngestRequest(input: RawIngestInput): RawIngestRequest {
  return { ...input, idempotencyKey: createRawRequestIdempotencyKey() };
}

/**
 * The POST /api/v1/raw acceptance body. The route always answers 202 Accepted,
 * so the status alone is not per-record success: read `processed` and `failed`.
 */
export type RawIngestResult = {
  success: boolean;
  processed: number;
  failed: number;
};

export type ProducerOAuthConfig = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  audience?: string;
  scopes?: string[];
};

// ProvisionedProducerCredentials is the flat camelCase bundle Custd returns
// from the producer provisioning API. Pass it straight to
// CustdClient.fromProvisionedProducer without manual field mapping.
export type ProvisionedProducerCredentials = {
  companySlug: string;
  baseUrl: string;
  tokenUrl: string;
  audience?: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  environment?: string;
  producerSlug?: string;
  /** The environments this producer may send; empty when it may send any. */
  allowedEnvironments?: string[];
};

/** A rotated producer secret, with where to mint tokens with it. Shown once. */
export type ProducerSecretRotation = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  tokenUrl: string;
  audience: string;
};

export type ProducerProvisionListResponse = {
  producers: ProducerProvisionPublicClient[];
};

// RedactedProvisionedProducerCredentials is the display-safe view of a
// provisioned producer bundle, omitting the client secret.
export type RedactedProvisionedProducerCredentials = Omit<ProvisionedProducerCredentials, "clientSecret">;

export type DataSpaceCreate = {
  slug: string;
  companyName: string;
};

export type DataSpace = {
  slug: string;
  companyName: string;
  parentCompanySlug: string;
  enabled: boolean;
};

export type DataSpaceEntitlementState = {
  enabled: boolean;
  activeDataSpaces: number;
  maxActiveDataSpaces: number;
  maxActiveProducersPerDataSpace: number;
};

export type DataSpaceListResponse = {
  dataSpaces: DataSpace[];
  entitlement: DataSpaceEntitlementState;
};

/** The tenant's new data-space limits. */
export type DataSpaceEntitlementUpdateRequest = {
  enabled: boolean;
  maxActiveDataSpaces: number;
  maxActiveProducersPerDataSpace: number;
};

/** How complete a stored-usage measurement is, and which calculation produced it. */
export type StorageMeasurementState = {
  sourceWatermark: number;
  completenessState: string;
  calculationVersion: number;
};

/** One data space's retained storage. */
export type DataSpaceUsageRow = {
  slug: string;
  companyName: string;
  enabled: boolean;
  revokedAt?: string;
  measuredAt: string;
  retainedLogicalBytes: number;
  retainedEventCount: number;
  measurementState: StorageMeasurementState;
};

/** Retained storage across a parent tenant's data spaces. */
export type DataSpaceUsageSummary = {
  parentCompanySlug: string;
  retainedLogicalBytes: number;
  retainedEventCount: number;
  measuredAt: string;
  measurementState: StorageMeasurementState;
  dataSpaceCount: number;
  dataSpaces: DataSpaceUsageRow[];
};

export type ProducerProvisionCreate = {
  companySlug: string;
  producerSlug: string;
  displayName?: string;
  environment?: string;
  scopes?: string[];
  scopeTemplate?:
    | "events"
    | "schemas"
    | "managed-audit"
    | "managed-audit-reporting-read"
    | "managed-audit-reporting-subject-insight"
    | "managed-audit-event-read"
    | "site-insights"
    | "site-insights-read"
    | "site-ai-read"
    | "hosting-email-delivery"
    | "hosting-panel-read";
  /** Restricts the producer to these environments; omitted or empty allows every environment. */
  allowedEnvironments?: string[];
};

/** Where a data space erasure is in its life. */
export type DataSpaceErasureStatus = "requested" | "erasing" | "completed" | "failed";

/** The erasure request for one data space and how far it has got. */
export type DataSpaceErasure = {
  requestUuid: string;
  dataSpaceSlug: string;
  parentCompanySlug: string;
  status: DataSpaceErasureStatus;
  requestedAt: string;
};

/** Replaces a signing producer's Ed25519 public keys: one or two base64 keys, two while rotating. */
export type ProducerSigningKeysUpdate = {
  publicKeys: string[];
};

/** The public keys Custd now verifies a producer's signed events with. */
export type ProducerSigningKeys = {
  clientId: string;
  companySlug: string;
  publicKeys: string[];
  /** The keys' sha256 fingerprints, `sha256:<hex>`, in publicKeys order. */
  keyFingerprints: string[];
};

/** Whether a data space still accepts signed events. */
export type DataSpaceSigningState = "active" | "revoked" | "erased";

/** Whether a signing producer's events are accepted. */
export type SigningProducerState = "ready" | "awaiting_keys" | "cancelled";

/** The signed events ingest refused for one producer, by reason. */
export type SigningRefusalCounts = {
  bindingNotReady: number;
  bindingCancelled: number;
  invalidSignature: number;
  lastRefusedAt?: string;
};

/** One signing producer of a data space: its keys and its refusals. */
export type SigningProducerStatus = {
  clientId: string;
  state: SigningProducerState;
  keyFingerprints: string[];
  refusals: SigningRefusalCounts;
};

/** Whether a data space's signing producers can deliver events. */
export type DataSpaceSigningStatus = {
  dataSpaceSlug: string;
  parentCompanySlug: string;
  state: DataSpaceSigningState;
  erasedAt?: string;
  producers: SigningProducerStatus[];
};

/** Whether an adoption moved the Site or found it already moved. */
export type DataSpaceSiteAdoptionStatus = "adopted" | "already_adopted";

/** The result of moving a parent's Site into an owned data space. */
export type DataSpaceSiteAdoption = {
  siteUuid: string;
  dataSpaceSlug: string;
  parentCompanySlug: string;
  status: DataSpaceSiteAdoptionStatus;
  movedRecords: number;
  credentialClientIds: string[];
};

export type ProducerProvisionPublicClient = {
  clientId: string;
  companySlug: string;
  producerSlug: string;
  displayName?: string;
  scopes: string[];
  environment?: string;
  /** The environments this producer may send; empty when it may send any. */
  allowedEnvironments: string[];
};

export type ClientConfig = {
  baseUrl: string;
  /**
   * The environment this process sends from: the default for events that do not
   * declare their own. A credential is expected to carry every environment
   * unless an operator deliberately restricts it.
   */
  environment?: string;
  getToken?: (options?: RequestOptions) => string | Promise<string>;
  oauth?: ProducerOAuthConfig;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
  /**
   * The client company a system administrator's requests target. Admin routes
   * receive it as the `companySlug` query parameter unless the call names its own;
   * it never opens support context there. The ingest cleanup-job reads and cancel
   * name their tenant only through `X-Custd-Effective-Company`, so those calls send
   * it in that header, and the server then requires an active support grant for it.
   * Ordinary tenant callers leave it unset.
   */
  actingCompanySlug?: string;
  retry?: RetryOptions;
  batch?: BatchOptions;
  queue?: QueueOptions;
  compression?: CompressionOptions;
};

export type RequestOptions = {
  signal?: AbortSignal;
  /** Stable key for retry-safe POST operations supported by the API. */
  idempotencyKey?: string;
  /**
   * The platform user a machine credential acts for, sent as
   * X-Custd-Owning-User-UUID. Required by the /admin/auth-projects surface for a
   * machine caller; a human administrator's own token subject is the actor and
   * leaves it unset.
   */
  owningUserUuid?: string;
  /**
   * Receives the server's request identifier of this call's answer, accepted or refused, so a
   * caller can quote the request the server logged. A refusal also carries it as `requestId`.
   */
  metadata?: ResponseMetadata;
};

/** The server-side identifiers of one answer. `requestId` is empty when the server sent none. */
export type ResponseMetadata = { requestId: string };

export class AdminWorkflowError extends Error {
  readonly name = "AdminWorkflowError";

  constructor(
    readonly status: number,
    readonly reason: string,
    readonly code: string,
    readonly safeNextAction: string,
    /** The server's request identifier, to quote in a support request; empty when unknown. */
    readonly requestId = "",
  ) {
    let message = `custd: ${reason || "admin workflow request failed"} (status ${status})`;
    if (code) message += ` [code=${code}]`;
    if (safeNextAction) message += ` [safeNextAction=${safeNextAction}]`;
    super(message);
  }
}

export class CustdRequestError extends Error {
  readonly name = "CustdRequestError";
  readonly cause?: unknown;
  /**
   * The server's request identifier, to quote in a support request: X-Request-Id, or the
   * problem's traceId where a browser cannot read that header. Empty when the server never answered.
   */
  readonly requestId: string;

  constructor(
    readonly status: number | null,
    readonly code: string,
    readonly retryability: "none" | "bounded",
    readonly nextAction: NonNullable<ProblemDetails["nextAction"]>,
    readonly problem?: ProblemDetails,
    options?: { cause?: unknown; requestId?: string },
  ) {
    super(`custd: request failed [code=${code}]`);
    this.cause = options?.cause;
    this.requestId = options?.requestId ?? problem?.traceId ?? "";
  }

  get unavailable(): boolean {
    return (
      this.code === "oauth_unavailable" ||
      this.status === null ||
      this.status === 429 ||
      (this.status !== null && this.status >= 500)
    );
  }
}

/**
 * CustdRawAcceptanceUnknownError reports that a raw upload's acceptance could
 * not be determined: the connection failed before a response arrived, the 202
 * acceptance body was missing or malformed, or the response carried a status
 * that does not prove rejection. The request may or may not have landed, so
 * this error carries no retry guidance (`retryability` "none", `nextAction`
 * "escalate"): there is no verified occurrence identity, and replaying the POST
 * could double-land accepted records. The cause never carries the request
 * payload or a token.
 */
export class CustdRawAcceptanceUnknownError extends Error {
  readonly name = "CustdRawAcceptanceUnknownError";
  readonly retryability = "none" as const;
  readonly nextAction = { action: "escalate" as const };
  readonly cause?: unknown;
  /** The original operation idempotency key, when the request carried one. */
  readonly operationKey?: RawRequestIdempotencyKey;

  constructor(options?: { cause?: unknown; operationKey?: RawRequestIdempotencyKey }) {
    super("custd: raw upload acceptance is unknown; the request may or may not have landed and must not be replayed");
    this.cause = options?.cause;
    this.operationKey = options?.operationKey;
  }
}

export type PreparedDataState = "accepted" | "processing" | "ready" | "failed";
export type PreparedDataAvailability = "complete" | "partial" | "stale" | "unavailable";
export type PreparedDataNextAction = "none" | "poll" | "retry" | "rotate" | "escalate";
export type PreparedDataStatus = {
  tenantSlug: string;
  processingState: PreparedDataState;
  availability: PreparedDataAvailability;
  observedAt: string;
  watermark?: string;
  provenance: { owner: string; generation?: string; sourceUrn?: string; watermark?: string };
  retryability: "none" | "bounded";
  warnings?: Array<{ code: string; message: string }> | null;
  nextAction: { action: PreparedDataNextAction; pollAfterSeconds?: number; maxRetries?: number };
};
export type PreparedDataReceiptStatus = PreparedDataStatus & { receiptUuid: string };
export type PreparedDataOutputStatus = PreparedDataStatus & { outputUuid: string };
export type PreparedDataOutputList = { outputs: PreparedDataOutputStatus[] | null };
export type PreparedDataQueryEnvelope = { output: PreparedDataOutputStatus; data: RenderedWidgetData };

export type BrokerEnv = Record<string, string | undefined>;

export type BrokerEnvClientOptions = Omit<ClientConfig, "baseUrl" | "getToken" | "oauth"> & {
  baseUrl?: string;
  scopes?: string[];
};

export type CompressionOptions = {
  enabled?: boolean;
  thresholdBytes?: number;
};

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  retryOnStatuses?: number[];
};

export type BatchOptions = {
  maxBatchSize?: number;
  flushIntervalMs?: number;
};

export type QueueOptions = {
  enabled?: boolean;
  storage?: QueueStorage;
  maxQueueSize?: number;
  flushOnOnline?: boolean;
  flushTriggers?: Array<(flush: () => Promise<void>) => () => void>;
};

export type QueueStorage = {
  load: () => EventEnvelope[];
  save: (events: EventEnvelope[]) => void;
  clear: () => void;
};

/** Whether a tenant is a real customer or proof data that generated-data cleanup may remove. */
export type AdminTenantPurpose = "customer" | "generated_proof";

export type AdminTenantCreate = {
  slug: string;
  companyName: string;
  purpose?: AdminTenantPurpose;
};

export type AdminTenant = {
  slug: string;
  companyName: string;
  companyId: number;
  companyUuid: string;
  enabled: boolean;
  purpose: AdminTenantPurpose;
  autoCreateEnvironments: boolean;
};

export type AdminTenantListResponse = {
  tenants: AdminTenant[];
};

/** A tenant's storage allowance. Writes are refused past it only when hardLimitEnabled is set. */
export type StorageLimit = {
  includedStorageBytes: number;
  purchasedStorageBytes: number;
  warnPercent: number;
  hardLimitEnabled: boolean;
};

export type StorageLimitUpdateRequest = StorageLimit;

/** The content-free receipt for a deleted tenant's historical cleanup. */
export type TenantHistoricalCleanupReceipt = {
  companyId: number;
  requestedByKind: string;
  requestedAt: string;
  completedAt: string;
  finalState: string;
  perStore: OffboardingReceiptPerStore[];
  waiver?: TenantHistoricalCleanupWaiver;
  sha256: string;
};

export type TenantHistoricalCleanupWaiver = { role: string; timestamp: string };

export type AdminOAuthClientCreate = {
  clientId: string;
  companySlug: string;
  /**
   * Custd derives the least-privilege scope set from `purposeProfile` and sets
   * the matching client profile, so a caller states its intent rather than the
   * scope vocabulary. Pass `scopes` explicitly only when no purpose profile fits.
   */
  scopes?: string[];
  environment?: string;
  profile?: string;
  purposeProfile?: string;
  /** Binds a browser sign-in client to one Site. */
  siteUuid?: string;
};

export type AdminOAuthClient = {
  clientId: string;
  companySlug: string;
  scopes: string[];
  environment?: string;
  profile?: string;
  purposeProfile?: string;
  /** RFC 3339 creation time; tells apart two clients issued the same ID. */
  createdAt?: string;
};

/** What a person needs to sign a CLI or app in with a newly created client. */
export type AdminOAuthClientLoginSetup = {
  profileName: string;
  clientId: string;
  issuerUrl: string;
  apiUrl: string;
  audience: string;
  scopes: string[];
  redirectUris: string[];
  configInitCommand: string;
};

/** The created client. clientSecret is present once, for a confidential client only. */
export type AdminOAuthClientCreateResponse = {
  clientId: string;
  companySlug: string;
  scopes: string[];
  profile: string;
  purposeProfile?: string;
  clientSecret?: string;
  loginSetup?: AdminOAuthClientLoginSetup;
};

export type AdminOAuthClientListResponse = {
  clients: AdminOAuthClient[];
};

export type AdminOAuthClientSecretResponse = {
  clientSecret: string;
};

/**
 * The one data destination a browser site writes to. `scopeCode` and
 * `resourceCode` are resolved by the server and read back for display; they are
 * ignored on input.
 */
export type AdminSiteIngestTarget = {
  scopeUuid: string;
  resourceUuid: string;
  scopeCode?: string;
  resourceCode?: string;
};

export type AdminSiteCreate = {
  companySlug: string;
  name: string;
  identityMode: "cookieless" | "extended";
  allowedOrigins: string[];
  /** The environment events default to when they do not declare one. */
  environment?: string;
  /** Restricts the Site to these environments; omitted or empty allows every environment. */
  allowedEnvironments?: string[];
  rateLimitPerMinute?: number;
  retentionDays?: number;
  /** Required: a site whose write key cannot write anywhere is not a usable setup. */
  ingestTarget: AdminSiteIngestTarget;
};

export type AdminSite = {
  siteUuid: string;
  companySlug: string;
  name: string;
  identityMode: "cookieless" | "extended";
  allowedOrigins: string[];
  /** The environment the site's events default to. */
  environment: string;
  /** The environments the site may send; empty when it may send any. */
  allowedEnvironments: string[];
  rateLimitPerMinute: number;
  retentionDays: number;
  enabled: boolean;
  /** Absent for a site created before destinations existed. */
  ingestTarget?: AdminSiteIngestTarget;
};

/** Replaces a site's browser settings. Omit `allowedEnvironments` or `ingestTarget` to keep them. */
export type AdminSiteUpdate = {
  identityMode: "cookieless" | "extended";
  allowedOrigins: string[];
  environment: string;
  allowedEnvironments?: string[];
  ingestTarget?: AdminSiteIngestTarget;
};

export type AdminSiteCreateResponse = AdminSite & {
  writeKey: string;
};

export type AdminSiteListResponse = {
  sites: AdminSite[];
};

export type AdminSiteWriteKeyResponse = {
  writeKey: string;
};

export type AdminOAuthClientUpdateScopesRequest = {
  companySlug?: string;
  profile?: string;
  scopes: string[];
};

export type AdminSchemaIssue = {
  code?: string;
  path?: string;
  message: string;
};

export type AdminSchemaValidateRequest = {
  tenantSlug: string;
  eventTypeSlug: string;
  dialect: "jsonschema" | "avro";
  schemaJson: string;
};

export type AdminSchemaValidateResult = {
  valid: boolean;
  issues: AdminSchemaIssue[];
  suggestedAction: "register" | "fix_before_register" | "none" | string;
};

export type AdminSchemaEnableRequest = {
  tenantSlug: string;
  eventTypeSlug: string;
  version: string;
  enabledAt?: string;
};

/** Registers one schema version for a tenant's event type; `checksum` is the schema's SHA-256 hex. */
export type AdminSchemaRegisterRequest = {
  tenantSlug: string;
  eventTypeSlug: string;
  version: string;
  dialect: "jsonschema" | "avro";
  schemaJson: string;
  checksum: string;
  enabled: boolean;
};

export type AdminSchemaDryRunRequest = {
  tenantSlug: string;
  eventTypeSlug: string;
  dialect: "jsonschema" | "avro";
  schemaJson: string;
  samples: unknown[];
};

export type AdminSchemaDryRunResult = {
  passed: number;
  failed: number;
  issues: AdminSchemaIssue[];
};

/** A 404 on schema audit: the named tenant does not exist. */
export const SCHEMA_AUDIT_TENANT_NOT_FOUND_CODE = "schema_audit_tenant_not_found";
/** A 400 on schema audit: the request names no tenantSlug. */
export const SCHEMA_AUDIT_TENANT_SLUG_REQUIRED_CODE = "schema_audit_tenant_slug_required";

/** One compile pass of a schema under one validator. */
export type AdminSchemaCompileResult = {
  valid: boolean;
  issues: string[];
};

/** How the schema's recorded examples validate under the shared validator. */
export type AdminSchemaExampleValidation = {
  discovered: number;
  run: number;
  sameAccept: number;
  sameReject: number;
  deltas: number;
  issueCodes: string[];
};

/** One registered schema version's migration audit result. */
export type AdminSchemaAuditResult = {
  tenantSlug: string;
  eventTypeSlug: string;
  version: string;
  dialect: string;
  schemaChecksum: string;
  class: string;
  recommendedAction: string;
  issueCodes: string[];
  legacyCompile: AdminSchemaCompileResult;
  sharedCompile: AdminSchemaCompileResult;
  exampleValidation: AdminSchemaExampleValidation;
};

export type AdminSchemaAuditSummary = {
  total: number;
  compatible: number;
  needsMigration: number;
  blocked: number;
};

export type AdminSchemaAuditListResponse = {
  schemas: AdminSchemaAuditResult[];
  summary: AdminSchemaAuditSummary;
};

/** One field rule: what the tenant's privacy pipeline does to fieldPath. */
export type AdminPrivacyRule = {
  fieldPath: string;
  action: string;
  enabled: boolean;
  truncateLength?: number;
};

export type AdminPrivacyRulesResponse = {
  companySlug: string;
  enabled: boolean;
  applyMode: string;
  rules: AdminPrivacyRule[];
};

/** Replaces the tenant's whole privacy rule set. */
export type AdminPrivacyRuleUpdate = {
  companySlug: string;
  enabled: boolean;
  applyMode: string;
  rules: AdminPrivacyRule[];
};

export type AdminPrivacyIdentifierMapping = {
  identifierId: string;
  internalIdHash: string;
  internalIdHashPrefix: string;
  saltVersion: number;
  createdAt: string;
};

export type AdminPrivacyIdentifierMappingList = {
  companySlug: string;
  mappings: AdminPrivacyIdentifierMapping[];
};

// AdminPrivacyIdentifierMapRequest externalId is consumed once at the wire
// boundary; do not log or surface it through downstream consumers.
export type AdminPrivacyIdentifierMapRequest = {
  externalId: string;
};

/** The purposes a subject's consent is recorded for. */
export type AdminPrivacyConsentPurpose = "analytics" | "product_improvement" | "marketing";

/** One subject's consent decision for one purpose and source. */
export type AdminPrivacyConsentRecord = {
  subjectId: string;
  purpose: AdminPrivacyConsentPurpose;
  source: string;
  granted: boolean;
  recordedAt: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
};

export type AdminPrivacyConsentList = {
  companySlug: string;
  subjectId: string;
  records: AdminPrivacyConsentRecord[];
};

export type AdminPrivacyConsentRecordRequest = {
  companySlug: string;
  subjectId: string;
  purpose: AdminPrivacyConsentPurpose;
  source: string;
  granted: boolean;
  expiresAt?: string;
};

/** Which consent a revoke ends. Leaving `source` out revokes the purpose from every source. */
export type AdminPrivacyConsentRevokeRequest = {
  purpose: AdminPrivacyConsentPurpose;
  source?: string;
  companySlug?: string;
};

/** The latest evaluation of a storage alert rule against measured usage. */
export type AdminStorageAlertEvaluation = {
  evaluatedAt: string;
  measuredValue: number;
  breached: boolean;
  firedAt?: string;
};

export type AdminStorageAlertRule = {
  ruleId: string;
  tenantSlug: string;
  metric: string;
  thresholdPercent: number;
  channel: "email" | "webhook";
  emailRecipient?: string;
  enabled: boolean;
  evaluation?: AdminStorageAlertEvaluation;
  createdAt: string;
  updatedAt: string;
};

export type AdminStorageAlertRuleCreateRequest = {
  metric: string;
  thresholdPercent: number;
  channel: "email" | "webhook";
  /** Where an email-channel rule sends its alert. */
  emailRecipient?: string;
  enabled: boolean;
};

export type AdminStorageAlertRuleListResponse = {
  rules: AdminStorageAlertRule[];
};

export type AdminStorageAlertDelivery = { state: string; updatedAt?: string; error?: string };

export type AdminStorageAlertMeasurement = {
  limitBytes: number;
  measuredValue: number;
  thresholdPercent: number;
  warningState: string;
};

/** One storage alert that fired and how its delivery went. */
export type AdminStorageAlertEvent = {
  eventId: string;
  tenantSlug: string;
  ruleId?: string;
  metric: string;
  channel: "email" | "webhook";
  emailRecipient?: string;
  triggeredAt: string;
  measurement: AdminStorageAlertMeasurement;
  delivery: AdminStorageAlertDelivery;
};

export type AdminStorageAlertEventListResponse = { events: AdminStorageAlertEvent[] };

export type AdminAuditEvent = {
  /** Stable public audit event UUID. */
  eventId: string;
  tenantSlug: string;
  actorKind: string;
  actorReference?: string;
  actorDisplayName: string;
  actorRoles?: string[];
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: AdminAuditOutcome;
  correlationId?: string;
  operationId?: string;
  changes?: AdminAuditChange[];
  details?: Record<string, unknown>;
  network?: AdminAuditNetworkDisclosure;
  domainHistory?: AdminAuditDomainHistory;
  createdAt: string;
};

/** The domain state change an audit event recorded, from the resource's own history stream. */
export type AdminAuditDomainHistory = {
  source: string;
  sourceId: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  state?: string;
  previousState?: string;
  currentState?: string;
  streamVersion?: number;
  createdAt: string;
};

/** The next page's cursor; `cursor` is absent on the last page. */
export type AdminAuditListCursor = {
  cursor?: string;
};

export type AdminAuditOutcome = "attempted" | "success" | "failure" | "denied" | "pending" | "unknown";

export type AdminAuditDisclosureState = "available" | "redacted" | "not_recorded";

export type AdminAuditChange = {
  field: string;
  before?: unknown;
  after?: unknown;
};

export type AdminAuditNetworkDisclosure = {
  ipAddress?: string;
  ipAddressState: AdminAuditDisclosureState;
  userAgent?: string;
  userAgentState: AdminAuditDisclosureState;
};

export type AdminAuditRetentionDisclosure = {
  eventMaxAgeSeconds: number;
  ipAddressMaxAgeSeconds: number;
  userAgentMaxAgeSeconds: number;
};

export type AdminAuditListResponse = {
  events: AdminAuditEvent[];
  nextCursor: AdminAuditListCursor;
  coverageBeginsAt?: string;
  retention?: AdminAuditRetentionDisclosure;
};

export type AdminAuditListOptions = {
  scope?: "tenant" | "global";
  companySlug?: string;
  affectedTenantSlug?: string;
  since?: string;
  until?: string;
  actorKind?: string;
  actorReference?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AdminAuditOutcome;
  correlationId?: string;
  /** Only events attributed to this auth-project environment (realm). */
  environmentId?: string;
  limit?: number;
  cursor?: string;
};

/** The audit export as it arrives, in the requested format, with the server's request id. */
export type AdminAuditExportResponse = CustdDownloadStream;

export type AdminReportingPackAuditEvent = {
  action: string;
  actorReference?: string;
  actorDisplayName: string;
  resourceType: string;
  packKey: string;
  createdAt: string;
};

export type AdminReportingPackAuditListResponse = {
  events: AdminReportingPackAuditEvent[];
};

export type SelectorDefinition = {
  selector: string;
  /** Empty, with an empty selector, where the platform serialises an unset identity selector. */
  type: "string" | "integer" | "number" | "";
};

/** The unit a numeric selector or rendered metric value is expressed in. */
export type RenderedUnit =
  | "currency_per_unit"
  | "count"
  | "milliseconds"
  | "bytes"
  | "percent"
  | "currency"
  | "W"
  | "kW"
  | "Wh"
  | "kWh"
  | "V"
  | "A"
  | "L"
  | "Cel"
  | "L/s"
  | "score";

/** How a reporting-pack metric is computed. */
export type PackMetricKind =
  | "count"
  | "unique_count"
  | "rate"
  | "latency"
  | "percentile"
  | "failure_ratio"
  | "freshness_age"
  | "latest_value"
  | "probability"
  | "quantile"
  | "credible_interval"
  | "forecast_date"
  | "value_of_information";

/** The accounting or measurement calculation a reporting-pack metric applies. */
export type PackMetricCalculation =
  | "usage_charge"
  | "marginal_rate"
  | "projection"
  | "purchased_vs_used"
  | "observed_balance"
  | "projected_balance"
  | "allocated_recovery"
  | "correction_count"
  | "count"
  | "failure_count"
  | "flow"
  | "distinct_count"
  | "sum"
  | "average"
  | "percentile"
  | "ratio"
  | "latest"
  | "minimum"
  | "maximum"
  | "firstLastDelta"
  | "timeWeightedAverage"
  | "rate"
  | "integral";

/** A measurement series' canonical unit; By is bytes and 1 is a dimensionless count. */
export type CanonicalUnit = "W" | "kW" | "Wh" | "kWh" | "V" | "A" | "L" | "Cel" | "By" | "1";

/** How a reporting-pack template aggregates its source rows. */
export type PackTemplateAggregation = "count" | "flow" | "distinct_count" | "sum" | "average" | "percentile" | "ratio";

export type NumericSelector = SelectorDefinition & {
  unit: RenderedUnit;
};

export type IdentitySelectors = {
  subject?: SelectorDefinition;
  session?: SelectorDefinition;
  entity?: SelectorDefinition;
  cohort?: SelectorDefinition;
  correlation?: SelectorDefinition;
};

export type FilterDefinition = {
  dimension: string;
  operators: ("eq" | "neq" | "in" | "contains")[];
};

export type SubjectScopeRule = {
  required: boolean;
  dimension: string;
};

export type MatchPredicate = {
  selector: string;
  exact?: string;
  anyOf?: string[];
  nonEmpty?: boolean;
  pattern?: string;
};

export type FlowRule = {
  key: string;
  correlationSelector: string;
  familySelector?: string;
  familyValue?: string;
  stepSelector: string;
  startMarkers: string[];
  completionMarkers: string[];
  includeUncorrelated: boolean;
};

export type PackMetric = {
  key: string;
  label: string;
  kind: PackMetricKind;
  unit?: string;
  description?: string;
  calculation: PackMetricCalculation;
  numeric?: NumericSelector;
  distinct?: SelectorDefinition;
  measurementKind?: "gauge" | "monotonicCounter" | "intervalIncrement" | "state";
  maximumGapSeconds?: number;
  resetPolicy?: "as_increment" | "reject" | "rollover";
  rolloverAt?: number;
  canonicalUnit?: CanonicalUnit;
  percentile?: number;
  numeratorMetric?: string;
  denominatorMetric?: string;
  seriesKey?: string;
  hierarchyRootKey?: string;
  match?: MatchPredicate[];
  flowResult?: "steps" | "starts" | "completions" | "drop_offs" | "completion_rate" | "uncorrelated";
};

export type PackDimension = {
  key: string;
  label: string;
  description?: string;
  selector?: string;
  allowedValuePattern?: string;
  fallback?: string;
  maxCardinality?: number;
  labelDefinitionKey?: string;
  labelDefinitionUuid?: string;
  labelValueUuids?: string[];
};

export type PackTemplate = {
  name: string;
  allowedMetrics: string[];
  allowedDimensions?: string[];
  allowedFilters?: FilterDefinition[];
  sourceModes: ("auto" | "postgres" | "duckdb")[];
  maxRows: number;
  defaultRange?: string;
  subjectScope?: SubjectScopeRule;
  compositionRules?: string[];
  eventTypes: string[];
  aggregation: PackTemplateAggregation;
  flowRule?: string;
};

export type TrustDiagnostics = {
  safeFields: string[];
  redactionGuard: string[];
};

export type ProofProfile = {
  key: string;
  templates: string[];
  safeMetadataFields: string[];
  forbiddenFields: string[];
  outputLayout: string;
};

export type RollupDimension = {
  slot: number;
  dimension: string;
  selector: string;
  allowedValuePattern?: string;
};

export type RollupRule = {
  family: string;
  templates?: string[];
  metric: string;
  sourceEventType: string;
  match?: MatchPredicate[];
  dimensions?: RollupDimension[];
  completenessRequired: boolean;
};

export type PresentationPresetSelection = {
  presetId: "forecast_convergence_v1" | "anomaly_reference_v1" | "descriptive_driver_v1" | "uncertainty_reference_v1";
  version: number;
  nonColorEncoding: "line_symbol_label" | "signed_bar_label" | "band_boundary_label";
  summaryTemplateId:
    | "forecast_window_evidence"
    | "anomaly_reference_evidence"
    | "descriptive_driver_evidence"
    | "uncertainty_reference_evidence";
};

export type PackWidgetDefinition = {
  key: string;
  title: string;
  kind: string;
  template: string;
  metrics: string[];
  dimensions?: string[];
  presentation?: PresentationPresetSelection;
};

export type DashboardSharePolicy = {
  relativeRanges?: ("1d" | "7d" | "14d" | "30d" | "90d")[];
  comparisonPresets?: ("previous_period" | "previous_year")[];
};

export type DashboardInteractionRule = {
  key: string;
  sourceWidget: string;
  targetWidget: string;
  dimension: string;
  action: "filter" | "drill_down";
  linkedFilterGroup: string;
  comparisonPreset?: "previous_period" | "previous_year";
  resetBehavior: "interaction" | "dashboard";
};

export type NarrativeValueReference = {
  widgetKey: string;
  value: "primary" | "delta";
};

export type NarrativeBlock = {
  text: string;
  references?: NarrativeValueReference[];
};

export type ReportSectionDefinition = {
  key: string;
  title: string;
  layout: "lead" | "grid" | "detail";
  columnSpan: number;
  widgetKeys?: string[];
  narrative?: NarrativeBlock[];
};

export type ExecutiveReportDefinition = {
  recipe: "blank" | "weekly-performance" | "operations-health" | "forecast-decision";
  primaryWidgetKey: string;
  primaryMetricKey: string;
  primaryLabel: string;
  primaryUnit: string;
  scopeLabel: string;
  comparisonBasis: "none" | "previous-period" | "target";
  comparisonLabel?: string;
  targetValue?: number;
  targetUnit?: string;
  findings?: string[];
  actions?: string[];
  supportingWidgetKeys?: string[];
};

export type PackDashboardDefinition = {
  key: string;
  packKey?: string;
  exportFormats?: string[];
  title: string;
  description?: string;
  group?: string;
  defaultRange: string;
  refreshSeconds: number;
  requiredScopes: string[];
  widgets: PackWidgetDefinition[];
  interactions?: DashboardInteractionRule[];
  sharePolicy?: DashboardSharePolicy;
  sections?: ReportSectionDefinition[];
  executive?: ExecutiveReportDefinition;
};

export type RedactionRule = {
  sourceSystem: string;
  sourceEventType: string;
  selectorFields: string[];
  allowedFields: string[];
  reasonClasses: string[];
  resultShape: string;
};

export type TransitionRule = {
  key: string;
  identity: "subject" | "session" | "correlation";
  stepSelector: string;
  steps: string[];
  maxDurationMs: number;
  maxEvents: number;
};

export type ActivationRule = {
  key: string;
  identity: "subject" | "session" | "correlation";
  predicate: MatchPredicate;
  cohortWindowDays: number;
};

export type RetentionRule = {
  key: string;
  activationRule: string;
  returnWindowDays: number[];
  returnPredicate: MatchPredicate;
};

export type ActivityRule = {
  key: string;
  identity: "subject" | "session" | "correlation";
  bucketDays: number;
};

export type ObservationSource = { key: string; label: string };

export type ObservationAsset = { key: string; label: string };

export type SourceSeries = { sourceKey: string; sourceSeriesKey: string; priority: number };

export type SemanticSeries = {
  key: string;
  assetKey?: string;
  assetKeys?: string[];
  measurementKind: "gauge" | "monotonicCounter" | "intervalIncrement" | "state";
  canonicalUnit: CanonicalUnit;
  allowedSourceUnits: CanonicalUnit[];
  expectedCadenceSeconds: number;
  maximumGapSeconds: number;
  sources: SourceSeries[];
};

export type ObservationContract = {
  version: number;
  sources: ObservationSource[];
  assets: ObservationAsset[];
  series: SemanticSeries[];
};

export type SourceReconciliation = {
  version: number;
  tenantKey: string;
  seriesKey: string;
  canonicalUnit?: CanonicalUnit;
  mode: "priority" | "freshness" | "availability" | "agreement";
  maxAgeSeconds: number;
  absoluteTolerance?: number;
  relativeTolerance?: number;
  sources: SourceSeries[];
};

export type AssetNode = { tenantKey: string; key: string; label: string };

export type AssetHierarchyEdge = { tenantKey: string; parentKey: string; childKey: string; mode: string };

export type AssetHierarchy = {
  version: number;
  tenantKey: string;
  maxDepth?: number;
  nodes: AssetNode[];
  edges?: AssetHierarchyEdge[];
};

export type RateTier = { lowerBound: number; upperBound?: number; pricePerUnit: number };

export type AllocationTarget = { seriesKey: string; weight: number };

export type RoundingMode = "half_up" | "half_even" | "down" | "up";

export type RoundingPolicy = { mode: RoundingMode; decimalPlaces: number };

export type SteppedRateSchedule = {
  key: string;
  usageMetric: string;
  usageUnit: CanonicalUnit;
  timezone: string;
  billingBoundary: "calendar_month" | "calendar_day";
  effectiveFrom: string;
  effectiveTo?: string;
  currency: string;
  tiers: RateTier[];
  rounding: RoundingPolicy;
};

export type AllocationRule = {
  key: string;
  sourceSeriesKey: string;
  targets: AllocationTarget[];
  rounding: RoundingPolicy;
};

export type AccountingContract = {
  version: number;
  usageMetric: string;
  schedules: SteppedRateSchedule[];
  allocations?: AllocationRule[];
};

/**
 * The canonical reporting-pack definition, mirroring libs/go/reporting.Pack.
 * Every contracted field is carried so a definition round-trips losslessly
 * through create/validate/preview/publish; unknown extension fields are the only
 * thing a decode may drop.
 */
export type PackDefinition = {
  key: string;
  displayName: string;
  owner: string;
  version: number;
  enabled: boolean;
  eventTypes: string[];
  metrics: PackMetric[];
  dimensions: PackDimension[];
  templates: PackTemplate[];
  flowRules?: FlowRule[];
  rollupRules?: RollupRule[];
  dashboards?: PackDashboardDefinition[];
  exportFormats?: string[];
  trust: TrustDiagnostics;
  redactionRules?: RedactionRule[];
  proof: ProofProfile;
  identity?: IdentitySelectors;
  transitionRules?: TransitionRule[];
  activationRules?: ActivationRule[];
  retentionRules?: RetentionRule[];
  activityRules?: ActivityRule[];
  observation?: ObservationContract;
  reconciliations?: SourceReconciliation[];
  assetHierarchy?: AssetHierarchy;
  accounting?: AccountingContract;
};

/** One client-selectable binding descriptor a setup template renders. */
/** Whether one published reporting-pack generation still validates against the current contracts. */
export type ReportingPackGenerationValidity = {
  id: number;
  packKey: string;
  generationNumber: number;
  state: string;
  validationError?: string;
};

export type ReportingPackGenerationValidityListResponse = { generations: ReportingPackGenerationValidity[] };

export type ReportingPackSetupBindingField = { key: string; label: string; required: boolean };

/** The typed log-observability bindings a client selects. Never a dictionary. */
export type LogObservabilityBindings = {
  eventType: string;
  severityField: string;
  resourceField: string;
};

/** One reviewed setup template: its canonical definition plus selectable bindings. */
export type ReportingPackSetupTemplate = {
  kind: string;
  displayName: string;
  definition: PackDefinition;
  bindings: ReportingPackSetupBindingField[];
};

export type ReportingPackSetupTemplateListResponse = { templates: ReportingPackSetupTemplate[] };

export type ReportingPackSetupTemplateBindRequest = { bindings: LogObservabilityBindings };

export type ReportingPackSetupTemplateBindResponse = { kind: string; definition: PackDefinition };

export type ReportingPackDraft = {
  id: number;
  revision: number;
  definition: PackDefinition;
  validationError?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportingPackDraftCreateRequest = {
  definition: PackDefinition;
};

export type ReportingPackDraftUpdateRequest = {
  definition: PackDefinition;
  expectedRevision: number;
};

export type ReportingPackDraftListResponse = {
  drafts: ReportingPackDraft[];
};

export type ReportingPackValidateResponse = {
  valid: boolean;
};

/** The widget query a preview renders: the same request the analytics query endpoint takes. */
export type ReportingPackPreviewQueryHint = ReportingQueryRequest;

export type ReportingPackPreviewRequest = {
  definition: PackDefinition;
  tenantSlug: string;
  query: ReportingPackPreviewQueryHint;
};

/** The preview envelope: the rendered widget under `data`, aggregate-only with no raw rows. */
export type ReportingPackPreviewResponse = {
  data: RenderedWidgetData;
  executive?: ExecutiveReport;
  presentation?: PresentationPresetSelection;
};

export type ExecutiveReport = {
  recipe: "blank" | "weekly-performance" | "operations-health" | "forecast-decision";
  title: string;
  tenantDisplayName: string;
  asOf: string;
  generatedAt: string;
  period: { label: string; from?: string; to?: string };
  primary: {
    label: string;
    scope: string;
    unit: string;
    value: RenderedMetricValue;
    periodTotal: RenderedMetricValue;
  };
  comparison: {
    available: boolean;
    basis: "none" | "previous-period" | "target";
    label: string;
    value?: RenderedMetricValue;
    percentChange?: number;
    targetValue?: number;
  };
  confidence: {
    status: "healthy" | "partial" | "unavailable" | "unknown";
    coverage: string;
    freshness: string;
    completeness: string;
    warnings?: string[];
  };
  findings?: string[];
  actions?: string[];
  supportingWidgets?: string[];
};

export type ReportingPackGeneration = {
  id: number;
  generationNumber: number;
  sourceDraftId: number;
  definition: PackDefinition;
  state: string;
  createdAt?: string;
};

export type ReportingPackGenerationStatusDetail = {
  id: number;
  generationNumber: number;
  packKey: string;
  state: string;
};

export type ReportingPackGenerationAcknowledgement = {
  accepted: boolean;
  consumer: string;
  errorDetail?: string;
  observedAt?: string;
  observedGenerationId: number;
};

export type ReportingPackGenerationStatusResponse = {
  generation: ReportingPackGenerationStatusDetail;
  acknowledgements: ReportingPackGenerationAcknowledgement[];
};

export type ReportingPackMaterializationProvenance = {
  status: string;
  definitionFingerprint: string;
  sourceCoverageCount: number;
};

export type ReportingPackRollupProvenance = {
  generationId: number;
  definitionFingerprint: string;
  tenantSlug: string;
  materializations: ReportingPackMaterializationProvenance[];
};

export type ProducerReservation = {
  producerSlug: string;
  parentCompanySlug: string;
  childCompanySlug: string;
  claimedByClientId?: string;
  status: "pending" | "claimed" | "released" | "expired";
  reservedAt: string;
  expiresAt: string;
  maxTtlSeconds: number;
};

export type ProducerReservationListResponse = {
  reservations: ProducerReservation[];
};

export type ProducerReservationCreateRequest = {
  producerSlug: string;
  ttlSeconds?: number;
};

export type ProducerReservationClaimRequest = {
  claimedByClientId: string;
};

export type MeasurementProjectCreate = {
  /** The tenant a system administrator creates the project for. */
  companySlug?: string;
  projectCode: string;
  name: string;
  description?: string;
  kind: string;
  series: MeasurementSeriesCreate[];
  target: MeasurementTargetCreate;
};

export type MeasurementProject = {
  projectUuid: string;
  projectCode: string;
  name: string;
  description: string;
  kind: string;
  status: string;
  delivery: MeasurementProjectDelivery;
  run: MeasurementProjectRun;
  series?: MeasurementSeries[];
  target?: MeasurementTarget;
  createdAt: string;
  updatedAt: string;
};

/** What done means for a project, and when it is due or was completed. */
export type MeasurementProjectDelivery = {
  definitionOfDone: string;
  targetDate?: string;
  completedAt?: string;
};

/** How the project forecasts, and the series root it forecasts from. */
export type MeasurementProjectRun = {
  forecastMethod?: string;
  seriesRootUuid?: string;
  similar: boolean;
};

export type MeasurementSeries = {
  seriesUuid: string;
  seriesCode: string;
  name: string;
  unitSlug: string;
  unitLabel?: string;
  completionDirection: string;
  source: string;
};

export type MeasurementTarget = {
  targetUuid: string;
  targetCode: string;
  name: string;
  targetValue: number;
  targetDate?: string;
  completedAt?: string;
  state: string;
};

export type MeasurementProjectListResponse = {
  projects: MeasurementProject[];
};

export type MeasurementSeriesCreate = {
  seriesCode: string;
  name: string;
  unitSlug: string;
  unitLabel?: string;
  completionDirection: string;
  source: string;
};

export type MeasurementTargetCreate = {
  targetCode: string;
  name: string;
  targetValue: number;
  targetDate?: string;
  state: string;
};

export type MeasurementObservationInput = {
  seriesUuid: string;
  observedAt: string;
  value: number;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
};

export type MeasurementObservationBulkRequest = {
  rows: MeasurementObservationInput[];
};

export type MeasurementObservationResult = {
  rowIndex: number;
  success: boolean;
  status?: number;
  observationUuid?: string;
  type?: string;
  title?: string;
  detail?: string;
};

/** Each row's outcome. completedTargetUuid names a target an accepted observation reached. */
export type MeasurementObservationBulkResponse = {
  importId: string;
  accepted: number;
  rejected: number;
  results: MeasurementObservationResult[];
  completedTargetUuid?: string;
};

export type MeasurementCSVImportResponse = MeasurementObservationBulkResponse;

export type SchemaValidationIssue = {
  path: string;
  keyword: string;
  message: string;
  schemaLocation: string;
  instanceLocation: string;
  severity: string;
};

export type SchemaExampleResult = {
  index: number;
  valid: boolean;
  class: string;
  oldValid: boolean;
  newValid: boolean;
  issueCodes: string[];
  issues: SchemaValidationIssue[];
};

export type SchemaValidationRequest = {
  slug?: string;
  name?: string;
  version?: string;
  jsonSchema: string;
  examples?: Array<Record<string, unknown>>;
};

export type SchemaValidationResponse = {
  valid: boolean;
  schemaValid: boolean;
  issues: SchemaValidationIssue[];
  warnings: SchemaValidationIssue[];
  exampleResults: SchemaExampleResult[];
  normalizedSchema: string;
  dialect: string;
  checksum: string;
  wouldCreateEventType: boolean;
  wouldCreateVersion: boolean;
  conflicts: Array<{ field: string; message: string }>;
  validatorEngine: string;
  validatorVersion: string;
  schemaChecksum: string;
  schemaDialect: string;
};

export type SchemaInferenceRequest = {
  samples: Array<Record<string, unknown>>;
};

export type SchemaInferenceResponse = {
  valid: boolean;
  issues: SchemaValidationIssue[];
  inferenceWarnings: SchemaValidationIssue[];
  candidateSchema: string;
  validatorEngine: string;
  validatorVersion: string;
  schemaChecksum: string;
  schemaDialect: string;
};

export type SendTestEventResponse = {
  success: boolean;
  eventUuid: string;
};

/** A dashboard as the analytics API serves it: the same definition a reporting pack declares. */
export type ReportingDashboard = PackDashboardDefinition;

export type ReportingWidget = PackWidgetDefinition;

export type ReportingQueryRequest = {
  dashboardKey?: string;
  widgetKey?: string;
  template: string;
  metrics: string[];
  dimensions?: string[];
  filters?: ReportingFilter[];
  from?: string;
  to?: string;
  rangeDays?: number;
  maxRows?: number;
  countOnly?: boolean;
  comparison?: "previous_period" | "previous_year";
};

export type ReportingFilter = {
  dimension: string;
  operator: string;
  value?: string;
};

export type SubjectInsightRequest = {
  template: string;
  subject: string;
  from?: string;
  to?: string;
  rangeDays?: number;
};

export type SubjectInsightResponse = {
  data: RenderedWidgetData;
};

export type RenderedWidgetData = {
  buckets: RenderedWidgetBucket[];
  value: RenderedMetricValue;
  emailDelivery?: ReportingEmailDelivery;
  labelMetadata?: ReportingLabelMetadata[];
  metadata?: ReportingQueryMetadata;
  sources?: ReportingSourceSummary[];
  warnings?: string[];
  queryDurationMs: number;
  parquetUriCount?: number;
  snapshotAgeMs: number;
  eventLagP95Ms: number;
  delta?: RenderedMetricValue;
  deltaPercent?: number;
  deltaLabel?: string;
  secondaryLabel?: string;
  trust?: RenderedReportingTrust;
  visual?: unknown;
};

export type RenderedReportingTrust = {
  status: string;
  dataFreshness: string;
  retryability: "none" | "bounded" | string;
  nextAction: ReportingNextActionHint;
  lastExport?: string;
  schemaVersion?: string;
  contractVersion?: string;
  rollupState: string;
  queryWarnings?: string[];
  coverage: string;
  permissionClass?: string;
  captureState: string;
  consentState: string;
  exportState: string;
  partialReason?: string;
  unavailableReason?: string;
};

export type ReportingNextAction = "none" | "poll" | "retry" | "rotate" | "escalate" | string;

export type ReportingNextActionHint = {
  action: ReportingNextAction;
  pollAfterSeconds?: number;
  maxRetries?: number;
};

export type RenderedWidgetBucket = {
  date: string;
  value: RenderedMetricValue;
  source: string;
  queryDurationMs: number;
  parquetUriCount?: number;
  message?: string;
  secondary?: RenderedMetricValue;
};

export type RenderedMetricValue = {
  value: number;
  unit: RenderedUnit;
  currency?: string;
  sampleCount: number;
  dataSufficiency: "unknown" | "sufficient" | "partial" | "insufficient";
  complete: boolean;
  truncated?: boolean;
  trust?: ReportingTemporalTrust;
};

/** One reporting source's reading in a reconciliation. */
export type ReportingSourceContribution = {
  sourceKey: string;
  sourceSeriesKey: string;
  availability: "available" | "unavailable";
  value?: number;
  unit?: string;
  observedAt?: string;
  freshnessSeconds?: number;
  stale?: boolean;
  selected?: boolean;
};

/** How far the reconciled sources disagree. */
export type ReportingSourceDivergence = {
  detected: boolean;
  absoluteDifference?: number;
  relativeDifference?: number;
};

/** Which source a reconciled value came from, and how its alternatives compared. */
export type ReportingReconciliation = {
  tenantKey: string;
  seriesKey: string;
  status: "available" | "stale" | "unavailable";
  availability: "available" | "unavailable";
  value?: number;
  unit?: string;
  observedAt?: string;
  selectedSourceKey?: string;
  selectedSourceSeries?: string;
  contributingSources?: ReportingSourceContribution[];
  divergence: ReportingSourceDivergence;
};

/** The time coverage and freshness behind one rendered value. */
export type ReportingTemporalTrust = {
  calculationVersion?: string;
  coverageStart?: string;
  coverageEnd?: string;
  sourceRange?: { start: string; end: string };
  windowCoverage?: number;
  freshnessMs?: number;
  reconciliation?: ReportingReconciliation;
  warnings?: string[];
};

/** The delivery outcome of one email recipient, by opaque recipient id. */
export type ReportingEmailDeliveryRecipient = {
  recipientId: string;
  outcome: "deferred" | "remote_accepted" | "terminal_failure";
  occurredAt: string;
};

export type ReportingEmailDelivery = {
  complete: boolean;
  recipients: ReportingEmailDeliveryRecipient[];
};

/** The display names of one data label a widget grouped by. */
export type ReportingLabelMetadata = {
  definitionUuid: string;
  key: string;
  displayName: string;
  sensitivity: string;
  values: Array<{ uuid: string; displayName: string }>;
};

export type ReportingQueryMetadata = {
  resolvedTemplate: string;
  rangeStart?: string;
  rangeEnd?: string;
  effectiveMaxRows: number;
  returnedRows: number;
  returnedBuckets: number;
  coveredWindows: number;
};

export type ReportingSourceSummary = {
  kind: string;
  count: number;
  coverageStart?: string;
  coverageEnd?: string;
  completeness: string;
};

export type ReportingWidgetData = RenderedWidgetData;
export type ReportingTrust = RenderedReportingTrust;

type AdminSiteWire = Omit<AdminSite, "allowedOrigins" | "allowedEnvironments"> & {
  allowedOrigins: string[] | null;
  allowedEnvironments: string[] | null;
  writeKey?: unknown;
};

function publicAdminSite(site: AdminSiteWire): AdminSite {
  const { writeKey: _writeKey, ...safeSite } = site;
  return {
    ...safeSite,
    allowedOrigins: site.allowedOrigins ?? [],
    allowedEnvironments: site.allowedEnvironments ?? [],
  };
}

export class MemoryQueueStorage implements QueueStorage {
  private events: EventEnvelope[] = [];

  load(): EventEnvelope[] {
    return [...this.events];
  }

  save(events: EventEnvelope[]): void {
    this.events = [...events];
  }

  clear(): void {
    this.events = [];
  }
}

export class LocalStorageQueueStorage implements QueueStorage {
  private key: string;

  constructor(key = "custd_event_queue") {
    this.key = key;
  }

  load(): EventEnvelope[] {
    if (typeof localStorage === "undefined") {
      return [];
    }
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as EventEnvelope[];
      }
    } catch {
      return [];
    }
    return [];
  }

  save(events: EventEnvelope[]): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(this.key, JSON.stringify(events));
  }

  clear(): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.removeItem(this.key);
  }
}

export class CustdClient {
  public readonly admin: AdminNamespace;
  public readonly provisioning: ProvisioningNamespace;
  public readonly reporting: ReportingNamespace;
  public readonly schemas: SchemaNamespace;
  public readonly analytics: AnalyticsEventClient;
  public readonly parsers: ParserClient;
  public readonly measurement: MeasurementClient;
  public readonly ingestOperations: IngestOperationsClient;
  public readonly publicReads: PublicReadClient;
  public readonly storefronts: StorefrontClient;
  private baseUrl: string;
  private getToken: (options?: RequestOptions) => string | Promise<string>;
  private fetchImpl: typeof fetch;
  private defaultHeaders: Record<string, string>;
  private actingCompanySlug: string;
  private retry: Required<RetryOptions>;
  private batch: BatchOptions | undefined;
  private queueEnabled: boolean;
  private queueStorage: QueueStorage;
  private queue: EventEnvelope[] = [];
  private maxQueueSize: number;
  private flushOnOnline: boolean;
  private onlineHandler: (() => void) | null = null;
  private compressionEnabled: boolean;
  private compressionThresholdBytes: number;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private removeFlushTriggers: Array<() => void> = [];
  private oauthToken: { value: string; expiresAtMs: number } | null = null;

  private readonly config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    const fetchImpl = config.fetch ?? globalThis.fetch;
    this.fetchImpl = (input, init) => fetchImpl(input, init);
    assertSecureOrLocalHTTP(this.baseUrl, "baseUrl");
    if (config.oauth) {
      assertSecureOrLocalHTTP(config.oauth.tokenUrl, "tokenUrl");
      this.getToken = (options) => this.fetchOAuthToken(config.oauth as ProducerOAuthConfig, options);
    } else if (config.getToken) {
      this.getToken = config.getToken;
    } else {
      throw new Error("custd: getToken or oauth config is required");
    }
    // The SDK's own identity is authoritative: a caller may add default
    // headers, but cannot accidentally drop the release Custd records.
    this.defaultHeaders = { ...(config.defaultHeaders ?? {}), "X-Custd-Sdk": SDK_IDENTITY };
    this.actingCompanySlug = config.actingCompanySlug?.trim() ?? "";
    this.retry = normalizeRetryOptions(config.retry);
    this.batch = config.batch;
    this.queueEnabled = config.queue?.enabled ?? config.batch != null;
    this.queueStorage = config.queue?.storage ?? new MemoryQueueStorage();
    this.maxQueueSize = config.queue?.maxQueueSize ?? 1000;
    this.flushOnOnline = config.queue?.flushOnOnline ?? true;
    this.compressionEnabled = config.compression?.enabled ?? true;
    this.compressionThresholdBytes = config.compression?.thresholdBytes ?? 1024;
    this.admin = new AdminNamespace(
      (method, path, body, options) => this.adminRequest(method, path, body, options),
      (method, path, body, options) => this.apiRequest(method, path, body, options),
      (path, options) => this.offboardingDownload(path, options),
      (path, options) => this.auditExportDownload(path, options),
    );
    this.provisioning = new ProvisioningNamespace((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.reporting = new ReportingNamespace(
      (method, path, body, options) => this.apiRequest(method, path, body, options),
      (path, options) => this.apiDownload(path, options),
    );
    this.storefronts = new StorefrontClient((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.schemas = new SchemaNamespace((method, path, body) => this.apiRequest(method, path, body));
    this.analytics = new AnalyticsEventClient((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.parsers = new ParserClient((method, path, body, options) => this.apiRequest(method, path, body, options));
    this.measurement = new MeasurementClient((method, path, body, options) =>
      this.apiRequest(method, path, body, options),
    );
    this.ingestOperations = new IngestOperationsClient(
      (method, path, body, options, headers) => this.apiRequest(method, path, body, options, headers),
      this.actingCompanySlug,
    );
    this.publicReads = new PublicReadClient(
      (path, headers, options) => this.publicRead(path, headers, options),
      (path, body, options) => this.publicWrite(path, body, options),
    );

    if (this.queueEnabled) {
      this.queue = this.queueStorage.load();
    }

    if (this.batch?.flushIntervalMs && this.batch.flushIntervalMs > 0) {
      this.batchTimer = setInterval(() => {
        void this.flush();
      }, this.batch.flushIntervalMs);
    }

    if (this.flushOnOnline && typeof window !== "undefined" && typeof window.addEventListener === "function") {
      this.onlineHandler = () => void this.flush();
      window.addEventListener("online", this.onlineHandler);
    }
    this.removeFlushTriggers = (config.queue?.flushTriggers ?? []).map((install) => install(() => this.flush()));
  }

  // fromProvisionedProducer builds an event-producing client directly from a
  // provisioned producer bundle, hiding the OAuth wiring.
  static fromProvisionedProducer(credentials: ProvisionedProducerCredentials): CustdClient {
    if (!credentials.clientSecret) {
      throw new Error("custd: provisioned producer bundle is missing the client secret");
    }
    return new CustdClient({
      baseUrl: credentials.baseUrl,
      oauth: {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tokenUrl: credentials.tokenUrl,
        audience: credentials.audience,
        scopes: credentials.scopes,
      },
    });
  }

  static fromBrokerEnv(env: BrokerEnv, options: BrokerEnvClientOptions = {}): CustdClient {
    const baseUrl = options.baseUrl ?? brokerBaseUrl(env);
    return new CustdClient({
      ...options,
      baseUrl,
      oauth: {
        clientId: requireBrokerEnv(env, "CUSTD_PROVISIONING_CLIENT_ID", "PROVISIONING_CLIENT_ID"),
        clientSecret: requireBrokerEnv(env, "CUSTD_PROVISIONING_CLIENT_SECRET", "PROVISIONING_CLIENT_SECRET"),
        tokenUrl: requireBrokerEnv(env, "CUSTD_PROVISIONING_TOKEN_URL", "PROVISIONING_TOKEN_URL"),
        audience: brokerEnvValue(env, "CUSTD_PROVISIONING_AUDIENCE", "PROVISIONING_AUDIENCE"),
        scopes: options.scopes ?? ["admin", "producers.provision"],
      },
    });
  }

  private async fetchOAuthToken(config: ProducerOAuthConfig, options?: RequestOptions): Promise<string> {
    const now = Date.now();
    if (this.oauthToken && this.oauthToken.expiresAtMs > now + 30_000) {
      return this.oauthToken.value;
    }

    const body = new URLSearchParams();
    body.set("grant_type", "client_credentials");
    if (config.audience) {
      body.set("audience", config.audience);
    }
    if (config.scopes && config.scopes.length > 0) {
      body.set("scope", config.scopes.join(" "));
    }

    let response: Response | undefined;
    try {
      response = await this.fetchImpl(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthorization(config.clientId, config.clientSecret),
        },
        body,
        signal: options?.signal,
      });
      if (!response.ok) {
        const requestError = await responseRequestError(response, "oauth_unavailable");
        if (requestError.code !== "oauth_unavailable") {
          throw new CustdRequestError(
            requestError.status,
            "oauth_unavailable",
            requestError.retryability,
            requestError.nextAction,
            requestError.problem,
          );
        }
        throw requestError;
      }
      const token = (await response.json()) as { access_token?: unknown; expires_in?: number };
      if (typeof token?.access_token !== "string" || token.access_token.trim() === "") {
        throw new Error("custd: token response missing access_token");
      }
      this.oauthToken = {
        value: token.access_token,
        expiresAtMs: now + Math.max(0, token.expires_in ?? 300) * 1000,
      };
      return token.access_token;
    } catch (error) {
      if (error instanceof CustdRequestError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw error;
      throw new CustdRequestError(
        response?.status ?? null,
        "oauth_unavailable",
        "bounded",
        { action: "retry", maxRetries: 1 },
        undefined,
        { cause: error },
      );
    }
  }

  async ingestEvent(event: EventEnvelope): Promise<Response> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    return this.sendWithRetry(prepared);
  }

  async track(event: EventEnvelope): Promise<undefined | Response> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    applyEnvironmentLabel(prepared, this.config.environment);
    if (!this.queueEnabled) {
      return this.sendWithRetry(prepared);
    }

    this.enqueue(prepared);
    if (this.batch) {
      const maxBatchSize = this.batch.maxBatchSize ?? 0;
      if (maxBatchSize > 0 && this.queue.length >= maxBatchSize) {
        await this.flush();
      }
    } else if (isOnline()) {
      await this.flush();
    }
    return undefined;
  }

  enqueue(event: EventEnvelope): void {
    if (!this.queueEnabled) {
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push(event);
    this.queueStorage.save(this.queue);
  }

  async flush(): Promise<void> {
    if (!this.queueEnabled || this.queue.length === 0) {
      return;
    }

    if (!isOnline()) {
      return;
    }

    const maxBatchSize = this.batch?.maxBatchSize ?? this.queue.length;
    const toSend = this.queue.splice(0, maxBatchSize);

    try {
      await this.sendBatchWithRetry(toSend);
    } catch (err) {
      this.queue = [...toSend, ...this.queue];
      this.queueStorage.save(this.queue);
      throw err;
    }

    this.queueStorage.save(this.queue);
  }

  close(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.onlineHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
    for (const remove of this.removeFlushTriggers) {
      remove();
    }
    this.removeFlushTriggers = [];
  }

  /**
   * Upload raw, line-delimited content for the bound parser.
   *
   * X-Parser-UUID binds the parser exactly as direct collectors do. When
   * `target` is supplied its paired subClient/resource codes are appended as
   * query parameters: a declarative default the backend applies to records with
   * no canonical selection and refuses to let override an explicit selection.
   *
   * The route answers 202 Accepted, so the status alone is not success. Read
   * `processed` and `failed` on the returned result.
   *
   * A transport failure or an unusable acceptance body cannot prove whether the
   * upload landed, so it throws {@link CustdRawAcceptanceUnknownError} — which
   * carries no retry guidance — rather than a retryable transport error.
   * Replaying the POST could double-land accepted records; the SDK never retries
   * this operation automatically.
   */
  async ingestRawLines(request: RawIngestRequest, options?: RequestOptions): Promise<RawIngestResult> {
    const parserUuid = assertRawParserUuid(request.parserUuid);
    const params = new URLSearchParams();
    if (request.target !== undefined) {
      assertRawSourceTarget(request.target);
      params.set("subClient", request.target.subClient);
      params.set("resource", request.target.resource);
    }
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const token = await this.getToken(options);
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      Authorization: `Bearer ${token}`,
      "X-Parser-UUID": parserUuid,
    };
    const operationKey = request.idempotencyKey;
    if (operationKey !== undefined && operationKey !== "") {
      headers["Idempotency-Key"] = operationKey;
    }
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/v1/raw${query}`, {
        method: "POST",
        headers,
        body: request.content,
        signal: options?.signal,
      });
    } catch (error) {
      // A disconnect cannot prove whether the upload landed; offer no retry.
      throw new CustdRawAcceptanceUnknownError({ cause: error, operationKey });
    }
    if (!response.ok) {
      if (this.retry.retryOnStatuses.includes(response.status)) {
        throw new CustdRawAcceptanceUnknownError({ operationKey });
      }
      throw await problemError(response, `custd: raw ingest failed with status ${response.status}`);
    }
    let value: unknown;
    try {
      value = await response.json();
    } catch (error) {
      throw new CustdRawAcceptanceUnknownError({ cause: error, operationKey });
    }
    return validateRawIngestResult(value, operationKey);
  }

  private async sendWithRetry(event: EventEnvelope): Promise<Response> {
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const response = await this.fetchImpl(`${this.baseUrl}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...this.defaultHeaders,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const retryable = this.retry.retryOnStatuses.includes(response.status);
        if (retryable) {
          throw new RetryableError(`custd: retryable status ${response.status}`);
        }
        throw await problemError(response, `custd: request failed with status ${response.status}`);
      }

      return response;
    });
  }

  private async sendBatchWithRetry(events: EventEnvelope[]): Promise<Response> {
    const json = JSON.stringify({ events });
    const { body, contentEncoding } = await this.encodeBatchBody(json);
    return withRetry(this.retry, async () => {
      const token = await this.getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...this.defaultHeaders,
      };
      if (contentEncoding) {
        headers["Content-Encoding"] = contentEncoding;
      }
      const response = await this.fetchImpl(`${this.baseUrl}/api/v1/events/batch`, {
        method: "POST",
        headers,
        body,
      });

      await this.assertBatchResponse(response);
      return response;
    });
  }

  // encodeBatchBody gzip-compresses the serialized batch body when compression
  // is enabled and the body meets the threshold. It falls back to the raw JSON
  // string (no Content-Encoding) when compression is disabled, below threshold,
  // or CompressionStream is unavailable in the runtime.
  private async encodeBatchBody(json: string): Promise<{ body: BodyInit; contentEncoding?: string }> {
    if (!this.compressionEnabled || json.length < this.compressionThresholdBytes) {
      return { body: json };
    }
    if (typeof CompressionStream === "undefined") {
      return { body: json };
    }
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return { body: compressed, contentEncoding: "gzip" };
  }

  private async assertBatchResponse(response: Response): Promise<void> {
    if (!response.ok) {
      const retryable = this.retry.retryOnStatuses.includes(response.status);
      if (retryable) {
        throw new RetryableError(`custd: retryable status ${response.status}`);
      }
      throw await problemError(response, `custd: request failed with status ${response.status}`);
    }

    const text = await response.text();
    if (text === "") {
      return;
    }
    const body = JSON.parse(text) as EventBatchResponse;
    // Validate every per-event result, not just HTTP status: a 202 envelope can
    // still carry rejected events with their own non-2xx status and problem.
    const failed = (body.results ?? []).filter((r) => r.success === false);
    if (failed.length > 0) {
      throw new CustdProblemError(this.batchRejectionMessage(response.status, body.results, failed), undefined, failed);
    }
  }

  // Names the rejected events (uuid, status, reason) so a partial batch failure
  // is diagnosable without re-probing the API. The list is capped to keep the
  // message bounded.
  private batchRejectionMessage(status: number, results: EventResult[] | undefined, failed: EventResult[]): string {
    const maxList = 10;
    const parts = failed.slice(0, maxList).map((r) => {
      const reason = r.error?.detail || r.error?.title || "no error detail";
      return `${r.eventUuid ?? "unknown"} [status ${r.status ?? status}] ${reason}`;
    });
    if (failed.length > maxList) {
      parts.push(`+${failed.length - maxList} more`);
    }
    return `custd: batch rejected ${failed.length} of ${results?.length ?? failed.length} event(s): ${parts.join("; ")}`;
  }

  private async adminRequest<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.apiRequest(method, `/admin${this.actingCompanyPath(path)}`, body, options);
  }

  // actingCompanyPath names the configured acting company in the `companySlug` query
  // the admin routes read, keeping a selector the call already set.
  private actingCompanyPath(path: string): string {
    if (this.actingCompanySlug === "") {
      return path;
    }
    const [route, query = ""] = path.split("?", 2);
    const params = new URLSearchParams(query);
    if (params.get("companySlug")) {
      return path;
    }
    params.set("companySlug", this.actingCompanySlug);
    return `${route}?${params.toString()}`;
  }

  private async adminDownload(path: string, operation: string, options?: RequestOptions): Promise<Response> {
    const token = await this.getToken(options);
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1/admin${this.actingCompanyPath(path)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, ...this.defaultHeaders },
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new Error(`custd: ${operation} failed with status ${response.status}`);
    }
    return response;
  }

  private async offboardingDownload(path: string, options?: RequestOptions): Promise<OffboardingDownloadStream> {
    const response = await this.adminDownload(path, "offboarding download", options);
    const lengthHeader = response.headers.get("content-length")?.trim() ?? "";
    const byteSize = Number(lengthHeader);
    const checksumSha256 = (response.headers.get("x-checksum-sha256") ?? "").trim().toLowerCase();
    if (!/^\d+$/.test(lengthHeader) || !Number.isSafeInteger(byteSize)) {
      await response.body?.cancel();
      throw new Error("custd: offboarding download content length is invalid");
    }
    if (!/^[a-f0-9]{64}$/.test(checksumSha256)) {
      await response.body?.cancel();
      throw new Error("custd: offboarding download checksum header is invalid");
    }
    return { ...responseDownloadStream(response, "offboarding download", byteSize), byteSize, checksumSha256 };
  }

  private async auditExportDownload(path: string, options?: RequestOptions): Promise<AdminAuditExportResponse> {
    return responseDownloadStream(await this.adminDownload(path, "audit export", options), "audit export");
  }

  private async apiRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
    headers?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getToken(options);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
        method,
        headers: {
          ...requestContentType(body),
          Authorization: `Bearer ${token}`,
          ...this.defaultHeaders,
          ...headers,
          ...(options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
          ...(options?.owningUserUuid ? { "X-Custd-Owning-User-UUID": options.owningUserUuid } : {}),
        },
        body: requestBody(body),
        signal: options?.signal,
      });
    } catch (error) {
      throw transportRequestError(error);
    }
    const requestId = response.headers.get(REQUEST_ID_HEADER) ?? "";
    if (options?.metadata) options.metadata.requestId = requestId;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let errorCode = "";
      let flatRequestId = "";
      let detail = "";
      let safeNextAction = "";
      let workflowEnvelope = false;
      if (text.length > 0) {
        try {
          const parsed = JSON.parse(text) as {
            error?: string;
            code?: string;
            message?: string;
            detail?: string;
            title?: string;
            safeNextAction?: string;
            safe_next_action?: string;
            requestId?: string;
          };
          errorCode = parsed.code || "";
          flatRequestId = parsed.requestId || "";
          detail = parsed.detail || parsed.error || parsed.message || parsed.title || "";
          safeNextAction = parsed.safeNextAction || parsed.safe_next_action || "";
          workflowEnvelope = typeof parsed.error === "string" && (errorCode.length > 0 || safeNextAction.length > 0);
        } catch {
          detail = text.slice(0, 200);
        }
      }
      let message =
        detail.length > 0
          ? `custd: ${detail} (status ${response.status})`
          : `custd: request failed with status ${response.status}`;
      if (errorCode.length > 0) {
        message = `${message} [error=${errorCode}]`;
      }
      if (safeNextAction.length > 0) {
        message = `${message} [safeNextAction=${safeNextAction}]`;
      }
      if (workflowEnvelope) {
        throw new AdminWorkflowError(response.status, detail, errorCode, safeNextAction, requestId || flatRequestId);
      }
      throw await responseRequestError(response, errorCode || "request_failed", message, text);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return emptyApiNullLists(method, `/api/v1${path}`, (await response.json()) as T);
  }

  // publicRead issues a GET that carries none of the client's own credentials.
  private async publicRead<T>(path: string, headers: Record<string, string>, options?: RequestOptions): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
        method: "GET",
        headers: { ...headers, "X-Custd-Sdk": SDK_IDENTITY },
        signal: options?.signal,
      });
    } catch (error) {
      throw transportRequestError(error);
    }
    if (!response.ok) throw await responseRequestError(response, "request_failed");
    return emptyApiNullLists("GET", `/api/v1${path}`, (await response.json()) as T);
  }

  /**
   * Opens a data-space owner's AI settings session from a handoff, on the broker's hub server.
   * hubOrigin is the broker's registered hub origin; the session never sends this client's credential.
   */
  redeemSiteAIOwnerHandoff(
    handoff: SiteAIOwnerHandoff,
    hubOrigin: string,
    options?: RequestOptions,
  ): Promise<SiteAIOwnerSession> {
    const failure = (response: Response) => responseRequestError(response, "request_failed");
    return redeemSiteAIOwnerHandoff({ fetch: this.fetchImpl, failure }, handoff, hubOrigin, options);
  }

  // publicWrite posts JSON that carries none of the client's own credentials and expects no body back.
  private async publicWrite(path: string, body: unknown, options?: RequestOptions): Promise<void> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Custd-Sdk": SDK_IDENTITY },
        body: JSON.stringify(body),
        signal: options?.signal,
      });
    } catch (error) {
      throw transportRequestError(error);
    }
    if (!response.ok) throw await responseRequestError(response, "request_failed");
  }

  private async apiDownload(path: string, options?: RequestOptions): Promise<Uint8Array> {
    const token = await this.getToken(options);
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, ...this.defaultHeaders },
      signal: options?.signal,
    });
    if (!response.ok) throw new Error(`custd: report export download failed with status ${response.status}`);
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > 64 * 1024 * 1024) throw new Error("custd: report export download exceeds 64 MiB");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 64 * 1024 * 1024) throw new Error("custd: report export download exceeds 64 MiB");
    return bytes;
  }
}

// A byte body is a file upload sent as raw bytes, a form is a multipart upload whose boundary fetch
// sets, and every other body is JSON.
function requestContentType(body: unknown): Record<string, string> {
  if (body instanceof FormData) return {};
  return { "Content-Type": body instanceof Uint8Array ? "application/octet-stream" : "application/json" };
}

function requestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  if (body instanceof Uint8Array) return Uint8Array.from(body);
  return JSON.stringify(body);
}

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type AdminAuditDownloader = (path: string, options?: RequestOptions) => Promise<AdminAuditExportResponse>;
type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type SchemaRequester = <T>(method: string, path: string, body?: unknown) => Promise<T>;
type APIRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
type APIDownloader = (path: string, options?: RequestOptions) => Promise<Uint8Array>;

export interface ReportExportCreateRequest {
  dashboardKey: string;
  formats: string[];
  parameters: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ReportExportArtifact {
  id: string;
  artifactKey: string;
  format: string;
  filename: string;
  mediaType: string;
  objectBytes: number;
  objectSha256: string;
  warnings?: string[];
  fallbackForFormat?: string;
  rendererVersion?: string;
}

export interface ReportExportProgressCounter {
  key: string;
  count: number;
}

export type ReportExportJobList = {
  exports: ReportExportJob[];
};

export interface ReportExportJob {
  id: string;
  packKey: string;
  packGeneration: number;
  dashboardKey: string;
  formats: string[];
  parametersDigest: string;
  snapshotSha256?: string;
  state: string;
  progressStage: string;
  progressCounters?: ReportExportProgressCounter[];
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  expiresAt?: string;
  failureCategory?: string;
  failureMessage?: string;
  cancellationReason?: string;
  attemptCount: number;
  nextAttemptAt?: string;
  cleanupState: string;
  cleanupAttempts: number;
  nextCleanupAt?: string;
  artifacts?: ReportExportArtifact[];
}

class ReportingNamespace {
  constructor(
    private readonly request: APIRequester,
    private readonly download: APIDownloader,
  ) {}

  createExport(input: ReportExportCreateRequest, options?: RequestOptions): Promise<ReportExportJob> {
    if (!input.dashboardKey || input.formats.length < 1 || input.formats.length > 8)
      throw new Error("custd: report export requires a dashboard key and 1 to 8 formats");
    return this.request("POST", "/reporting/exports", input, options);
  }

  async listExports(limit = 50, options?: RequestOptions): Promise<ReportExportJobList> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error("custd: report export limit must be between 1 and 100");
    const list = await this.request<ReportExportJobList>(
      "GET",
      `/reporting/exports?limit=${limit}`,
      undefined,
      options,
    );
    return { exports: list.exports ?? [] };
  }

  getExport(exportId: string, options?: RequestOptions): Promise<ReportExportJob> {
    assertUuid(exportId, "exportId");
    return this.request("GET", `/reporting/exports/${encodeURIComponent(exportId)}`, undefined, options);
  }

  cancelExport(exportId: string, reason = "", options?: RequestOptions): Promise<ReportExportJob> {
    assertUuid(exportId, "exportId");
    return this.request("POST", `/reporting/exports/${encodeURIComponent(exportId)}/cancel`, { reason }, options);
  }

  downloadExport(exportId: string, artifactId: string, options?: RequestOptions): Promise<Uint8Array> {
    assertUuid(exportId, "exportId");
    assertUuid(artifactId, "artifactId");
    return this.download(
      `/reporting/exports/${encodeURIComponent(exportId)}/artifacts/${encodeURIComponent(artifactId)}`,
      options,
    );
  }

  /** Exports a completed time-plan run's frozen report source in one to eight formats. */
  async createCompletedRunExport(input: CompletedRunExportRequest, options?: RequestOptions): Promise<ReportExportJob> {
    if (input.formats.length < 1 || input.formats.length > 8)
      throw new Error("custd: completed run export requires 1 to 8 formats");
    const job = await this.request<ReportExportJob & { formats: string[] | null }>(
      "POST",
      "/reporting/exports/completed-run",
      input,
      options,
    );
    return { ...job, formats: job.formats ?? [] };
  }

  /** Lists the dashboards the tenant can open. */
  async dashboards(options?: RequestOptions): Promise<ReportingDashboardCatalogue> {
    type EntryWire = Omit<ReportingDashboardCatalogueEntry, "interactions" | "exportFormats"> & {
      interactions: ReportingDashboardCatalogueEntry["interactions"] | null;
      exportFormats: ReportingDashboardCatalogueEntry["exportFormats"] | null;
    };
    const response = await this.request<{ dashboards: EntryWire[] | null }>(
      "GET",
      "/reporting/dashboards",
      undefined,
      options,
    );
    return {
      dashboards: (response.dashboards ?? []).map((entry) => ({
        ...entry,
        interactions: entry.interactions ?? [],
        exportFormats: entry.exportFormats ?? [],
      })),
    };
  }

  /** Starts, or returns, the data generation that backs one dashboard view. */
  async generateDashboardData(
    input: ReportingDashboardGenerationRequest,
    options?: RequestOptions,
  ): Promise<ReportingDashboardGeneration> {
    const generation = await this.request<
      Omit<ReportingDashboardGeneration, "datasetRowCounts" | "datasetSchemas"> & {
        datasetRowCounts?: ReportingDashboardGeneration["datasetRowCounts"] | null;
        datasetSchemas?: Array<
          Omit<ReportingSnapshotDatasetSchema, "columns"> & { columns: ReportingSnapshotColumn[] | null }
        > | null;
      }
    >("POST", "/reporting/dashboard-data-generations", input, options);
    return {
      ...generation,
      datasetRowCounts: generation.datasetRowCounts ?? [],
      datasetSchemas: (generation.datasetSchemas ?? []).map((schema) => ({ ...schema, columns: schema.columns ?? [] })),
    };
  }

  /** Renders one query against a pack definition that is not published. */
  async previewDraft(input: ReportingDraftPreviewRequest, options?: RequestOptions): Promise<RenderedWidgetData> {
    const data = await this.request<RenderedWidgetData>("POST", "/reporting/draft-preview", input, options);
    emptyNullBuckets(data);
    if (!isRenderedWidgetData(data)) {
      throw new Error("custd: invalid reporting draft preview response");
    }
    return data;
  }

  dashboard(key: string, options?: RequestOptions): Promise<ReportingDashboard> {
    return this.request("GET", `/reporting/dashboards/${encodeURIComponent(key)}`, undefined, options);
  }

  receipt(receiptUuid: string, options?: RequestOptions): Promise<PreparedDataReceiptStatus> {
    assertUuid(receiptUuid, "receiptUuid");
    return this.request("GET", `/processing/${encodeURIComponent(receiptUuid)}`, undefined, options);
  }

  outputs(options?: RequestOptions): Promise<PreparedDataOutputList> {
    return this.request("GET", "/reporting/outputs", undefined, options);
  }

  output(outputUuid: string, options?: RequestOptions): Promise<PreparedDataOutputStatus> {
    assertUuid(outputUuid, "outputUuid");
    return this.request("GET", `/reporting/outputs/${encodeURIComponent(outputUuid)}`, undefined, options);
  }

  queryOutput(
    outputUuid: string,
    request: ReportingQueryRequest,
    options?: RequestOptions,
  ): Promise<PreparedDataQueryEnvelope> {
    assertUuid(outputUuid, "outputUuid");
    return this.request("POST", `/reporting/outputs/${encodeURIComponent(outputUuid)}/query`, request, options);
  }

  async query(request: ReportingQueryRequest, options?: RequestOptions): Promise<RenderedWidgetData> {
    const data = await this.request<RenderedWidgetData>("POST", "/reporting/query", request, options);
    emptyNullBuckets(data);
    if (!isRenderedWidgetData(data)) {
      throw new Error("custd: invalid reporting query response");
    }
    if (data.trust && containsForbiddenReportingTrustKey(data.trust)) {
      throw new Error("custd: unsafe reporting trust diagnostics");
    }
    return data;
  }

  async subjectInsight(request: SubjectInsightRequest, options?: RequestOptions): Promise<SubjectInsightResponse> {
    if (!isValidSubjectInsightRequest(request)) {
      throw new Error("custd: invalid subject insight request");
    }
    const response = await this.request<unknown>("POST", "/reporting/insights/subject", request, options);
    if (isRecord(response)) emptyNullBuckets(response.data);
    if (!isSubjectInsightResponse(response)) {
      throw new Error("custd: invalid subject insight response");
    }
    if (response.data.trust && containsForbiddenReportingTrustKey(response.data.trust)) {
      throw new Error("custd: unsafe reporting trust diagnostics");
    }
    return response;
  }
}

function assertUuid(value: string, field: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`custd: ${field} must be a UUID`);
  }
}

function isValidSubjectInsightRequest(request: SubjectInsightRequest): boolean {
  const allowedKeys = new Set(["template", "subject", "from", "to", "rangeDays"]);
  if (
    !request ||
    !isRecord(request) ||
    Object.keys(request).some((key) => !allowedKeys.has(key)) ||
    typeof request.template !== "string" ||
    !/^[a-z][a-z0-9_]{0,127}$/.test(request.template) ||
    typeof request.subject !== "string" ||
    request.subject.trim() === "" ||
    request.subject.length > 512
  ) {
    return false;
  }
  const hasRangeDays = request.rangeDays !== undefined;
  const hasFrom = request.from !== undefined;
  const hasTo = request.to !== undefined;
  if (hasRangeDays === (hasFrom || hasTo)) return false;
  if (request.rangeDays !== undefined) {
    return Number.isInteger(request.rangeDays) && request.rangeDays >= 1 && request.rangeDays <= 366;
  }
  if (typeof request.from !== "string" || typeof request.to !== "string") return false;
  if (!isValidRfc3339(request.from) || !isValidRfc3339(request.to)) return false;
  const from = Date.parse(request.from);
  const to = Date.parse(request.to);
  return Number.isFinite(from) && Number.isFinite(to) && to > from && to - from <= 366 * 24 * 60 * 60 * 1000;
}

function isValidRfc3339(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 24 &&
    offsetMinute <= 59 &&
    (offsetHour !== 24 || offsetMinute === 0)
  );
}

/** A JSON null bucket list decodes as empty. */
function emptyNullBuckets(value: unknown): void {
  if (isRecord(value) && value.buckets === null) value.buckets = [];
}

function isSubjectInsightResponse(value: unknown): value is SubjectInsightResponse {
  if (!isRecord(value) || !isRenderedWidgetData(value.data)) return false;
  return true;
}

function isRenderedWidgetData(value: unknown): value is RenderedWidgetData {
  return (
    isRecord(value) &&
    Array.isArray(value.buckets) &&
    value.buckets.every(isRenderedWidgetBucket) &&
    isRenderedMetricValue(value.value) &&
    isInteger(value.queryDurationMs) &&
    isOptionalInteger(value.parquetUriCount) &&
    isInteger(value.snapshotAgeMs) &&
    isInteger(value.eventLagP95Ms) &&
    (value.metadata === undefined || isReportingQueryMetadata(value.metadata)) &&
    (value.sources === undefined || (Array.isArray(value.sources) && value.sources.every(isReportingSourceSummary))) &&
    isOptionalStringArray(value.warnings) &&
    (value.delta === undefined || isRenderedMetricValue(value.delta)) &&
    isOptionalFiniteNumber(value.deltaPercent) &&
    isOptionalString(value.deltaLabel) &&
    isOptionalString(value.secondaryLabel) &&
    (value.trust === undefined || isRenderedReportingTrust(value.trust))
  );
}

function isRenderedWidgetBucket(value: unknown): value is RenderedWidgetBucket {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    isRenderedMetricValue(value.value) &&
    typeof value.source === "string" &&
    isInteger(value.queryDurationMs) &&
    isOptionalInteger(value.parquetUriCount) &&
    isOptionalString(value.message) &&
    (value.secondary === undefined || isRenderedMetricValue(value.secondary))
  );
}

function isRenderedMetricValue(value: unknown): value is RenderedMetricValue {
  return (
    isRecord(value) &&
    isFiniteNumber(value.value) &&
    typeof value.unit === "string" &&
    isInteger(value.sampleCount) &&
    typeof value.dataSufficiency === "string" &&
    typeof value.complete === "boolean" &&
    (value.truncated === undefined || typeof value.truncated === "boolean")
  );
}

function isReportingQueryMetadata(value: unknown): value is ReportingQueryMetadata {
  return (
    isRecord(value) &&
    typeof value.resolvedTemplate === "string" &&
    isOptionalString(value.rangeStart) &&
    isOptionalString(value.rangeEnd) &&
    isInteger(value.effectiveMaxRows) &&
    isInteger(value.returnedRows) &&
    isInteger(value.returnedBuckets) &&
    isInteger(value.coveredWindows)
  );
}

function isReportingSourceSummary(value: unknown): value is ReportingSourceSummary {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    isInteger(value.count) &&
    isOptionalString(value.coverageStart) &&
    isOptionalString(value.coverageEnd) &&
    typeof value.completeness === "string"
  );
}

function isRenderedReportingTrust(value: unknown): value is RenderedReportingTrust {
  return (
    isRecord(value) &&
    typeof value.status === "string" &&
    typeof value.dataFreshness === "string" &&
    typeof value.retryability === "string" &&
    isReportingNextActionHint(value.nextAction) &&
    isOptionalString(value.lastExport) &&
    isOptionalString(value.schemaVersion) &&
    isOptionalString(value.contractVersion) &&
    typeof value.rollupState === "string" &&
    isOptionalStringArray(value.queryWarnings) &&
    typeof value.coverage === "string" &&
    isOptionalString(value.permissionClass) &&
    typeof value.captureState === "string" &&
    typeof value.consentState === "string" &&
    typeof value.exportState === "string" &&
    isOptionalString(value.partialReason) &&
    isOptionalString(value.unavailableReason)
  );
}

function isReportingNextActionHint(value: unknown): value is ReportingNextActionHint {
  return (
    isRecord(value) &&
    typeof value.action === "string" &&
    isOptionalInteger(value.pollAfterSeconds) &&
    isOptionalInteger(value.maxRetries)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isOptionalInteger(value: unknown): value is number | undefined {
  return value === undefined || isInteger(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class SchemaNamespace {
  constructor(private readonly request: SchemaRequester) {}

  validate(input: SchemaValidationRequest): Promise<SchemaValidationResponse> {
    return this.request("POST", "/schemas/validate", input);
  }

  dryRun(input: SchemaValidationRequest): Promise<SchemaValidationResponse> {
    return this.request("POST", "/schemas/dry-run", input);
  }

  infer(input: SchemaInferenceRequest): Promise<SchemaInferenceResponse> {
    return this.request("POST", "/schemas/infer", input);
  }

  /** Lists the tenant's event types. */
  async list(): Promise<RegisteredEventTypeList> {
    const eventTypes = await this.request<RegisteredEventType[] | null>("GET", schemaRegistryPath);
    return { eventTypes: eventTypes ?? [] };
  }

  /** Lists an event type's schema versions. */
  async listVersions(eventType: string): Promise<EventSchemaVersionList> {
    const versions = await this.request<EventSchemaVersion[] | null>("GET", `${eventSchemaPath(eventType)}/versions`);
    return { versions: versions ?? [] };
  }

  /** Returns one version's JSON Schema document. */
  async get(eventType: string, version: string): Promise<EventSchemaDocument> {
    return { schema: await this.request<unknown>("GET", eventSchemaPath(eventType, version)) };
  }

  /** Stores a schema version, creating the event type when it is new, and returns the event type. */
  register(input: EventSchemaRegisterRequest): Promise<RegisteredEventType> {
    return this.request("POST", schemaRegistryPath, input);
  }

  /** Makes one version the event type's active schema. */
  activate(eventType: string, version: string): Promise<EventSchemaStateResult> {
    return this.request("POST", `${eventSchemaPath(eventType, version)}/active`);
  }

  /** Lets events validate against one version again. */
  enable(eventType: string, version: string): Promise<EventSchemaStateResult> {
    return this.request("PUT", `${eventSchemaPath(eventType, version)}/enabled`);
  }

  /** Deprecates one version so new events no longer validate against it. */
  disable(eventType: string, version: string): Promise<EventSchemaStateResult> {
    return this.request("DELETE", `${eventSchemaPath(eventType, version)}/enabled`);
  }

  /** Retires the tenant's event type. Its schemas and stored events stay readable. */
  disableEventType(eventType: string): Promise<EventSchemaStateResult> {
    return this.request("DELETE", eventSchemaPath(eventType));
  }

  async sendTestEvent(event: EventEnvelope): Promise<SendTestEventResponse> {
    const prepared = prepareEvent(event);
    validateEvent(prepared);
    const response = await this.request<SendTestEventResponse>("POST", "/events", prepared);
    if (!response.success || response.eventUuid !== prepared.eventUuid) {
      throw new Error("custd: test event was not accepted by ingest");
    }
    return response;
  }
}

class AdminNamespace {
  readonly dataLabels: DataLabelAdminClient;
  readonly dataScopes: DataScopeAdminClient;
  readonly tenants: AdminTenantNamespace;
  readonly lifecycle: BackendLifecycleClient;
  readonly clientSetup: ClientSetupClient;
  readonly oauthClients: AdminOAuthClientNamespace;
  readonly sites: AdminSiteNamespace;
  readonly siteDomains: SiteDomainAdminClient;
  readonly siteInsights: SiteInsightsAdminClient;
  readonly schemas: AdminSchemaNamespace;
  readonly measurement: AdminMeasurementNamespace;
  readonly predictions: PredictionAdminClient;
  readonly privacy: AdminPrivacyNamespace;
  readonly retention: RetentionClient;
  readonly storageAlerts: AdminStorageAlertsNamespace;
  readonly audit: AdminAuditNamespace;
  readonly offboarding: OffboardingClient;
  readonly reportingPacks: AdminReportingPacksNamespace;
  readonly tenantStorage: TenantStorageClient;
  readonly subjectExports: SubjectExportClient;
  readonly privacyErasures: PrivacyErasureClient;
  readonly timePlans: TimePlanAdminClient;
  readonly usage: UsageAdminClient;
  readonly authProjects: AuthProjectAdminClient;
  readonly workflowTimings: WorkflowTimingAdminClient;
  readonly users: AdminUserAdminClient;
  readonly uncertaintyModels: UncertaintyModelAdminClient;
  readonly impersonation: ImpersonationAdminClient;
  readonly supportAccess: SupportAccessAdminClient;
  readonly system: SystemAdminClient;
  readonly environmentPolicy: EnvironmentPolicyAdminClient;
  readonly machineAccess: MachineAccessAdminClient;
  readonly rls: RlsAdminClient;
  readonly oauthClientAdmissions: OAuthClientAdmissionAdminClient;
  readonly sdkUsage: SdkUsageAdminClient;
  readonly ingestClaims: IngestClaimAdminClient;
  readonly accountingEvidence: AccountingEvidenceAdminClient;
  readonly webhooks: NotificationWebhookAdminClient;
  readonly notificationDestinations: NotificationDestinationAdminClient;
  readonly emailRelay: EmailRelayAdminClient;
  readonly campaignEmail: CampaignEmailAdminClient;
  readonly eventTypes: EventTypeAdminClient;
  readonly errorIssues: ErrorIssueAdminClient;
  readonly managedAudit: ManagedAuditAdminClient;

  constructor(
    request: AdminRequester,
    nonAdminRequest: NonAdminRequester,
    offboardingDownload: (path: string, options?: RequestOptions) => Promise<OffboardingDownloadStream>,
    auditExportDownload: AdminAuditDownloader,
  ) {
    this.dataLabels = new DataLabelAdminClient(request);
    this.dataScopes = new DataScopeAdminClient(request);
    this.tenants = new AdminTenantNamespace(request);
    this.lifecycle = new BackendLifecycleClient(request, offboardingDownload);
    this.clientSetup = new ClientSetupClient(request);
    this.oauthClients = new AdminOAuthClientNamespace(request);
    this.sites = new AdminSiteNamespace(request);
    this.siteDomains = new SiteDomainAdminClient(nonAdminRequest);
    this.siteInsights = new SiteInsightsAdminClient(request);
    this.schemas = new AdminSchemaNamespace(request);
    this.measurement = new AdminMeasurementNamespace(request);
    this.predictions = new PredictionAdminClient(request);
    this.privacy = new AdminPrivacyNamespace(request);
    this.retention = new RetentionClient(request);
    this.storageAlerts = new AdminStorageAlertsNamespace(request);
    this.audit = new AdminAuditNamespace(request, auditExportDownload);
    this.offboarding = new OffboardingClient(request, offboardingDownload);
    this.reportingPacks = new AdminReportingPacksNamespace(request);
    this.tenantStorage = new TenantStorageClient(nonAdminRequest);
    this.subjectExports = new SubjectExportClient(request);
    this.privacyErasures = new PrivacyErasureClient(request);
    this.timePlans = new TimePlanAdminClient(request);
    this.usage = new UsageAdminClient(request);
    this.authProjects = new AuthProjectAdminClient(request);
    this.workflowTimings = new WorkflowTimingAdminClient(request);
    this.users = new AdminUserAdminClient(request);
    this.uncertaintyModels = new UncertaintyModelAdminClient(request);
    this.impersonation = new ImpersonationAdminClient(request);
    this.supportAccess = new SupportAccessAdminClient(request);
    this.system = new SystemAdminClient(request);
    this.environmentPolicy = new EnvironmentPolicyAdminClient(request);
    this.machineAccess = new MachineAccessAdminClient(request);
    this.rls = new RlsAdminClient(request);
    this.oauthClientAdmissions = new OAuthClientAdmissionAdminClient(request);
    this.sdkUsage = new SdkUsageAdminClient(request);
    this.ingestClaims = new IngestClaimAdminClient(request);
    this.accountingEvidence = new AccountingEvidenceAdminClient(request);
    this.webhooks = new NotificationWebhookAdminClient(request);
    this.notificationDestinations = new NotificationDestinationAdminClient(nonAdminRequest);
    this.emailRelay = new EmailRelayAdminClient(request);
    this.campaignEmail = new CampaignEmailAdminClient(request);
    this.eventTypes = new EventTypeAdminClient(request);
    this.errorIssues = new ErrorIssueAdminClient(nonAdminRequest);
    this.managedAudit = new ManagedAuditAdminClient(nonAdminRequest);
  }
}

class ProvisioningNamespace {
  readonly dataSpaces: ProvisioningDataSpaceNamespace;
  readonly producers: ProvisioningProducerNamespace;
  readonly reservations: ProvisioningReservationsNamespace;

  constructor(request: APIRequester) {
    this.dataSpaces = new ProvisioningDataSpaceNamespace(request);
    this.producers = new ProvisioningProducerNamespace(request);
    this.reservations = new ProvisioningReservationsNamespace(request);
  }
}

/** Producer reservations under one data space. A system administrator names the parent tenant. */
class ProvisioningReservationsNamespace {
  constructor(private readonly request: APIRequester) {}

  reserve(
    dataSpaceSlug: string,
    body: ProducerReservationCreateRequest,
    parentCompanySlug?: string,
  ): Promise<ProducerReservation> {
    return this.request("POST", reservationsPath(dataSpaceSlug, "", parentCompanySlug), body);
  }

  list(dataSpaceSlug: string, parentCompanySlug?: string): Promise<ProducerReservationListResponse> {
    return this.request("GET", reservationsPath(dataSpaceSlug, "", parentCompanySlug));
  }

  claim(
    dataSpaceSlug: string,
    producerSlug: string,
    body: ProducerReservationClaimRequest,
    parentCompanySlug?: string,
  ): Promise<ProducerReservation> {
    return this.request(
      "POST",
      reservationsPath(dataSpaceSlug, `/${encodeURIComponent(producerSlug)}/claim`, parentCompanySlug),
      body,
    );
  }

  release(dataSpaceSlug: string, producerSlug: string, parentCompanySlug?: string): Promise<void> {
    return this.request(
      "DELETE",
      reservationsPath(dataSpaceSlug, `/${encodeURIComponent(producerSlug)}`, parentCompanySlug),
    );
  }
}

function reservationsPath(dataSpaceSlug: string, suffix: string, parentCompanySlug?: string): string {
  return `/data-spaces/${encodeURIComponent(dataSpaceSlug)}/producer-reservations${suffix}${parentQuery(parentCompanySlug)}`;
}

class ProvisioningDataSpaceNamespace {
  constructor(private readonly request: APIRequester) {}

  /** Creates a data space under the caller's company; a system administrator names the parent tenant. */
  create(dataSpace: DataSpaceCreate, parentCompanySlug?: string): Promise<DataSpace> {
    return this.request("POST", `/data-spaces${parentQuery(parentCompanySlug)}`, dataSpace);
  }

  /** Lists the caller's data spaces; a system administrator names the parent tenant. */
  list(parentCompanySlug?: string): Promise<DataSpaceListResponse> {
    return this.request("GET", `/data-spaces${parentQuery(parentCompanySlug)}`);
  }

  /** Reads retained storage per data space. A system administrator names the parent tenant. */
  async usage(parentCompanySlug?: string): Promise<DataSpaceUsageSummary> {
    const summary = await this.request<DataSpaceUsageSummary>(
      "GET",
      `/data-spaces/usage${parentQuery(parentCompanySlug)}`,
    );
    return { ...summary, dataSpaces: summary.dataSpaces ?? [] };
  }

  revoke(slug: string, parentCompanySlug?: string): Promise<void> {
    return this.request("DELETE", `/data-spaces/${encodeURIComponent(slug)}${parentQuery(parentCompanySlug)}`);
  }

  /** Asks Custd to erase everything a data space holds. The answer is the accepted request, not the finished erasure. */
  erase(slug: string, parentCompanySlug?: string): Promise<DataSpaceErasure> {
    return this.request("POST", `/data-spaces/${encodeURIComponent(slug)}/erasure${parentQuery(parentCompanySlug)}`);
  }

  getErasure(slug: string, parentCompanySlug?: string): Promise<DataSpaceErasure> {
    return this.request("GET", `/data-spaces/${encodeURIComponent(slug)}/erasure${parentQuery(parentCompanySlug)}`);
  }

  /** Reads whether a data space's signing producers are ready and what ingest refused. */
  async getSigningStatus(slug: string, parentCompanySlug?: string): Promise<DataSpaceSigningStatus> {
    const path = `/data-spaces/${encodeURIComponent(slug)}/signing-status${parentQuery(parentCompanySlug)}`;
    const status = await this.request<DataSpaceSigningStatus>("GET", path);
    return {
      ...status,
      producers: (status.producers ?? []).map((producer) => ({
        ...producer,
        keyFingerprints: producer.keyFingerprints ?? [],
      })),
    };
  }

  /**
   * Moves a parent's Site, with every record keyed to it, into the data space. Its credentials keep their
   * client id and secret. Repeating it answers `already_adopted`.
   */
  async adoptSite(slug: string, siteUuid: string, parentCompanySlug?: string): Promise<DataSpaceSiteAdoption> {
    const path = `/data-spaces/${encodeURIComponent(slug)}/sites/${encodeURIComponent(siteUuid)}/adopt${parentQuery(parentCompanySlug)}`;
    const adoption = await this.request<DataSpaceSiteAdoption>("POST", path);
    return { ...adoption, credentialClientIds: adoption.credentialClientIds ?? [] };
  }
}

function parentQuery(parentCompanySlug?: string): string {
  return parentCompanySlug ? `?${new URLSearchParams({ parentCompanySlug })}` : "";
}

function provisionedProducer(credentials: ProvisionedProducerCredentials): ProvisionedProducerCredentials {
  return {
    ...credentials,
    scopes: credentials.scopes ?? [],
    allowedEnvironments: credentials.allowedEnvironments ?? [],
  };
}

class ProvisioningProducerNamespace {
  constructor(private readonly request: APIRequester) {}

  async provision(request: ProducerProvisionCreate): Promise<ProvisionedProducerCredentials> {
    return provisionedProducer(await this.request("POST", "/producer-provisioning", request));
  }

  async list(companySlug?: string): Promise<ProducerProvisionListResponse> {
    const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
    const response = await this.request<{ producers: ProducerProvisionPublicClient[] | null }>(
      "GET",
      `/producer-provisioning${query}`,
    );
    return { producers: (response.producers ?? []).map(publicProducer) };
  }

  async get(clientId: string): Promise<ProducerProvisionPublicClient> {
    return publicProducer(await this.request("GET", `/producer-provisioning/${encodeURIComponent(clientId)}`));
  }

  rotateSecret(clientId: string): Promise<ProducerSecretRotation> {
    return this.request("POST", `/producer-provisioning/${encodeURIComponent(clientId)}/rotate-secret`);
  }

  /**
   * Sets the environment recorded for this producer. It is the authenticated
   * default for events that do not declare their own, not a per-environment
   * credential: one producer is expected to carry every environment unless an
   * operator deliberately restricts it.
   */
  async updateEnvironment(clientId: string, environment: string): Promise<ProducerProvisionPublicClient> {
    const path = `/producer-provisioning/${encodeURIComponent(clientId)}/environment`;
    return publicProducer(await this.request("PATCH", path, { environment }));
  }

  /** Replaces the public keys a producer minted with the hosting-email-delivery template signs with. */
  async setSigningKeys(clientId: string, update: ProducerSigningKeysUpdate): Promise<ProducerSigningKeys> {
    const path = `/producer-provisioning/${encodeURIComponent(clientId)}/signing-keys`;
    return signingKeys(await this.request<ProducerSigningKeys>("PUT", path, update));
  }

  /** Reads the public keys, and their fingerprints, a signing producer's events are verified with. */
  async getSigningKeys(clientId: string): Promise<ProducerSigningKeys> {
    const path = `/producer-provisioning/${encodeURIComponent(clientId)}/signing-keys`;
    return signingKeys(await this.request<ProducerSigningKeys>("GET", path));
  }

  revoke(clientId: string): Promise<void> {
    return this.request("DELETE", `/producer-provisioning/${encodeURIComponent(clientId)}`);
  }
}

function signingKeys(keys: ProducerSigningKeys): ProducerSigningKeys {
  return { ...keys, publicKeys: keys.publicKeys ?? [], keyFingerprints: keys.keyFingerprints ?? [] };
}

function publicProducer(producer: ProducerProvisionPublicClient): ProducerProvisionPublicClient {
  return { ...producer, scopes: producer.scopes ?? [], allowedEnvironments: producer.allowedEnvironments ?? [] };
}

type WireHistoricalCleanupReceipt = {
  company_id: number;
  requested_by_kind: string;
  requested_at: string;
  completed_at: string;
  final_state: string;
  per_store: Array<{
    store: string;
    retention_class: string;
    deleted_count: number;
    retained_exceptions_count: number;
  }> | null;
  waiver?: TenantHistoricalCleanupWaiver;
  sha256: string;
};

function historicalCleanupReceipt(wire: WireHistoricalCleanupReceipt): TenantHistoricalCleanupReceipt {
  return {
    companyId: wire.company_id,
    requestedByKind: wire.requested_by_kind,
    requestedAt: wire.requested_at,
    completedAt: wire.completed_at,
    finalState: wire.final_state,
    perStore: (wire.per_store ?? []).map((store) => ({
      store: store.store,
      retentionClass: store.retention_class,
      deletedCount: store.deleted_count,
      retainedExceptionsCount: store.retained_exceptions_count,
    })),
    ...(wire.waiver ? { waiver: wire.waiver } : {}),
    sha256: wire.sha256,
  };
}

function tenantCompanyPath(slug: string, action: string, companyId: number): string {
  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("custd: company id must be a positive integer");
  }
  return `/tenants/${encodeURIComponent(slug)}/${action}?companyId=${companyId}`;
}

class AdminTenantNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(tenant: AdminTenantCreate): Promise<AdminTenant> {
    return this.request("POST", "/tenants", tenant);
  }

  list(): Promise<AdminTenantListResponse> {
    return this.request("GET", "/tenants");
  }

  get(slug: string): Promise<AdminTenant> {
    return this.request("GET", `/tenants/${encodeURIComponent(slug)}`);
  }

  delete(slug: string): Promise<void> {
    return this.request("DELETE", `/tenants/${encodeURIComponent(slug)}`);
  }

  /**
   * Permanently removes an already deleted tenant once its cleanup is finished.
   * The server refuses an unready tenant with a conflict.
   */
  finalize(slug: string, companyId: number): Promise<void> {
    return this.request("POST", tenantCompanyPath(slug, "finalize", companyId));
  }

  /**
   * Runs the credential-revoking, queue, database and object-storage cleanup for a
   * deleted tenant. The idempotencyKey is required: repeat it to retry the same cleanup.
   */
  async historicalCleanup(
    slug: string,
    companyId: number,
    options: RequestOptions = {},
  ): Promise<TenantHistoricalCleanupReceipt> {
    const path = tenantCompanyPath(slug, "historical-cleanup", companyId);
    if (!options.idempotencyKey?.trim()) {
      throw new Error("custd: historical cleanup idempotency key is required");
    }
    const wire = await this.request<WireHistoricalCleanupReceipt>("POST", path, undefined, options);
    return historicalCleanupReceipt(wire);
  }

  getDataSpaceEntitlement(slug: string): Promise<DataSpaceEntitlementState> {
    return this.request("GET", `/tenants/${encodeURIComponent(slug)}/data-space-entitlement`);
  }

  updateDataSpaceEntitlement(
    slug: string,
    body: DataSpaceEntitlementUpdateRequest,
  ): Promise<DataSpaceEntitlementState> {
    return this.request("PUT", `/tenants/${encodeURIComponent(slug)}/data-space-entitlement`, body);
  }

  updateStorageLimit(slug: string, body: StorageLimitUpdateRequest): Promise<StorageLimit> {
    return this.request("PUT", `/tenants/${encodeURIComponent(slug)}/storage-limit`, body);
  }
}

// Custd requires a canonical UUIDv7 Idempotency-Key on every OAuth client
// mutation, so one is generated when the caller does not supply it. A caller that
// retries the same mutation should pass its own key to reuse it; a caller that
// checks for an existing client first, as a reconcile does, is safe either way.
class AdminOAuthClientNamespace {
  constructor(private readonly request: AdminRequester) {}

  async create(client: AdminOAuthClientCreate, options: RequestOptions = {}): Promise<AdminOAuthClientCreateResponse> {
    const created = await this.request<AdminOAuthClientCreateResponse>(
      "POST",
      "/oauth-clients",
      client,
      mutationOptions(options),
    );
    const { loginSetup } = created;
    return {
      ...created,
      scopes: created.scopes ?? [],
      ...(loginSetup
        ? {
            loginSetup: { ...loginSetup, scopes: loginSetup.scopes ?? [], redirectUris: loginSetup.redirectUris ?? [] },
          }
        : {}),
    };
  }

  list(): Promise<AdminOAuthClientListResponse> {
    return this.request("GET", "/oauth-clients");
  }

  get(clientId: string): Promise<AdminOAuthClient> {
    return this.request("GET", `/oauth-clients/${encodeURIComponent(clientId)}`);
  }

  delete(clientId: string, options: RequestOptions = {}): Promise<void> {
    return this.request(
      "DELETE",
      `/oauth-clients/${encodeURIComponent(clientId)}`,
      undefined,
      mutationOptions(options),
    );
  }

  rotateSecret(clientId: string, options: RequestOptions = {}): Promise<AdminOAuthClientSecretResponse> {
    return this.request(
      "POST",
      `/oauth-clients/${encodeURIComponent(clientId)}/rotate-secret`,
      undefined,
      mutationOptions(options),
    );
  }

  /**
   * Issues a new secret for a client whose current secret nobody holds. The new secret is shown only
   * in this response.
   */
  replaceUnknownSecret(clientId: string, options: RequestOptions = {}): Promise<AdminOAuthClientSecretResponse> {
    return this.request(
      "POST",
      `/oauth-clients/${encodeURIComponent(clientId)}/replace-unknown-secret`,
      undefined,
      mutationOptions(options),
    );
  }

  updateScopes(
    clientId: string,
    body: AdminOAuthClientUpdateScopesRequest,
    options: RequestOptions = {},
  ): Promise<AdminOAuthClient> {
    return this.request(
      "PATCH",
      `/oauth-clients/${encodeURIComponent(clientId)}/scopes`,
      body,
      mutationOptions(options),
    );
  }
}

function mutationOptions(options: RequestOptions): RequestOptions {
  return { ...options, idempotencyKey: options.idempotencyKey ?? uuidv7() };
}

class AdminSiteNamespace {
  constructor(private readonly request: AdminRequester) {}

  create(site: AdminSiteCreate): Promise<AdminSiteCreateResponse> {
    return this.request("POST", "/sites", site);
  }

  async list(): Promise<AdminSiteListResponse> {
    const response = await this.request<{ sites: AdminSiteWire[] | null }>("GET", "/sites");
    return { sites: (response.sites ?? []).map(publicAdminSite) };
  }

  async get(siteUuid: string): Promise<AdminSite> {
    const site = await this.request<AdminSiteWire>("GET", `/sites/${encodeURIComponent(siteUuid)}`);
    return publicAdminSite(site);
  }

  async update(siteUuid: string, body: AdminSiteUpdate): Promise<AdminSite> {
    const site = await this.request<AdminSiteWire>("PATCH", `/sites/${encodeURIComponent(siteUuid)}`, body);
    return publicAdminSite(site);
  }

  delete(siteUuid: string): Promise<void> {
    return this.request("DELETE", `/sites/${encodeURIComponent(siteUuid)}`);
  }

  rotateWriteKey(siteUuid: string): Promise<AdminSiteWriteKeyResponse> {
    return this.request("POST", `/sites/${encodeURIComponent(siteUuid)}/rotate-write-key`);
  }
}

class AdminSchemaNamespace {
  constructor(private readonly request: AdminRequester) {}

  validate(body: AdminSchemaValidateRequest): Promise<AdminSchemaValidateResult> {
    return this.request("POST", "/schema/validate", body);
  }

  enableVersion(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaEnableRequest): Promise<void> {
    return this.request(
      "POST",
      `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/enable`,
      body,
    );
  }

  register(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaRegisterRequest): Promise<void> {
    return this.request(
      "POST",
      `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/register`,
      body,
    );
  }

  dryRun(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaDryRunRequest): Promise<AdminSchemaDryRunResult> {
    return this.request(
      "POST",
      `/schema/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(eventTypeSlug)}/dry-run`,
      body,
    );
  }

  async audit(tenantSlug?: string): Promise<AdminSchemaAuditListResponse> {
    const query = tenantSlug ? `?${new URLSearchParams({ tenantSlug })}` : "";
    const audit = await this.request<AdminSchemaAuditListResponse>("GET", `/schema/audit${query}`);
    return { ...audit, schemas: (audit.schemas ?? []).map(schemaAuditResult) };
  }
}

function schemaAuditResult(result: AdminSchemaAuditResult): AdminSchemaAuditResult {
  const compile = (pass: AdminSchemaCompileResult) => ({ ...pass, issues: pass.issues ?? [] });
  return {
    ...result,
    issueCodes: result.issueCodes ?? [],
    legacyCompile: compile(result.legacyCompile),
    sharedCompile: compile(result.sharedCompile),
    exampleValidation: { ...result.exampleValidation, issueCodes: result.exampleValidation.issueCodes ?? [] },
  };
}

function privacyRules(rules: AdminPrivacyRulesResponse): AdminPrivacyRulesResponse {
  return { ...rules, rules: rules.rules ?? [] };
}

class AdminPrivacyNamespace {
  constructor(private readonly request: AdminRequester) {}

  async getRules(companySlug?: string): Promise<AdminPrivacyRulesResponse> {
    const query = companySlug ? `?${new URLSearchParams({ companySlug })}` : "";
    return privacyRules(await this.request("GET", `/privacy/rules${query}`));
  }

  async setRules(body: AdminPrivacyRuleUpdate): Promise<AdminPrivacyRulesResponse> {
    return privacyRules(await this.request("PUT", "/privacy/rules", body));
  }

  mapIdentifier(companySlug: string, body: AdminPrivacyIdentifierMapRequest): Promise<AdminPrivacyIdentifierMapping> {
    return this.request("POST", `/privacy/identifiers/${encodeURIComponent(companySlug)}/map`, body);
  }

  async listIdentifierMappings(companySlug: string): Promise<AdminPrivacyIdentifierMappingList> {
    const list = await this.request<AdminPrivacyIdentifierMappingList>(
      "GET",
      `/privacy/identifiers/${encodeURIComponent(companySlug)}`,
    );
    return { ...list, mappings: list.mappings ?? [] };
  }

  async listConsent(subjectId: string, companySlug?: string): Promise<AdminPrivacyConsentList> {
    const params = new URLSearchParams({ subjectId });
    if (companySlug) params.set("companySlug", companySlug);
    const response = await this.request<
      Omit<AdminPrivacyConsentList, "records"> & {
        records: AdminPrivacyConsentRecord[] | null;
      }
    >("GET", `/privacy/consent?${params}`);
    return { ...response, records: response.records ?? [] };
  }

  recordConsent(body: AdminPrivacyConsentRecordRequest): Promise<AdminPrivacyConsentRecord> {
    return this.request("POST", "/privacy/consent", body);
  }

  revokeConsent(subjectId: string, revoke: AdminPrivacyConsentRevokeRequest): Promise<AdminPrivacyConsentRecord> {
    const params = new URLSearchParams({ purpose: revoke.purpose });
    if (revoke.source) params.set("source", revoke.source);
    if (revoke.companySlug) params.set("companySlug", revoke.companySlug);
    return this.request("DELETE", `/privacy/consent/${encodeURIComponent(subjectId)}?${params}`);
  }
}

class AdminStorageAlertsNamespace {
  constructor(private readonly request: AdminRequester) {}

  listRules(tenantSlug: string): Promise<AdminStorageAlertRuleListResponse> {
    return this.request("GET", `/storage/alerts/${encodeURIComponent(tenantSlug)}`);
  }

  createRule(tenantSlug: string, body: AdminStorageAlertRuleCreateRequest): Promise<AdminStorageAlertRule> {
    return this.request("POST", `/storage/alerts/${encodeURIComponent(tenantSlug)}`, body);
  }

  deleteRule(tenantSlug: string, ruleId: string): Promise<void> {
    return this.request("DELETE", `/storage/alerts/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(ruleId)}`);
  }

  async listEvents(tenantSlug: string): Promise<AdminStorageAlertEventListResponse> {
    const response = await this.request<{ events: AdminStorageAlertEvent[] | null }>(
      "GET",
      `/storage/alerts/${encodeURIComponent(tenantSlug)}/events`,
    );
    return { events: response.events ?? [] };
  }
}

type AdminAuditEventWire = AdminAuditEvent & Record<string, unknown>;
type AdminAuditListResponseWire = {
  events: AdminAuditEventWire[] | null;
  nextCursor?: AdminAuditListCursor;
  coverageBeginsAt?: unknown;
  retention?: unknown;
};

type AdminReportingPackAuditEventWire = AdminReportingPackAuditEvent & Record<string, unknown>;

const auditDisclosureStates = new Set<AdminAuditDisclosureState>(["available", "redacted", "not_recorded"]);

function mapAdminAuditChange(value: unknown): AdminAuditChange | undefined {
  if (!isRecord(value) || typeof value.field !== "string") return undefined;
  const change: AdminAuditChange = { field: value.field };
  if ("before" in value) change.before = value.before;
  if ("after" in value) change.after = value.after;
  return change;
}

function mapAdminAuditNetwork(value: unknown): AdminAuditNetworkDisclosure | undefined {
  if (!isRecord(value)) return undefined;
  const ipAddressState = value.ipAddressState;
  const userAgentState = value.userAgentState;
  if (
    !auditDisclosureStates.has(ipAddressState as AdminAuditDisclosureState) ||
    !auditDisclosureStates.has(userAgentState as AdminAuditDisclosureState)
  )
    return undefined;
  return {
    ...(typeof value.ipAddress === "string" ? { ipAddress: value.ipAddress } : {}),
    ipAddressState: ipAddressState as AdminAuditDisclosureState,
    ...(typeof value.userAgent === "string" ? { userAgent: value.userAgent } : {}),
    userAgentState: userAgentState as AdminAuditDisclosureState,
  };
}

function mapAdminAuditRetention(value: unknown): AdminAuditRetentionDisclosure | undefined {
  if (
    !isRecord(value) ||
    typeof value.eventMaxAgeSeconds !== "number" ||
    typeof value.ipAddressMaxAgeSeconds !== "number" ||
    typeof value.userAgentMaxAgeSeconds !== "number"
  )
    return undefined;
  return {
    eventMaxAgeSeconds: value.eventMaxAgeSeconds,
    ipAddressMaxAgeSeconds: value.ipAddressMaxAgeSeconds,
    userAgentMaxAgeSeconds: value.userAgentMaxAgeSeconds,
  };
}

function mapAdminAuditEvent(event: AdminAuditEventWire): AdminAuditEvent {
  if (typeof event.eventId !== "string" || !AUDIT_EVENT_UUID_PATTERN.test(event.eventId)) {
    throw new Error("custd: audit event response eventId must be a UUID");
  }
  const details = event.details;
  const actorRoles = Array.isArray(event.actorRoles)
    ? event.actorRoles.filter((role): role is string => typeof role === "string")
    : [];
  const changes = Array.isArray(event.changes)
    ? event.changes.map(mapAdminAuditChange).filter((change): change is AdminAuditChange => change !== undefined)
    : [];
  const network = mapAdminAuditNetwork(event.network);
  return {
    eventId: event.eventId,
    tenantSlug: event.tenantSlug,
    actorKind: event.actorKind,
    ...(event.actorReference !== undefined ? { actorReference: event.actorReference } : {}),
    actorDisplayName: event.actorDisplayName,
    ...(actorRoles.length > 0 ? { actorRoles } : {}),
    action: event.action,
    resourceType: event.resourceType,
    ...(event.resourceId !== undefined ? { resourceId: event.resourceId } : {}),
    outcome: event.outcome,
    ...(event.correlationId !== undefined ? { correlationId: event.correlationId } : {}),
    ...(event.operationId !== undefined ? { operationId: event.operationId } : {}),
    ...(changes.length > 0 ? { changes } : {}),
    ...(details !== undefined && typeof details === "object" && !Array.isArray(details) ? { details } : {}),
    ...(network !== undefined ? { network } : {}),
    ...(event.domainHistory !== undefined ? { domainHistory: event.domainHistory } : {}),
    createdAt: event.createdAt,
  };
}

function mapAdminReportingPackAuditEvent(event: AdminReportingPackAuditEventWire): AdminReportingPackAuditEvent {
  return {
    action: event.action,
    ...(event.actorReference !== undefined ? { actorReference: event.actorReference } : {}),
    actorDisplayName: event.actorDisplayName,
    resourceType: event.resourceType,
    packKey: event.packKey,
    createdAt: event.createdAt,
  };
}

const AUDIT_EVENT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class AdminAuditNamespace {
  constructor(
    private readonly request: AdminRequester,
    private readonly download: AdminAuditDownloader,
  ) {}

  private auditQuery(options?: AdminAuditListOptions, includePagination = true): string {
    if (!options) {
      return "";
    }
    const params = new URLSearchParams();
    if (options.scope) params.set("scope", options.scope);
    if (options.companySlug) params.set("companySlug", options.companySlug);
    if (options.affectedTenantSlug) params.set("affectedTenantSlug", options.affectedTenantSlug);
    if (options.since) params.set("since", options.since);
    if (options.until) params.set("until", options.until);
    if (options.actorKind) params.set("actorKind", options.actorKind);
    if (options.actorReference) params.set("actorReference", options.actorReference);
    if (options.action) params.set("action", options.action);
    if (options.resourceType) params.set("resourceType", options.resourceType);
    if (options.resourceId) params.set("resourceId", options.resourceId);
    if (options.outcome) params.set("outcome", options.outcome);
    if (options.correlationId) params.set("correlationId", options.correlationId);
    if (options.environmentId) params.set("environmentId", options.environmentId);
    if (includePagination && typeof options.limit === "number") params.set("limit", String(options.limit));
    if (includePagination && options.cursor) params.set("cursor", options.cursor);
    const query = params.toString();
    return query.length === 0 ? "" : `?${query}`;
  }

  private auditLookupQuery(options?: AdminAuditListOptions): string {
    if (!options) return "";
    const params = new URLSearchParams();
    if (options.scope) params.set("scope", options.scope);
    if (options.companySlug) params.set("companySlug", options.companySlug);
    const query = params.toString();
    return query.length === 0 ? "" : `?${query}`;
  }

  async listEvents(options?: AdminAuditListOptions): Promise<AdminAuditListResponse> {
    const response = await this.request<AdminAuditListResponseWire>("GET", `/audit/events${this.auditQuery(options)}`);
    const retention = mapAdminAuditRetention(response.retention);
    return {
      events: (response.events ?? []).map(mapAdminAuditEvent),
      nextCursor: response.nextCursor ?? {},
      ...(typeof response.coverageBeginsAt === "string" ? { coverageBeginsAt: response.coverageBeginsAt } : {}),
      ...(retention === undefined ? {} : { retention }),
    };
  }

  async getEvent(eventId: string, options?: AdminAuditListOptions): Promise<AdminAuditEvent> {
    const response = await this.request<AdminAuditEventWire>(
      "GET",
      `/audit/events/${encodeURIComponent(eventId)}${this.auditLookupQuery(options)}`,
    );
    return mapAdminAuditEvent(response);
  }

  exportEvents(options?: AdminAuditListOptions, format: "csv" | "json" = "json"): Promise<AdminAuditExportResponse> {
    if (format !== "csv" && format !== "json") {
      return Promise.reject(new Error("custd: audit export format must be csv or json"));
    }
    const query = this.auditQuery(options, false);
    const suffix = query.length > 0 ? `${query}&format=${format}` : `?format=${format}`;
    return this.download(`/audit/events/export${suffix}`);
  }

  async listReportingPackEvents(packKey: string): Promise<AdminReportingPackAuditListResponse> {
    const response = await this.request<{ events: AdminReportingPackAuditEventWire[] | null }>(
      "GET",
      `/reporting-packs/audit-events?packKey=${encodeURIComponent(packKey)}`,
    );
    return { events: (response.events ?? []).map(mapAdminReportingPackAuditEvent) };
  }
}

class AdminReportingPacksNamespace {
  constructor(private readonly request: AdminRequester) {}

  listDrafts(): Promise<ReportingPackDraftListResponse> {
    return this.request("GET", "/reporting-packs/drafts");
  }

  /** List the reviewed setup templates (each with its canonical definition). */
  listSetupTemplates(): Promise<ReportingPackSetupTemplateListResponse> {
    return this.request("GET", "/reporting-packs/setup-templates");
  }

  /**
   * Apply typed bindings to one reviewed setup template and return the
   * server-built definition. Pure build: the server creates no data, grants no
   * scope, and writes no generation; post the result through createDraft/preview
   * only when the caller intends to.
   */
  bindSetupTemplate(
    kind: string,
    body: ReportingPackSetupTemplateBindRequest,
  ): Promise<ReportingPackSetupTemplateBindResponse> {
    return this.request("POST", `/reporting-packs/setup-templates/${encodeURIComponent(kind)}/bind`, body);
  }

  getDraft(draftId: string): Promise<ReportingPackDraft> {
    return this.request("GET", `/reporting-packs/drafts/${encodeURIComponent(draftId)}`);
  }

  createDraft(body: ReportingPackDraftCreateRequest): Promise<ReportingPackDraft> {
    return this.request("POST", "/reporting-packs/drafts", body);
  }

  updateDraft(draftId: string, body: ReportingPackDraftUpdateRequest): Promise<ReportingPackDraft> {
    return this.request("PUT", `/reporting-packs/drafts/${encodeURIComponent(draftId)}`, body);
  }

  validate(body: ReportingPackDraftCreateRequest): Promise<ReportingPackValidateResponse> {
    return this.request("POST", "/reporting-packs/validate", body);
  }

  preview(body: ReportingPackPreviewRequest): Promise<ReportingPackPreviewResponse> {
    return this.request("POST", "/reporting-packs/preview", body);
  }

  publish(draftId: string): Promise<ReportingPackGeneration> {
    return this.request("POST", `/reporting-packs/drafts/${encodeURIComponent(draftId)}/publish`);
  }

  restart(draftId: string): Promise<ReportingPackDraft> {
    return this.request("POST", `/reporting-packs/drafts/${encodeURIComponent(draftId)}/restart`);
  }

  getGeneration(generationId: string): Promise<ReportingPackGeneration> {
    return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}`);
  }

  getGenerationStatus(generationId: string): Promise<ReportingPackGenerationStatusResponse> {
    return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}/status`);
  }

  rollbackGeneration(generationId: string): Promise<ReportingPackGeneration> {
    return this.request("POST", `/reporting-packs/generations/${encodeURIComponent(generationId)}/rollback`);
  }

  async listGenerationValidity(): Promise<ReportingPackGenerationValidityListResponse> {
    const response = await this.request<{ generations: ReportingPackGenerationValidity[] | null }>(
      "GET",
      "/reporting-packs/generation-validity",
    );
    return { generations: response.generations ?? [] };
  }

  getRollupProvenance(generationId: string): Promise<ReportingPackRollupProvenance> {
    return this.request("GET", `/reporting-packs/generations/${encodeURIComponent(generationId)}/rollup-provenance`);
  }
}

export type PrepareEventMode = "producer" | "browser-cookieless";

export type PrepareEventOptions = {
  mode?: PrepareEventMode;
};

// redactedProvisionedProducer returns the display-safe view of a provisioned
// producer bundle, omitting the client secret so it is safe for dashboards.
export function redactedProvisionedProducer(
  credentials: ProvisionedProducerCredentials,
): RedactedProvisionedProducerCredentials {
  const { clientSecret: _clientSecret, ...rest } = credentials;
  return rest;
}

export function validateEvent(event: EventEnvelope): void {
  const missing: string[] = [];

  if (!event.eventUuid) missing.push("eventUuid");
  if (!event.eventTypeSlug) missing.push("eventTypeSlug");
  if (!event.schemaVersion) missing.push("schemaVersion");
  if (!event.timestamp) missing.push("timestamp");
  if (!event.sessionId) missing.push("sessionId");
  if (!event.anonymousId) missing.push("anonymousId");
  if (!event.companySlug) missing.push("companySlug");
  if (!event.context) missing.push("context");
  if (!event.payload) missing.push("payload");

  const deviceType = event.context?.device?.type;
  if (!deviceType) missing.push("context.device.type");

  if (missing.length > 0) {
    throw new Error(`custd: missing required fields: ${missing.join(", ")}`);
  }
  validateEnvironmentValue(event.environment ?? "");
  validateProducerLabels(event as EventEnvelope & Record<string, unknown>);
}

const labelKeyPattern = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

/** Reserved envelope label carrying a declared environment. */
export const environmentLabelKey = "custd.environment";

const environmentValuePattern = /^[a-z][a-z0-9-]{0,31}$/;

/**
 * Checks a declared environment against the contract ingest applies, so a
 * rejected declaration fails locally instead of failing the event at the API.
 */
export function validateEnvironmentValue(value: string): void {
  if (value === "") return;
  if (value !== value.trim() || !environmentValuePattern.test(value)) {
    throw new Error(
      `custd: environment ${JSON.stringify(value)} must be lowercase letters, digits and hyphens, at most 32 characters`,
    );
  }
  if (value === "unclassified") {
    throw new Error('custd: environment "unclassified" is reserved');
  }
}

/**
 * Stamps the effective environment onto the envelope labels. An event-level
 * declaration wins over the client default, and a label the caller set is never
 * overwritten.
 */
export function applyEnvironmentLabel(event: EventEnvelope, clientEnvironment?: string): void {
  const effective = event.environment || clientEnvironment || "";
  if (effective === "") return;
  event.labels = { ...(event.labels ?? {}) };
  if (event.labels[environmentLabelKey] === undefined) {
    event.labels[environmentLabelKey] = effective;
  }
}

function validateProducerLabels(event: EventEnvelope & Record<string, unknown>): void {
  if ("resolvedLabels" in event || "vocabularyFingerprint" in event) {
    throw new Error("custd: server-owned label fields are not accepted");
  }
  if (event.labels === undefined) return;
  if (event.labels === null || typeof event.labels !== "object" || Array.isArray(event.labels)) {
    throw new Error("custd: labels must be an object of strings");
  }
  const entries = Object.entries(event.labels);
  if (entries.length > 16) throw new Error("custd: labels may contain at most 16 entries");
  for (const [key, value] of entries) {
    if (!labelKeyPattern.test(key) || utf8Bytes(key) > 64 || key.startsWith("custd.")) {
      throw new Error(`custd: labels.${key} has an invalid key`);
    }
    if (typeof value !== "string" || value === "" || value !== value.trim() || utf8Bytes(value) > 128) {
      throw new Error(`custd: labels.${key} has an invalid value`);
    }
  }
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function validateBrowserEvent(event: EventEnvelope): void {
  const missing: string[] = [];

  if (!event.eventUuid) missing.push("eventUuid");
  if (!event.eventTypeSlug) missing.push("eventTypeSlug");
  if (!event.schemaVersion) missing.push("schemaVersion");
  if (!event.timestamp) missing.push("timestamp");
  if (!event.context) missing.push("context");
  if (!event.payload) missing.push("payload");
  if (!event.payload?.siteUuid) missing.push("payload.siteUuid");

  const deviceType = event.context?.device?.type;
  if (!deviceType) missing.push("context.device.type");

  if (missing.length > 0) {
    throw new Error(`custd: missing required browser fields: ${missing.join(", ")}`);
  }
  validateEnvironmentValue(event.environment ?? "");
  validateProducerLabels(event as EventEnvelope & Record<string, unknown>);
}

export function createDogfoodEvent(input: DogfoodEventInput): EventEnvelope {
  const missing: string[] = [];
  if (!input.eventTypeSlug) missing.push("eventTypeSlug");
  if (!input.schemaVersion) missing.push("schemaVersion");
  if (!input.companySlug) missing.push("companySlug");
  if (!input.sourceSystem) missing.push("sourceSystem");
  if (!input.sourceCompany) missing.push("sourceCompany");
  if (!input.environment) missing.push("environment");
  if (missing.length > 0) {
    throw new Error(`custd: missing dogfood fields: ${missing.join(", ")}`);
  }

  const sanitized = sanitizeDogfoodPayload(input.payload ?? {});
  if (input.strictPayloadKeys && sanitized.droppedKeys.length > 0) {
    throw new Error(`custd: dropped dogfood payload keys: ${sanitized.droppedKeys.join(", ")}`);
  }
  const payload = sanitized.payload;
  payload.sourceSystem = input.sourceSystem;
  payload.sourceCompany = input.sourceCompany;
  payload.environment = input.environment;
  payload.schemaVersion = input.schemaVersion;
  if (input.correlationId) {
    payload.correlationId = input.correlationId;
  }

  return prepareEvent({
    eventTypeSlug: input.eventTypeSlug,
    schemaVersion: input.schemaVersion,
    timestamp: new Date().toISOString(),
    companySlug: input.companySlug,
    context: { device: { type: "server" } },
    payload,
  });
}

export function prepareEvent(event: EventEnvelope, options: PrepareEventOptions = {}): EventEnvelope {
  if (options.mode === "browser-cookieless") {
    return {
      ...event,
      eventUuid: event.eventUuid || randomUUID(),
      sessionId: event.sessionId ?? "",
      anonymousId: event.anonymousId ?? "",
    };
  }
  return {
    ...event,
    eventUuid: event.eventUuid || randomUUID(),
    sessionId: event.sessionId || randomUUID(),
    anonymousId: event.anonymousId || randomUUID(),
  };
}

const RAW_PARSER_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// assertRawParserUuid rejects a missing or malformed parser UUID before a
// request is sent. It is a cheap shape check; the backend still verifies the
// parser exists and is enabled.
function assertRawParserUuid(value: string): string {
  if (typeof value !== "string" || !RAW_PARSER_UUID_PATTERN.test(value)) {
    throw new RangeError("custd: raw ingest requires a parser UUID");
  }
  return value;
}

// assertRawSourceTarget rejects a partial or malformed target before a request
// is sent. Both codes must be present and well-formed; the backend remains the
// authority on whether they are registered.
function assertRawSourceTarget(target: RawSourceTarget): void {
  if (
    typeof target.subClient !== "string" ||
    typeof target.resource !== "string" ||
    !validDataScopeCode(target.subClient) ||
    !validDataScopeCode(target.resource)
  ) {
    throw new RangeError("custd: raw source target requires subClient and resource as a pair of valid codes");
  }
}

// validateRawIngestResult requires an actual object carrying a boolean success
// and non-negative integer processed and failed. A missing field, a null, a
// wrong type, or a negative count is rejected rather than defaulted or coerced.
// Legitimate partial counts are returned unchanged.
function validateRawIngestResult(value: unknown, operationKey?: RawRequestIdempotencyKey): RawIngestResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CustdRawAcceptanceUnknownError({ operationKey });
  }
  const record = value as Record<string, unknown>;
  if (typeof record.success !== "boolean") {
    throw new CustdRawAcceptanceUnknownError({ operationKey });
  }
  return {
    success: record.success,
    processed: requireNonNegativeInteger(record.processed, operationKey),
    failed: requireNonNegativeInteger(record.failed, operationKey),
  };
}

function requireNonNegativeInteger(value: unknown, operationKey?: RawRequestIdempotencyKey): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new CustdRawAcceptanceUnknownError({ operationKey });
  }
  return value;
}

export class RetryableError extends Error {}

const REQUEST_ID_HEADER = "x-request-id";

function transportRequestError(error: unknown): Error {
  if (error instanceof Error && error.name === "AbortError") return error;
  return new CustdRequestError(
    null,
    "transport_unavailable",
    "bounded",
    { action: "retry", maxRetries: 1 },
    undefined,
    { cause: error },
  );
}

async function responseRequestError(
  response: Response,
  fallbackCode: string,
  fallbackMessage?: string,
  responseText?: string,
): Promise<CustdRequestError> {
  const text =
    responseText ??
    (await response
      .clone()
      .text()
      .catch(() => ""));
  let problem: ProblemDetails | undefined;
  try {
    const parsed = JSON.parse(text) as ProblemDetails;
    if (parsed && typeof parsed === "object" && parsed.status === response.status) problem = parsed;
  } catch {
    problem = undefined;
  }
  const retryability =
    problem?.retryability ?? (response.status === 429 || response.status >= 500 ? "bounded" : "none");
  const nextAction =
    problem?.nextAction ??
    (retryability === "bounded" ? { action: "retry" as const, maxRetries: 1 } : { action: "none" as const });
  const code = problem?.code || fallbackCode;
  const requestId = response.headers.get(REQUEST_ID_HEADER) || problem?.traceId || "";
  const requestError = new CustdRequestError(response.status, code, retryability, nextAction, problem, {
    requestId,
  });
  if (fallbackMessage) requestError.message = fallbackMessage;
  return requestError;
}

// CustdProblemError carries the decoded RFC 9457 problem document (when the
// server sent one) and, for batch sends, the failed per-event results so a
// caller can inspect every rejection without re-probing the API.
export class CustdProblemError extends Error {
  readonly problem?: ProblemDetails;
  readonly failures: EventResult[];

  constructor(message: string, problem?: ProblemDetails, failures: EventResult[] = []) {
    super(message);
    this.name = "CustdProblemError";
    this.problem = problem;
    this.failures = failures;
  }
}

// problemError decodes an RFC 9457 problem document from an error response and
// wraps it in a CustdProblemError. When the body is missing or unparseable it
// falls back to the supplied status-only message so callers still get an error.
async function problemError(response: Response, fallbackMessage: string): Promise<CustdProblemError> {
  const text = await response.text().catch(() => "");
  if (text === "") {
    return new CustdProblemError(fallbackMessage);
  }
  let problem: ProblemDetails;
  try {
    problem = JSON.parse(text) as ProblemDetails;
  } catch {
    return new CustdProblemError(fallbackMessage);
  }
  const message = problem.detail || problem.title || fallbackMessage;
  return new CustdProblemError(`custd: ${message}`, problem);
}

const dogfoodProtectedPayloadFields = new Set([
  "sourcesystem",
  "sourcecompany",
  "environment",
  "schemaversion",
  "correlationid",
]);

const dogfoodForbiddenPayloadFields = new Set([
  "apikey",
  "authorization",
  "password",
  "rawapiresponse",
  "token",
  "signedurl",
  "rawprompt",
  "oauthcode",
  "devicesecret",
  "providercredential",
]);

const forbiddenReportingTrustKeys = new Set([
  "rawpayload",
  "sql",
  "token",
  "secret",
  "stack",
  "email",
  "ipaddress",
  "hostname",
  "orderid",
  "carttoken",
]);

function containsForbiddenReportingTrustKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenReportingTrustKey);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.entries(value).some(
    ([key, child]) => forbiddenReportingTrustKeys.has(key.toLowerCase()) || containsForbiddenReportingTrustKey(child),
  );
}

function sanitizeDogfoodPayload(
  payload: Record<string, unknown>,
  prefix = "",
): { payload: Record<string, unknown>; droppedKeys: string[] } {
  const cleaned: Record<string, unknown> = {};
  const droppedKeys: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (!dogfoodPayloadFieldAllowed(key)) {
      droppedKeys.push(`${prefix}${key}`);
      continue;
    }
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeDogfoodPayload(value as Record<string, unknown>, `${prefix}${key}.`);
      cleaned[key] = nested.payload;
      droppedKeys.push(...nested.droppedKeys);
    } else {
      cleaned[key] = value;
    }
  }
  return { payload: cleaned, droppedKeys };
}

function dogfoodPayloadFieldAllowed(key: string): boolean {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return !dogfoodProtectedPayloadFields.has(normalized) && !dogfoodForbiddenPayloadFields.has(normalized);
}

function brokerBaseUrl(env: BrokerEnv): string {
  const explicit = brokerEnvValue(env, "CUSTD_BASE_URL", "CUSTD_API_BASE_URL");
  if (explicit) {
    return normalizeCustdBaseUrl(explicit);
  }
  const endpoint = brokerEnvValue(
    env,
    "CUSTD_PROVISIONING_ENDPOINT",
    "PROVISIONING_ENDPOINT",
    "CUSTD_TENANT_ADMIN_ENDPOINT",
    "TENANT_ADMIN_ENDPOINT",
  );
  if (!endpoint) {
    throw new Error("custd: broker env missing CUSTD_BASE_URL or CUSTD_PROVISIONING_ENDPOINT");
  }
  return normalizeCustdBaseUrl(endpoint);
}

function normalizeCustdBaseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const suffixes = [
    "/api/v1/managed-audit/provision",
    "/api/v1/producer-provisioning",
    "/api/v1/admin/tenants",
    "/api/v1",
  ];
  for (const suffix of suffixes) {
    if (url.pathname.endsWith(suffix)) {
      url.pathname = url.pathname.slice(0, -suffix.length) || "/";
      break;
    }
  }
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function requireBrokerEnv(env: BrokerEnv, ...keys: string[]): string {
  const value = brokerEnvValue(env, ...keys);
  if (!value) {
    throw new Error(`custd: broker env missing ${keys[0]}`);
  }
  return value;
}

function brokerEnvValue(env: BrokerEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function assertSecureOrLocalHTTP(rawUrl: string, field: string): void {
  const parsed = new URL(rawUrl);
  if (parsed.protocol === "https:") {
    return;
  }
  if (parsed.protocol === "http:" && isLocalHostname(parsed.hostname)) {
    return;
  }
  throw new Error(`custd: ${field} must use https unless it targets localhost`);
}

export function normalizeRetryOptions(options?: RetryOptions): Required<RetryOptions> {
  return {
    maxAttempts: options?.maxAttempts ?? 3,
    baseDelayMs: options?.baseDelayMs ?? 200,
    maxDelayMs: options?.maxDelayMs ?? 2000,
    jitter: options?.jitter ?? 0.2,
    retryOnStatuses: options?.retryOnStatuses ?? [408, 429, 500, 502, 503, 504],
  };
}

export async function withRetry<T>(options: Required<RetryOptions>, op: () => Promise<T>): Promise<T> {
  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await op();
    } catch (err) {
      const retryable = err instanceof RetryableError || err instanceof TypeError;
      if (!retryable || attempt >= options.maxAttempts) {
        throw err;
      }
      const delay = backoffDelay(options, attempt);
      await sleep(delay);
    }
  }
}

function backoffDelay(options: Required<RetryOptions>, attempt: number): number {
  const exp = options.baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(exp, options.maxDelayMs);
  const jitter = capped * options.jitter * (Math.random() * 2 - 1);
  return Math.max(0, capped + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  if (typeof navigator.onLine !== "boolean") {
    return true;
  }
  return navigator.onLine;
}

// uuidv7 returns a canonical RFC 9562 version 7 UUID. Custd requires one as the
// Idempotency-Key of an OAuth client mutation.
function uuidv7(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  let timestamp = Date.now();
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Opaque per-event identity, including runtimes without Web Crypto. Not an authentication token. */
export function createEventId(): string {
  return randomUUID();
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

export * from "./admin-accounting-evidence.js";
export * from "./admin-campaign-email.js";
export * from "./admin-email-relay.js";
export * from "./admin-environment-policy.js";
export * from "./admin-error-issues.js";
export * from "./admin-event-types.js";
export * from "./admin-impersonation.js";
export * from "./admin-ingest-claims.js";
export * from "./admin-machine-access.js";
export * from "./admin-managed-audit.js";
export * from "./admin-measurement-projects.js";
export * from "./admin-notification-destinations.js";
export * from "./admin-notification-webhooks.js";
export * from "./admin-oauth-client-admissions.js";
export * from "./admin-rls.js";
export * from "./admin-sdk-usage.js";
export type {
  SiteRegionalTrendMarket,
  SiteRegionalTrendMatch,
  SiteRegionalTrends,
  SiteTechnicalTrends,
} from "./admin-site-regional-trends.js";
export * from "./admin-support-access.js";
export * from "./admin-system.js";
export * from "./admin-uncertainty-models.js";
export * from "./analytics-reads.js";
export * from "./app-account.js";
export {
  type CaptureExceptionRequest,
  createErrorCaptureEvent,
  ErrorCaptureClient,
  type ErrorCaptureConfig,
  type ErrorCaptureEvent,
  type ErrorCaptureEventConfig,
  type ErrorCaptureResult,
  type ErrorFrame,
  installBrowserErrorCapture,
  installNativeErrorCapture,
  type NativeErrorHandler,
  type NativeErrorSource,
} from "./error-capture.js";
export * from "./ingest-operations.js";
export * from "./measurement.js";
export * from "./public-reads.js";
export * from "./reporting-catalogue.js";
export type {
  EventSchemaDocument,
  EventSchemaRegisterRequest,
  EventSchemaStateResult,
  EventSchemaVersion,
  EventSchemaVersionList,
  RegisteredEventType,
  RegisteredEventTypeList,
} from "./schema-registry.js";
export { SiteAIOwnerSession, type SiteAIOwnerSettings, type SiteAIOwnerTransport } from "./site-ai-owner.js";
export * from "./site-monitor-reports.js";

export * from "./storefront.js";
