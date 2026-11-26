import { AuthProjectAdminClient } from "./admin-auth-projects.js";
import { ClientSetupClient } from "./admin-client-setup.js";
import { DataLabelAdminClient } from "./admin-data-labels.js";
import { DataScopeAdminClient } from "./admin-data-scopes.js";
import { OffboardingClient, type OffboardingDownloadStream, type OffboardingReceiptPerStore } from "./admin-offboarding.js";
import { PredictionAdminClient } from "./admin-predictions.js";
import { PrivacyErasureClient } from "./admin-privacy-erasures.js";
import { RetentionClient } from "./admin-retention.js";
import { SiteDomainAdminClient } from "./admin-site-domains.js";
import { SiteInsightsAdminClient } from "./admin-site-insights-tasks.js";
import { SubjectExportClient } from "./admin-subject-exports.js";
import { TenantStorageClient } from "./admin-tenant-storage.js";
import { type CustdDownloadStream } from "./download-stream.js";
export { AUTH_PROJECT_DOMAIN_CONVERGENCES, AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS, AUTH_PROJECT_DOMAIN_IMAGE_SOURCES, AUTH_PROJECT_DOMAIN_LIFECYCLES, AUTH_PROJECT_DOMAIN_STATUSES, type AuthProjectAppLink, type AuthProjectAppLinkList, type AuthProjectBrandLogo, type AuthProjectDomainBinding, type AuthProjectDomainBindRequest, type AuthProjectDomainConvergence, type AuthProjectDomainDNSProof, type AuthProjectDomainImageComponent, type AuthProjectDomainImageOverride, type AuthProjectDomainImageOverrideRequest, type AuthProjectDomainImageSet, type AuthProjectDomainImageSource, type AuthProjectDomainImages, type AuthProjectDomainLifecycle, type AuthProjectDomainMintRequest, type AuthProjectDomainStatus, } from "./admin-auth-project-domain.js";
export { ADMIN_USER_GLOBAL_STATES, ADMIN_USER_MEMBERSHIP_STATES, ADMIN_USER_ROLES, type AdminUser, AdminUserAdminClient, type AdminUserCreateRequest, type AdminUserDisableRequest, type AdminUserEnableRequest, type AdminUserGlobalState, type AdminUserListQuery, type AdminUserListResponse, type AdminUserMembershipCreateRequest, type AdminUserMembershipState, type AdminUserPasswordReset, type AdminUserRemovalRequest, type AdminUserRole, type AdminUserScope, type AdminUserUpdateRequest, } from "./admin-users.js";
export { WORKFLOW_TIMING_FACT_KINDS, WORKFLOW_TIMING_STATES, WorkflowTimingAdminClient, type WorkflowTimingAttempt, type WorkflowTimingBatchResult, type WorkflowTimingContribution, type WorkflowTimingDeclaration, type WorkflowTimingDefinition, type WorkflowTimingDefinitionList, type WorkflowTimingDimensionDefinition, type WorkflowTimingDurationHistory, type WorkflowTimingDurationHistoryEntry, type WorkflowTimingDurationProjection, type WorkflowTimingEvaluation, type WorkflowTimingEvaluationArtifact, type WorkflowTimingExcludedStep, type WorkflowTimingExpectation, type WorkflowTimingFact, type WorkflowTimingFactKind, type WorkflowTimingObservation, type WorkflowTimingObservationResult, type WorkflowTimingOutcomeCounts, type WorkflowTimingPrediction, type WorkflowTimingProjectionStatus, type WorkflowTimingProvenance, type WorkflowTimingRebuildResult, type WorkflowTimingReconcileResult, type WorkflowTimingRevision, type WorkflowTimingRun, type WorkflowTimingRunDuration, type WorkflowTimingRunFact, type WorkflowTimingRunList, type WorkflowTimingRunListQuery, type WorkflowTimingRunProjection, type WorkflowTimingRunSummary, type WorkflowTimingRunTiming, type WorkflowTimingState, type WorkflowTimingStepDeclaration, type WorkflowTimingStepDefinition, type WorkflowTimingStepDuration, type WorkflowTimingStepFact, } from "./admin-workflow-timings.js";
import { AccountingEvidenceAdminClient } from "./admin-accounting-evidence.js";
import { CampaignEmailAdminClient } from "./admin-campaign-email.js";
import { EmailRelayAdminClient } from "./admin-email-relay.js";
import { EnvironmentPolicyAdminClient } from "./admin-environment-policy.js";
import { ErrorIssueAdminClient } from "./admin-error-issues.js";
import { EventTypeAdminClient } from "./admin-event-types.js";
import { ImpersonationAdminClient } from "./admin-impersonation.js";
import { IngestClaimAdminClient } from "./admin-ingest-claims.js";
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
import { ParserClient } from "./parsers.js";
import { PublicReadClient } from "./public-reads.js";
import type { CompletedRunExportRequest, ReportingDashboardCatalogue, ReportingDashboardGeneration, ReportingDashboardGenerationRequest, ReportingDraftPreviewRequest } from "./reporting-catalogue.js";
import { type EventSchemaDocument, type EventSchemaRegisterRequest, type EventSchemaStateResult, type EventSchemaVersionList, type RegisteredEventType, type RegisteredEventTypeList } from "./schema-registry.js";
import { type SiteAIOwnerSession } from "./site-ai-owner.js";
export type { AppRelease, AppReleaseCacheMode, AppReleaseCacheRule, AppReleaseCreateRequest, AppReleaseFile, AppReleaseFramingMode, AppReleaseHeaderRule, AppReleaseList, AppReleaseManifest, AppReleasePromotion, AppReleaseResponseHeader, AppReleaseRouting, AppReleaseShareableRoute, AppReleaseSiteCard, AppReleaseSpaFallback, AppReleaseState, AppReleaseSummary, AppReleaseUploadedFile, } from "./admin-app-releases.js";
export { APP_ERROR_CODES, APP_REASON_CODES, APP_SIGN_IN_MODES, APP_STATUSES, type AppCreateRequest, type AppCreation, type AppDeployCredential, type AppDeployCredentialList, type AppDeployCredentialSummary, type AppListResponse, type AppOverview, type AppReason, type AppReasonCode, type AppSignInMode, type AppSignInRequest, type AppStatus, type AppSummary, type AppTrafficReporting, } from "./admin-apps.js";
export { type ApplicationIdentityTrait, type ApplicationIdentityTraitsStatus, type ApplicationIdentityTraitValue, type ApplicationMembershipChoice, type ApplicationMembershipContext, type ApplicationMembershipRevocation, type ApplicationMembershipRevokeRequest, type ApplicationPrincipalErasure, type ApplicationPrincipalErasureRequest, type ApplicationPrincipalExport, type ApplicationPrincipalIdentityExport, type ApplicationPrincipalListItem, type ApplicationPrincipalListQuery, type ApplicationPrincipalListResponse, type ApplicationPrincipalMembershipView, type ApplicationPrincipalProfile, type ApplicationPrincipalProfileValueView, type ApplicationPrincipalSuspension, type ApplicationPrincipalTarget, type ApplicationProfileField, type ApplicationProfileValue, type ApplicationProfileValuesRequest, type ApplicationSession, type ApplicationSessionInventory, type ApplicationSessionRevocation, type ApplicationSessionRevokeRequest, type ApplicationSessionsRevokeAllRequest, type AudienceGrant, type AudienceGrantRequest, type AuthEnvironmentClientCleanup, type AuthEnvironmentHostingRemoval, type AuthEnvironmentHostingWithdrawal, type AuthEnvironmentRetainedResources, AuthProjectAdminClient, type AuthProjectApplicationSessionPolicy, type AuthProjectAudienceBinding, type AuthProjectCapability, type AuthProjectChange, type AuthProjectClientRegistration, type AuthProjectClientSync, type AuthProjectClientSyncRegistration, type AuthProjectClientSyncReport, type AuthProjectClientSyncRequest, type AuthProjectConfiguredState, type AuthProjectCreateRequest, type AuthProjectCreation, type AuthProjectDeletion, type AuthProjectDeletionRequest, type AuthProjectDesiredState, type AuthProjectDesiredStateRequest, type AuthProjectDirectoryAction, type AuthProjectDirectoryCapacity, type AuthProjectDirectoryRequest, type AuthProjectDirectoryStatus, type AuthProjectDirectoryView, type AuthProjectEnvironmentCreateRequest, type AuthProjectEnvironmentDeletion, type AuthProjectEnvironmentDeletionRequest, type AuthProjectEnvironmentOffboarding, type AuthProjectEnvironmentOffboardRequest, type AuthProjectEnvironmentOrganisation, type AuthProjectEnvironmentOrganisationList, type AuthProjectEnvironmentReleasedResources, type AuthProjectHostedSignIn, type AuthProjectHosting, type AuthProjectHostingCapability, type AuthProjectHostingIngestTarget, type AuthProjectHostingMode, type AuthProjectHostingRemoval, type AuthProjectHostingStatus, type AuthProjectIdentityMode, type AuthProjectInvitation, type AuthProjectInvitationIssued, type AuthProjectInvitationIssueRequest, type AuthProjectInvitationListResponse, type AuthProjectInvitationRedeliveryRequest, type AuthProjectInvitationRevocationRequest, type AuthProjectListResponse, type AuthProjectOperation, type AuthProjectPreview, type AuthProjectProfileField, AuthProjectRealmNotConvergedError, AuthProjectRealmProvisionError, type AuthProjectRealmProvisionReceipt, type AuthProjectRealmProvisionRequest, type AuthProjectRealmStep, type AuthProjectReleasedResources, type AuthProjectSocialProvider, type AuthProjectSocialProviderName, type AuthProjectSocialSignIn, type AuthProjectSocialSignInStatus, type AuthProjectStatus, type AuthProjectSummary, type PrincipalAudience, type PrincipalAudiences, } from "./admin-auth-projects.js";
export { type ClientSetupApplyAndWaitOptions, type ClientSetupApplyAndWaitResult, type ClientSetupApplyOptions, type ClientSetupApplyResponse, ClientSetupClient, type ClientSetupEventTypeDesiredState, type ClientSetupManifest, type ClientSetupOAuthClientDesiredState, type ClientSetupOAuthPurposeProfile, type ClientSetupOperationPending, type ClientSetupOperationStatus, type ClientSetupPrivacyDesiredState, type ClientSetupPrivacyRule, type ClientSetupReadinessResponse, type ClientSetupReportingPackDesiredState, type ClientSetupResourceStatus, type ClientSetupRetentionDesiredState, type ClientSetupSchemaDesiredState, validateClientSetupManifest, } from "./admin-client-setup.js";
export { DataLabelAdminClient, type DataLabelAssignmentListResponse, type DataLabelCatalogue, type DataLabelCatalogueAssignment, type DataLabelCatalogueDataset, type DataLabelCataloguePack, type DataLabelCatalogueResponse, type DataLabelDefinition, type DataLabelDefinitionCreateRequest, type DataLabelDefinitionListResponse, type DataLabelDefinitionUpdateRequest, type DataLabelPropagationPolicy, type DataLabelSensitivity, type DataLabelUsage, type DataLabelUsageListResponse, type DataLabelValue, type DataLabelValueCreateRequest, type DataLabelValueUpdateRequest, type DescriptiveDataLabel, type EventTypeDataLabelDefault, type EventTypeDataLabelDefaultRequest, type SchemaFieldDataLabelAssignment, type SchemaFieldDataLabelAssignmentRequest, } from "./admin-data-labels.js";
export { type DataScope, type DataScopeAction, DataScopeAdminClient, type DataScopeCreateRequest, type DataScopeGrant, type DataScopeGrantListResponse, type DataScopeGrantTarget, type DataScopeGrantTargetKind, type DataScopeListResponse, type DataScopePrincipalKind, type DataScopePrincipalRef, type DataScopeResource, type DataScopeResourceCreateRequest, type DataScopeResourceListResponse, type DataScopeResourceUpdateRequest, type DataScopeStatus, type DataScopeUpdateRequest, validDataScopeCode, validDataScopeName, } from "./admin-data-scopes.js";
export { type OffboardingAcknowledgeResponse, type OffboardingCancelRequest, OffboardingClient, type OffboardingDownloadResponse, type OffboardingDownloadStream, type OffboardingExecuteResponse, type OffboardingExportResponse, type OffboardingPreviewExclusion, type OffboardingPreviewResponse, type OffboardingPreviewStore, type OffboardingReceiptPerStore, type OffboardingReceiptResponse, type OffboardingRequest, type OffboardingRequestCreate, type OffboardingRequesterKind, type OffboardingRetryResponse, type OffboardingSchedule, type OffboardingScheduleListResponse, type OffboardingScheduleRequest, type OffboardingWaiver, } from "./admin-offboarding.js";
export { type PredictionActivateRequest, PredictionAdminClient, type PredictionDefinition, type PredictionDefinitionCreateRequest, type PredictionDefinitionListResponse, type PredictionDefinitionUpdateRequest, type PredictionEvaluationSummary, type PredictionOutcomeListResponse, type PredictionOutcomeSummary, type PredictionPauseRequest, type PredictionProjectKind, type PredictionRunListResponse, type PredictionRunNowRequest, type PredictionRunSummary, type PredictionSignalSource, type PredictionSignalSourceCreateRequest, type PredictionSignalSourceListResponse, type PredictionThresholdEvent, type PredictionThresholdEventListResponse, type PredictionVersion, type PredictionVersionPublishRequest, } from "./admin-predictions.js";
export { type PrivacyErasure, PrivacyErasureClient, type PrivacyErasureCreateRequest, PrivacyErasureError, type PrivacyErasureListResponse, type PrivacyErasureRetryClassification, type PrivacyErasureSelector, type PrivacyErasureState, type PrivacyErasureWaitOptions, } from "./admin-privacy-erasures.js";
export { type RetentionClass, RetentionClient, type RetentionPolicy, type RetentionPolicyListResponse, type RetentionPolicyUpsertRequest, type RetentionRun, type RetentionRunPreview, type RetentionRunsListResponse, type RetentionRunsPage, type RetentionScope, type RetentionStoreBreakdown, } from "./admin-retention.js";
export type { SiteAIConsentRequest, SiteAIMode, SiteAIOwnerHandoff, SiteAIOwnerHandoffRequest, SiteAIPlatformUsage, SiteAIProduct, SiteAISettings, SiteAISettingsRequest, SiteAITenantUsage, SiteAIUsage, SiteAIUsagePeriod, SiteAIUsageRow, } from "./admin-site-ai.js";
export { SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE, SITE_ANALYTICS_PROPERTY_INVALID_CODE, SITE_ANALYTICS_PROVIDER_GA4, type SiteAnalyticsConnection, type SiteAnalyticsConnectionRequest, type SiteAnalyticsReport, type SiteAnalyticsRow, type SiteAnalyticsUnavailable, SiteAnalyticsUnavailableReport, } from "./admin-site-analytics.js";
export { SITE_AUDIT_PAGES_DEFAULT_LIMIT, SITE_AUDIT_PAGES_MAX_LIMIT, SITE_LIGHTHOUSE_MAX_EXTRA_PAGES, SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE, type SiteAuditDelta, type SiteAuditPage, SiteAuditPageIndexability, type SiteAuditPageList, SiteAuditRun, type SiteLighthousePages, type SiteLighthouseRequestOptions, } from "./admin-site-audit-pages.js";
export { SITE_CAMPAIGN_LINK_LIMIT_CODE, SITE_CAMPAIGN_LINK_TAKEN_CODE, SITE_CAMPAIGN_LINKS_MAX, type SiteCampaignLink, type SiteCampaignLinkList, type SiteCampaignLinkRequest, } from "./admin-site-campaign-links.js";
export { SITE_BROWSER_COLLECTOR_MODES, SITE_DOMAIN_NOT_VERIFIED_CODE, SITE_FINDING_DISMISSAL_SCOPES, SITE_SEARCH_CONNECTION_NOT_FOUND_CODE, SITE_SEARCH_NOT_CONFIGURED_CODE, SITE_SEARCH_RETRY_NOT_FAILING_CODE, type SiteAlertDestination, type SiteAlertDestinationRequest, type SiteAuditSummary, type SiteBrowserCollector, type SiteBrowserCollectorMode, type SiteBrowserCollectorRequest, type SiteCheckMode, type SiteChromeUX, type SiteChromeUXObservation, type SiteDomain, SiteDomainAdminClient, type SiteDomainAttestation, type SiteDomainAudit, type SiteDomainChecks, type SiteDomainCreateRequest, type SiteDomainList, type SiteDomainOwnership, type SiteDomainRequestOptions, type SiteDomainVerification, type SiteDomainVerifiedBy, type SiteFinding, type SiteFindingDismissal, type SiteFindingDismissalRequest, type SiteFindingDismissalScope, type SiteFindingDismissals, type SiteFindingHistory, type SiteFindingList, type SiteFindingSeverity, type SiteFindingState, type SiteFindingSuggestion, type SiteIncident, type SiteIncidentList, type SiteProbe, type SiteProbeDetail, type SiteProbeList, type SiteProbeSpec, type SiteRegistration, SiteRule, type SiteRuleId, type SiteSearchAccount, type SiteSearchConnection, type SiteSearchConnectionRequest, type SiteSearchConnectionStatus, type SiteSearchDay, type SiteSearchPerformance, type SiteSearchProvider, type SiteSearchRow, type SiteSearchSource, type SiteSearchTotals, type SiteTLS, type SiteUptime, type SiteUptimeStatus, type SiteWarming, } from "./admin-site-domains.js";
export { SITE_INSIGHTS_EXPORT_SCHEMA, SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT, type SiteInsightsExport, type SiteInsightsMonitoringExport, type SiteInsightsReportsExport, type SiteInsightsSearchExport, type SiteInsightsSiteExport, type SiteSearchMetricDay, SiteSearchMetricDimension, type SiteSearchMetricPage, type SiteSearchMetricsQuery, } from "./admin-site-export.js";
export { type IndexNowState, type IndexNowSubmission, type IndexNowSubmissionRequest, IndexNowSubmissionStatus, SITE_CHOICE_REQUIRED_CODE, SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE, SITE_INDEXNOW_KEY_UNVERIFIED_CODE, SITE_INDEXNOW_LIMIT_CODE, SITE_INDEXNOW_NOT_ENABLED_CODE, SITE_INDEXNOW_URLS_INVALID_CODE, SITE_PAGE_NOT_ON_DOMAIN_CODE, SITE_PAGE_NOT_READ_CODE, SITE_PAGE_RECHECK_LIMIT_CODE, SITE_PAGE_RECHECK_READ_LIMIT, SITE_SEARCH_INSPECTION_LIMIT_CODE, SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE, SITE_SEARCH_INSPECTION_URL_INVALID_CODE, type SiteGeneratedFix, SiteGeneratedFormat, type SiteHreflangLink, type SiteLighthouseHistory, type SiteLighthouseMetrics, type SiteLighthousePageComparison, type SiteLighthouseProfile, type SiteLighthouseRun, type SiteLighthouseScores, type SiteMarket, type SiteObservedWording, type SitePageCheckRequest, type SitePageCheckResponse, SitePageCheckScope, type SitePageFacts, type SitePageFinding, type SitePageHeading, type SitePageOpenGraph, type SitePageReadability, type SitePageRecheck, type SitePageRecheckList, SitePageRecheckState, type SitePageRobots, type SitePageTwitter, type SitePageWordingQuery, type SitePhraseUse, type SiteProjectContext, type SiteProjectContextRequest, type SiteRemedy, SiteRemedyKind, type SiteReport, type SiteReportAudit, type SiteReportCertificate, type SiteReportFinding, type SiteReportSearch, type SiteReportShare, type SiteReportShareCreated, type SiteReportShareList, type SiteReportShareRequest, type SiteReportSpeed, type SiteReportUptime, type SiteResponseHour, type SiteRobotsRule, type SiteRobotsTestRequest, type SiteRobotsTestResponse, type SiteSearchDimension, type SiteSearchInspection, type SiteSearchInspectionList, type SiteSearchInspectionStatus, type SiteSearchRowPage, type SiteSearchRowsQuery, type SiteSearchUnavailable, type SiteUptimeDay, type SiteUptimeHistory, type SiteUptimeWindow, type SiteUptimeWindows, type SiteWordingCompare, type SiteWordingCompareRequest, type SiteWordingObservation, type SiteWordingObservationState, } from "./admin-site-insights.js";
export { SiteInsightsAdminClient, type SiteInsightsBacklog, type SiteInsightsTaskList, SiteInsightsTaskName, type SiteInsightsTaskStatus, } from "./admin-site-insights-tasks.js";
export { type SiteDomainAuthority, SiteLinkSource, SiteLinkSourceStatus, type SiteLinkSourceTotal, type SiteLostLinks, type SiteLostReferringDomain, type SiteReferringDomain, type SiteReferringDomains, } from "./admin-site-links.js";
export { PRIVATE_UPTIME_FAILURES, PRIVATE_UPTIME_STATUSES, type PrivateUptimeCredential, type PrivateUptimeFailure, type PrivateUptimeMonitor, type PrivateUptimeReport, type PrivateUptimeStatus, type PrivateUptimeWork, SITE_HEARTBEAT_OUTCOMES, SITE_HEARTBEAT_STATUSES, type SiteHeartbeatCreateRequest, type SiteHeartbeatCredential, type SiteHeartbeatList, type SiteHeartbeatMonitor, type SiteHeartbeatOutcome, type SiteHeartbeatReceipt, type SiteHeartbeatReport, type SiteHeartbeatSchedule, type SiteHeartbeatStatus, type SiteMaintenanceWindow, type SiteMaintenanceWindowRequest, type SiteMaintenanceWindows, } from "./admin-site-monitors.js";
export { SITE_NEXT_ACTIONS_MAX, type SiteFindingCounts, type SiteNextAction, SiteNextActionKind, SiteNextActionPlace, type SiteNextActions, type SiteNextActionTarget, SiteNotChecked, type SitePortfolioDomain, type SitePortfolioSummary, } from "./admin-site-next-actions.js";
export { type SitePageLinkSource, SitePageLinkSourceWhere, SitePageQueriesState, type SitePageQuery, type SitePageQueryWindow, type SitePageSearchQueries, type SiteTitleOption, SiteTitleTemplate, } from "./admin-site-page-queries.js";
export { SITE_RANKINGS_DAYS_INVALID_CODE, SITE_RANKINGS_DEFAULT_DAYS, SITE_RANKINGS_MAX_DAYS, SITE_TRACKED_KEYWORD_ALL, SITE_TRACKED_KEYWORD_DEFAULT_NOTIFY_POSITION, SITE_TRACKED_KEYWORD_DUPLICATE_CODE, SITE_TRACKED_KEYWORD_INVALID_CODE, SITE_TRACKED_KEYWORD_LIMIT_CODE, SITE_TRACKED_KEYWORD_NOT_FOUND_CODE, SITE_TRACKED_KEYWORDS_MAX, SiteRankDevice, type SiteRankings, SiteRankingsSource, type SiteRankObservation, SiteRankState, type SiteTrackedKeyword, SiteTrackedKeywordStatus, type SiteTrackedKeywordUpdate, type SiteTrackKeywordRequest, } from "./admin-site-rankings.js";
export { SAVED_SITE_REPORT_LIMIT_CODE, SAVED_SITE_REPORT_NAME_TAKEN_CODE, type SavedSiteReport, type SavedSiteReportList, type SavedSiteReportRequest, type SavedSiteReportSummary, SITE_SAVED_REPORTS_MAX, type SiteReportRequestOptions, SiteReportTemplate, } from "./admin-site-saved-reports.js";
export { SEARCH_POOL_MIN_CONTRIBUTORS, SEARCH_POOL_MIN_IMPRESSIONS, SEARCH_POOL_QUERIES_DEFAULT_LIMIT, SEARCH_POOL_QUERIES_MAX_LIMIT, SEARCH_POOL_SEARCH_MAX_LENGTH, SEARCH_POOL_TERMS_VERSION, SEARCH_POOL_WINDOW_DAYS, SearchPoolAccess, type SearchPoolBand, SearchPoolDemandBand, type SearchPoolPositions, type SearchPoolQuery, type SearchPoolQueryPage, type SearchPoolSetting, SITE_SEARCH_POOL_NOT_JOINED_CODE, SITE_SEARCH_POOL_QUERY_INVALID_CODE, SITE_SEARCH_POOL_SETTING_INVALID_CODE, SITE_SEARCH_POOL_SITE_BOUND_CODE, } from "./admin-site-search-pool.js";
export { SITE_FINDING_IMPACT_DEFAULT_DAYS, SITE_FINDING_IMPACT_MAX_DAYS, SITE_FINDING_IMPACT_MIN_DAYS, SITE_SEARCH_VALUE_DEFAULT_DAYS, SITE_SEARCH_VALUE_MAX_DAYS, SITE_SEARCH_VALUE_MAX_GOALS, SITE_SEARCH_VALUE_MAX_PAGES, type SiteFindingImpact, type SiteFindingImpactPeriod, type SiteFindingImpactSource, SiteFindingImpactStatus, type SiteFindingImpactWindow, SiteSearchGoalStatus, type SiteSearchValue, type SiteSearchValuePage, } from "./admin-site-search-value.js";
export { type SiteStatusComponent, type SiteStatusComponentStatus, type SiteStatusPage, type SiteStatusPageDraft, type SiteStatusPagePublication, type SiteStatusPageSelection, type SiteStatusPageSettings, type SiteStatusUpdate, type SiteStatusUpdateHistory, type SiteStatusUpdateRequest, siteStatusPagePublicUrl, } from "./admin-site-status-page.js";
export { ACCESS_LOG_HOUR_INVALID_CODE, type AccessLogHourReplay, AccessLogHourStatus, type SiteAIPage, type SiteAIVisibility, SiteCrawlerIdentity, SiteReferrerClass, type SiteTraffic, type SiteTrafficCount, type SiteTrafficCoverage, type SiteTrafficCrawler, type SiteTrafficDay, SiteTrafficDayCoverage, type SiteTrafficReferrer, type SiteTrafficReferrerClass, type SiteTrafficSlowPath, type SiteTrafficTotals, TRAFFIC_OTHER_KEY, } from "./admin-site-traffic.js";
export { SITE_KEYWORD_DEMAND_SOURCE_BING, SITE_KEYWORD_LIST_LIMIT_CODE, SITE_KEYWORD_LIST_NOT_FOUND_CODE, type SiteContentGap, type SiteContentGapCompetitor, SiteContentGapCoverage, type SiteContentGapPage, type SiteContentGapTopic, type SiteKeywordCluster, type SiteKeywordClusters, type SiteKeywordDemand, type SiteKeywordDemandSet, SiteKeywordDemandState, type SiteKeywordList, type SiteKeywordListRequest, type SiteKeywordLists, type SiteRelatedKeyword, type SiteRelatedKeywords, type SiteStrikingKeyword, type SiteTopicTrend, type SiteTopicTrendMonth, SiteTopicTrendSource, SiteTopicTrendStatus, SiteTrancoBand, type SiteWebDomain, SiteWebDomainRole, type SiteWebDomains, SiteWebInventoryStatus, type SiteWebPage, SiteWebPageSource, type SiteWebPages, type SiteWebPagesQuery, } from "./admin-site-web-data.js";
export { type SubjectExport, type SubjectExportArtifactScope, SubjectExportClient, type SubjectExportCreateRequest, type SubjectExportDownloadResponse, type SubjectExportForceOptions, type SubjectExportListResponse, type SubjectExportScope, type SubjectExportStatus, type SubjectExportStoreProgress, } from "./admin-subject-exports.js";
export { TenantStorageClient, type TenantStorageListResponse, type TenantStorageLocation, } from "./admin-tenant-storage.js";
export { type TimePlan, TimePlanAdminClient, type TimePlanAllocation, type TimePlanAllocationBasis, type TimePlanAllocationPreview, type TimePlanAnnotation, type TimePlanAnnotationField, type TimePlanAnnotationInput, type TimePlanAnnotationListResponse, type TimePlanAnnotationSchema, type TimePlanAnnotationType, type TimePlanCalculationChange, type TimePlanCalculationReceipt, type TimePlanCommandRequest, type TimePlanCommandResult, type TimePlanCorrectedCommand, type TimePlanCreatedRun, type TimePlanDefinition, type TimePlanDefinitionBlock, type TimePlanDraftRequest, type TimePlanDraftRevisionRequest, type TimePlanHistoryResponse, type TimePlanListResponse, type TimePlanRedactionRequest, type TimePlanRevisionRequest, type TimePlanRun, type TimePlanRunBlock, type TimePlanRunRequest, type TimePlanStoredDefinition, type TimePlanThresholdCue, type TimePlanThresholdCueSeverity, type TimePlanTransition, type TimePlanVersion, validateTimePlanDefinition, } from "./admin-timeplans.js";
export { USAGE_DEFAULT_LIMIT, USAGE_MAX_LIMIT, UsageAdminClient, type UsageCompletenessState, type UsageQuery, type UsageReport, type UsageRow, type UsageTotal, } from "./admin-usage.js";
export { ANALYTICS_MAX_LABEL_FILTERS, ANALYTICS_MAX_RANGE_DAYS, ANALYTICS_RANGE_GROUP_BY, AnalyticsEventClient, type AnalyticsEventQueryRequest, type AnalyticsEventQueryResponse, type AnalyticsEventRangeBucket, type AnalyticsEventRangeQueryRequest, type AnalyticsEventRangeQueryResponse, type AnalyticsEventRow, type AnalyticsEventSourceSummary, type AnalyticsEventTiming, type AnalyticsLabelFilter, type AnalyticsQuerySource, type AnalyticsRangeQuerySource, } from "./analytics-events.js";
export { BackendLifecycleClient, type BackendLifecycleDownloader, type BackendLifecycleRequester, type CompleteOffboardingOptions, type CompleteOffboardingResult, createVerifiedOffboardingExportReceiver, type OneTimeCredentialSecret, type PersistOffboardingExport, type PersistOneTimeCredentialSecret, type ReceiveAndVerifyOffboardingExport, type RotateCredentialOptions, type RotateCredentialResult, type VerifiedExportReceiverOptions, type VerifyZeroState, type ZeroStateReconciliationOptions, type ZeroStateReconciliationResult, } from "./backend-lifecycle.js";
export { BrowserSignIn, type BrowserSignInConfig, type BrowserSignInEndpoints, type CustdDiscoveryDocument, type CustdDiscoverySignIn, createSignInCodeChallenge, DEFAULT_SIGN_IN_SCOPES, SIGN_IN_ERROR_CODES, SIGN_IN_STATUSES, type SignInCompletion, type SignInDiscoveryOptions, SignInError, type SignInErrorCode, type SignInRestoreResult, type SignInSession, type SignInStart, type SignInStartOptions, type SignInState, type SignInStatus, type SignInStorage, type SignOutOptions, type SignOutResult, signInConfigFromDiscovery, } from "./browser-sign-in.js";
export type { CustdDownloadStream } from "./download-stream.js";
export { DEFAULT_PARSER_FRAMING_MAX_LINES, DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES, MAX_PARSER_FRAMING_LINES, MAX_PARSER_FRAMING_RECORD_BYTES, ParserClient, type ParserDefinition, type ParserDeleteResponse, type ParserFraming, type ParserFramingOutcome, type ParserFramingType, type ParserGeneratedFieldConfig, type ParserListResponse, type ParserPreset, type ParserPresetListResponse, type ParserPreviewDefinition, type ParserPreviewRequest, type ParserPreviewResponse, type ParserPreviewRow, type ParserSaveRequest, type ParserType, } from "./parsers.js";
export { classifyReportingData, getReportingViewState, type ReportingDataState, type ReportingQueryState, type ReportingViewState, reportingQueryKey, } from "./reporting-state.js";
export { checkRuntimeReadiness, type RuntimeReadinessCredentialResult, type RuntimeReadinessOAuthConfig, type RuntimeReadinessOptions, type RuntimeReadinessResult, } from "./runtime-readiness.js";
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
export { createMobileAsyncQueueStorage, createMobileFlushTriggers, type MobileAppState, type MobileFlushTriggerOptions, type MobileKeyValueStorage, type MobileNetwork, type MobileNetworkState, type MobileSubscription, } from "./mobile-adapter.js";
export { createMobileEvent, type MobileEventContext, type MobileEventInput, type MobileNetworkState as MobileEventNetworkState, type MobilePlatform, type MobileSubject, } from "./mobile-context.js";
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
};
type EventResult = {
    eventUuid?: string;
    success?: boolean;
    status?: number;
    error?: ProblemDetails;
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
export declare function createRawRequestIdempotencyKey(): RawRequestIdempotencyKey;
/** Mint one prepared request with a fresh, retained idempotency key. */
export declare function createRawIngestRequest(input: RawIngestInput): RawIngestRequest;
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
    scopeTemplate?: "events" | "schemas" | "managed-audit" | "managed-audit-reporting-read" | "managed-audit-reporting-subject-insight" | "managed-audit-event-read" | "site-insights" | "site-insights-read" | "site-ai-read" | "hosting-email-delivery" | "hosting-panel-read";
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
};
export declare class AdminWorkflowError extends Error {
    readonly status: number;
    readonly reason: string;
    readonly code: string;
    readonly safeNextAction: string;
    readonly name = "AdminWorkflowError";
    constructor(status: number, reason: string, code: string, safeNextAction: string);
}
export declare class CustdRequestError extends Error {
    readonly status: number | null;
    readonly code: string;
    readonly retryability: "none" | "bounded";
    readonly nextAction: NonNullable<ProblemDetails["nextAction"]>;
    readonly problem?: ProblemDetails | undefined;
    readonly name = "CustdRequestError";
    readonly cause?: unknown;
    constructor(status: number | null, code: string, retryability: "none" | "bounded", nextAction: NonNullable<ProblemDetails["nextAction"]>, problem?: ProblemDetails | undefined, options?: {
        cause?: unknown;
    });
    get unavailable(): boolean;
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
export declare class CustdRawAcceptanceUnknownError extends Error {
    readonly name = "CustdRawAcceptanceUnknownError";
    readonly retryability: "none";
    readonly nextAction: {
        action: "escalate";
    };
    readonly cause?: unknown;
    /** The original operation idempotency key, when the request carried one. */
    readonly operationKey?: RawRequestIdempotencyKey;
    constructor(options?: {
        cause?: unknown;
        operationKey?: RawRequestIdempotencyKey;
    });
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
    provenance: {
        owner: string;
        generation?: string;
        sourceUrn?: string;
        watermark?: string;
    };
    retryability: "none" | "bounded";
    warnings?: Array<{
        code: string;
        message: string;
    }> | null;
    nextAction: {
        action: PreparedDataNextAction;
        pollAfterSeconds?: number;
        maxRetries?: number;
    };
};
export type PreparedDataReceiptStatus = PreparedDataStatus & {
    receiptUuid: string;
};
export type PreparedDataOutputStatus = PreparedDataStatus & {
    outputUuid: string;
};
export type PreparedDataOutputList = {
    outputs: PreparedDataOutputStatus[] | null;
};
export type PreparedDataQueryEnvelope = {
    output: PreparedDataOutputStatus;
    data: RenderedWidgetData;
};
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
export type TenantHistoricalCleanupWaiver = {
    role: string;
    timestamp: string;
};
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
export declare const SCHEMA_AUDIT_TENANT_NOT_FOUND_CODE = "schema_audit_tenant_not_found";
/** A 400 on schema audit: the request names no tenantSlug. */
export declare const SCHEMA_AUDIT_TENANT_SLUG_REQUIRED_CODE = "schema_audit_tenant_slug_required";
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
export type AdminStorageAlertDelivery = {
    state: string;
    updatedAt?: string;
    error?: string;
};
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
export type AdminStorageAlertEventListResponse = {
    events: AdminStorageAlertEvent[];
};
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
export type AdminAuditListCursor = {
    cursor: string;
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
export type RenderedUnit = "currency_per_unit" | "count" | "milliseconds" | "bytes" | "percent" | "currency" | "W" | "kW" | "Wh" | "kWh" | "V" | "A" | "L" | "Cel" | "L/s" | "score";
/** How a reporting-pack metric is computed. */
export type PackMetricKind = "count" | "unique_count" | "rate" | "latency" | "percentile" | "failure_ratio" | "freshness_age" | "latest_value" | "probability" | "quantile" | "credible_interval" | "forecast_date" | "value_of_information";
/** The accounting or measurement calculation a reporting-pack metric applies. */
export type PackMetricCalculation = "usage_charge" | "marginal_rate" | "projection" | "purchased_vs_used" | "observed_balance" | "projected_balance" | "allocated_recovery" | "correction_count" | "count" | "failure_count" | "flow" | "distinct_count" | "sum" | "average" | "percentile" | "ratio" | "latest" | "minimum" | "maximum" | "firstLastDelta" | "timeWeightedAverage" | "rate" | "integral";
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
    summaryTemplateId: "forecast_window_evidence" | "anomaly_reference_evidence" | "descriptive_driver_evidence" | "uncertainty_reference_evidence";
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
export type ObservationSource = {
    key: string;
    label: string;
};
export type ObservationAsset = {
    key: string;
    label: string;
};
export type SourceSeries = {
    sourceKey: string;
    sourceSeriesKey: string;
    priority: number;
};
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
export type AssetNode = {
    tenantKey: string;
    key: string;
    label: string;
};
export type AssetHierarchyEdge = {
    tenantKey: string;
    parentKey: string;
    childKey: string;
    mode: string;
};
export type AssetHierarchy = {
    version: number;
    tenantKey: string;
    maxDepth?: number;
    nodes: AssetNode[];
    edges?: AssetHierarchyEdge[];
};
export type RateTier = {
    lowerBound: number;
    upperBound?: number;
    pricePerUnit: number;
};
export type AllocationTarget = {
    seriesKey: string;
    weight: number;
};
export type RoundingMode = "half_up" | "half_even" | "down" | "up";
export type RoundingPolicy = {
    mode: RoundingMode;
    decimalPlaces: number;
};
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
export type ReportingPackGenerationValidityListResponse = {
    generations: ReportingPackGenerationValidity[];
};
export type ReportingPackSetupBindingField = {
    key: string;
    label: string;
    required: boolean;
};
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
export type ReportingPackSetupTemplateListResponse = {
    templates: ReportingPackSetupTemplate[];
};
export type ReportingPackSetupTemplateBindRequest = {
    bindings: LogObservabilityBindings;
};
export type ReportingPackSetupTemplateBindResponse = {
    kind: string;
    definition: PackDefinition;
};
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
    period: {
        label: string;
        from?: string;
        to?: string;
    };
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
    conflicts: Array<{
        field: string;
        message: string;
    }>;
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
    sourceRange?: {
        start: string;
        end: string;
    };
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
    values: Array<{
        uuid: string;
        displayName: string;
    }>;
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
export declare class MemoryQueueStorage implements QueueStorage {
    private events;
    load(): EventEnvelope[];
    save(events: EventEnvelope[]): void;
    clear(): void;
}
export declare class LocalStorageQueueStorage implements QueueStorage {
    private key;
    constructor(key?: string);
    load(): EventEnvelope[];
    save(events: EventEnvelope[]): void;
    clear(): void;
}
export declare class CustdClient {
    readonly admin: AdminNamespace;
    readonly provisioning: ProvisioningNamespace;
    readonly reporting: ReportingNamespace;
    readonly schemas: SchemaNamespace;
    readonly analytics: AnalyticsEventClient;
    readonly parsers: ParserClient;
    readonly measurement: MeasurementClient;
    readonly ingestOperations: IngestOperationsClient;
    readonly publicReads: PublicReadClient;
    private baseUrl;
    private getToken;
    private fetchImpl;
    private defaultHeaders;
    private actingCompanySlug;
    private retry;
    private batch;
    private queueEnabled;
    private queueStorage;
    private queue;
    private maxQueueSize;
    private flushOnOnline;
    private onlineHandler;
    private compressionEnabled;
    private compressionThresholdBytes;
    private batchTimer;
    private removeFlushTriggers;
    private oauthToken;
    private readonly config;
    constructor(config: ClientConfig);
    static fromProvisionedProducer(credentials: ProvisionedProducerCredentials): CustdClient;
    static fromBrokerEnv(env: BrokerEnv, options?: BrokerEnvClientOptions): CustdClient;
    private fetchOAuthToken;
    ingestEvent(event: EventEnvelope): Promise<Response>;
    track(event: EventEnvelope): Promise<undefined | Response>;
    enqueue(event: EventEnvelope): void;
    flush(): Promise<void>;
    close(): void;
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
    ingestRawLines(request: RawIngestRequest, options?: RequestOptions): Promise<RawIngestResult>;
    private sendWithRetry;
    private sendBatchWithRetry;
    private encodeBatchBody;
    private assertBatchResponse;
    private batchRejectionMessage;
    private adminRequest;
    private actingCompanyPath;
    private adminDownload;
    private offboardingDownload;
    private auditExportDownload;
    private apiRequest;
    private publicRead;
    /**
     * Opens a data-space owner's AI settings session from a handoff, on the broker's hub server.
     * hubOrigin is the broker's registered hub origin; the session never sends this client's credential.
     */
    redeemSiteAIOwnerHandoff(handoff: SiteAIOwnerHandoff, hubOrigin: string, options?: RequestOptions): Promise<SiteAIOwnerSession>;
    private publicWrite;
    private apiDownload;
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
declare class ReportingNamespace {
    private readonly request;
    private readonly download;
    constructor(request: APIRequester, download: APIDownloader);
    createExport(input: ReportExportCreateRequest, options?: RequestOptions): Promise<ReportExportJob>;
    listExports(limit?: number, options?: RequestOptions): Promise<ReportExportJobList>;
    getExport(exportId: string, options?: RequestOptions): Promise<ReportExportJob>;
    cancelExport(exportId: string, reason?: string, options?: RequestOptions): Promise<ReportExportJob>;
    downloadExport(exportId: string, artifactId: string, options?: RequestOptions): Promise<Uint8Array>;
    /** Exports a completed time-plan run's frozen report source in one to eight formats. */
    createCompletedRunExport(input: CompletedRunExportRequest, options?: RequestOptions): Promise<ReportExportJob>;
    /** Lists the dashboards the tenant can open. */
    dashboards(options?: RequestOptions): Promise<ReportingDashboardCatalogue>;
    /** Starts, or returns, the data generation that backs one dashboard view. */
    generateDashboardData(input: ReportingDashboardGenerationRequest, options?: RequestOptions): Promise<ReportingDashboardGeneration>;
    /** Renders one query against a pack definition that is not published. */
    previewDraft(input: ReportingDraftPreviewRequest, options?: RequestOptions): Promise<RenderedWidgetData>;
    dashboard(key: string, options?: RequestOptions): Promise<ReportingDashboard>;
    receipt(receiptUuid: string, options?: RequestOptions): Promise<PreparedDataReceiptStatus>;
    outputs(options?: RequestOptions): Promise<PreparedDataOutputList>;
    output(outputUuid: string, options?: RequestOptions): Promise<PreparedDataOutputStatus>;
    queryOutput(outputUuid: string, request: ReportingQueryRequest, options?: RequestOptions): Promise<PreparedDataQueryEnvelope>;
    query(request: ReportingQueryRequest, options?: RequestOptions): Promise<RenderedWidgetData>;
    subjectInsight(request: SubjectInsightRequest, options?: RequestOptions): Promise<SubjectInsightResponse>;
}
declare class SchemaNamespace {
    private readonly request;
    constructor(request: SchemaRequester);
    validate(input: SchemaValidationRequest): Promise<SchemaValidationResponse>;
    dryRun(input: SchemaValidationRequest): Promise<SchemaValidationResponse>;
    infer(input: SchemaInferenceRequest): Promise<SchemaInferenceResponse>;
    /** Lists the tenant's event types. */
    list(): Promise<RegisteredEventTypeList>;
    /** Lists an event type's schema versions. */
    listVersions(eventType: string): Promise<EventSchemaVersionList>;
    /** Returns one version's JSON Schema document. */
    get(eventType: string, version: string): Promise<EventSchemaDocument>;
    /** Stores a schema version, creating the event type when it is new, and returns the event type. */
    register(input: EventSchemaRegisterRequest): Promise<RegisteredEventType>;
    /** Makes one version the event type's active schema. */
    activate(eventType: string, version: string): Promise<EventSchemaStateResult>;
    /** Lets events validate against one version again. */
    enable(eventType: string, version: string): Promise<EventSchemaStateResult>;
    /** Deprecates one version so new events no longer validate against it. */
    disable(eventType: string, version: string): Promise<EventSchemaStateResult>;
    /** Retires the tenant's event type. Its schemas and stored events stay readable. */
    disableEventType(eventType: string): Promise<EventSchemaStateResult>;
    sendTestEvent(event: EventEnvelope): Promise<SendTestEventResponse>;
}
declare class AdminNamespace {
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
    constructor(request: AdminRequester, nonAdminRequest: NonAdminRequester, offboardingDownload: (path: string, options?: RequestOptions) => Promise<OffboardingDownloadStream>, auditExportDownload: AdminAuditDownloader);
}
declare class ProvisioningNamespace {
    readonly dataSpaces: ProvisioningDataSpaceNamespace;
    readonly producers: ProvisioningProducerNamespace;
    readonly reservations: ProvisioningReservationsNamespace;
    constructor(request: APIRequester);
}
/** Producer reservations under one data space. A system administrator names the parent tenant. */
declare class ProvisioningReservationsNamespace {
    private readonly request;
    constructor(request: APIRequester);
    reserve(dataSpaceSlug: string, body: ProducerReservationCreateRequest, parentCompanySlug?: string): Promise<ProducerReservation>;
    list(dataSpaceSlug: string, parentCompanySlug?: string): Promise<ProducerReservationListResponse>;
    claim(dataSpaceSlug: string, producerSlug: string, body: ProducerReservationClaimRequest, parentCompanySlug?: string): Promise<ProducerReservation>;
    release(dataSpaceSlug: string, producerSlug: string, parentCompanySlug?: string): Promise<void>;
}
declare class ProvisioningDataSpaceNamespace {
    private readonly request;
    constructor(request: APIRequester);
    /** Creates a data space under the caller's company; a system administrator names the parent tenant. */
    create(dataSpace: DataSpaceCreate, parentCompanySlug?: string): Promise<DataSpace>;
    /** Lists the caller's data spaces; a system administrator names the parent tenant. */
    list(parentCompanySlug?: string): Promise<DataSpaceListResponse>;
    /** Reads retained storage per data space. A system administrator names the parent tenant. */
    usage(parentCompanySlug?: string): Promise<DataSpaceUsageSummary>;
    revoke(slug: string, parentCompanySlug?: string): Promise<void>;
    /** Asks Custd to erase everything a data space holds. The answer is the accepted request, not the finished erasure. */
    erase(slug: string, parentCompanySlug?: string): Promise<DataSpaceErasure>;
    getErasure(slug: string, parentCompanySlug?: string): Promise<DataSpaceErasure>;
}
declare class ProvisioningProducerNamespace {
    private readonly request;
    constructor(request: APIRequester);
    provision(request: ProducerProvisionCreate): Promise<ProvisionedProducerCredentials>;
    list(companySlug?: string): Promise<ProducerProvisionListResponse>;
    get(clientId: string): Promise<ProducerProvisionPublicClient>;
    rotateSecret(clientId: string): Promise<ProducerSecretRotation>;
    /**
     * Sets the environment recorded for this producer. It is the authenticated
     * default for events that do not declare their own, not a per-environment
     * credential: one producer is expected to carry every environment unless an
     * operator deliberately restricts it.
     */
    updateEnvironment(clientId: string, environment: string): Promise<ProducerProvisionPublicClient>;
    /** Replaces the public keys a producer minted with the hosting-email-delivery template signs with. */
    setSigningKeys(clientId: string, update: ProducerSigningKeysUpdate): Promise<ProducerSigningKeys>;
    revoke(clientId: string): Promise<void>;
}
declare class AdminTenantNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(tenant: AdminTenantCreate): Promise<AdminTenant>;
    list(): Promise<AdminTenantListResponse>;
    get(slug: string): Promise<AdminTenant>;
    delete(slug: string): Promise<void>;
    /**
     * Permanently removes an already deleted tenant once its cleanup is finished.
     * The server refuses an unready tenant with a conflict.
     */
    finalize(slug: string, companyId: number): Promise<void>;
    /**
     * Runs the credential-revoking, queue, database and object-storage cleanup for a
     * deleted tenant. The idempotencyKey is required: repeat it to retry the same cleanup.
     */
    historicalCleanup(slug: string, companyId: number, options?: RequestOptions): Promise<TenantHistoricalCleanupReceipt>;
    getDataSpaceEntitlement(slug: string): Promise<DataSpaceEntitlementState>;
    updateDataSpaceEntitlement(slug: string, body: DataSpaceEntitlementUpdateRequest): Promise<DataSpaceEntitlementState>;
    updateStorageLimit(slug: string, body: StorageLimitUpdateRequest): Promise<StorageLimit>;
}
declare class AdminOAuthClientNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(client: AdminOAuthClientCreate, options?: RequestOptions): Promise<AdminOAuthClientCreateResponse>;
    list(): Promise<AdminOAuthClientListResponse>;
    get(clientId: string): Promise<AdminOAuthClient>;
    delete(clientId: string, options?: RequestOptions): Promise<void>;
    rotateSecret(clientId: string, options?: RequestOptions): Promise<AdminOAuthClientSecretResponse>;
    /**
     * Issues a new secret for a client whose current secret nobody holds. The new secret is shown only
     * in this response.
     */
    replaceUnknownSecret(clientId: string, options?: RequestOptions): Promise<AdminOAuthClientSecretResponse>;
    updateScopes(clientId: string, body: AdminOAuthClientUpdateScopesRequest, options?: RequestOptions): Promise<AdminOAuthClient>;
}
declare class AdminSiteNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(site: AdminSiteCreate): Promise<AdminSiteCreateResponse>;
    list(): Promise<AdminSiteListResponse>;
    get(siteUuid: string): Promise<AdminSite>;
    update(siteUuid: string, body: AdminSiteUpdate): Promise<AdminSite>;
    delete(siteUuid: string): Promise<void>;
    rotateWriteKey(siteUuid: string): Promise<AdminSiteWriteKeyResponse>;
}
declare class AdminSchemaNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    validate(body: AdminSchemaValidateRequest): Promise<AdminSchemaValidateResult>;
    enableVersion(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaEnableRequest): Promise<void>;
    register(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaRegisterRequest): Promise<void>;
    dryRun(tenantSlug: string, eventTypeSlug: string, body: AdminSchemaDryRunRequest): Promise<AdminSchemaDryRunResult>;
    audit(tenantSlug?: string): Promise<AdminSchemaAuditListResponse>;
}
declare class AdminPrivacyNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    getRules(companySlug?: string): Promise<AdminPrivacyRulesResponse>;
    setRules(body: AdminPrivacyRuleUpdate): Promise<AdminPrivacyRulesResponse>;
    mapIdentifier(companySlug: string, body: AdminPrivacyIdentifierMapRequest): Promise<AdminPrivacyIdentifierMapping>;
    listIdentifierMappings(companySlug: string): Promise<AdminPrivacyIdentifierMappingList>;
    listConsent(subjectId: string, companySlug?: string): Promise<AdminPrivacyConsentList>;
    recordConsent(body: AdminPrivacyConsentRecordRequest): Promise<AdminPrivacyConsentRecord>;
    revokeConsent(subjectId: string, revoke: AdminPrivacyConsentRevokeRequest): Promise<AdminPrivacyConsentRecord>;
}
declare class AdminStorageAlertsNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    listRules(tenantSlug: string): Promise<AdminStorageAlertRuleListResponse>;
    createRule(tenantSlug: string, body: AdminStorageAlertRuleCreateRequest): Promise<AdminStorageAlertRule>;
    deleteRule(tenantSlug: string, ruleId: string): Promise<void>;
    listEvents(tenantSlug: string): Promise<AdminStorageAlertEventListResponse>;
}
declare class AdminAuditNamespace {
    private readonly request;
    private readonly download;
    constructor(request: AdminRequester, download: AdminAuditDownloader);
    private auditQuery;
    private auditLookupQuery;
    listEvents(options?: AdminAuditListOptions): Promise<AdminAuditListResponse>;
    getEvent(eventId: string, options?: AdminAuditListOptions): Promise<AdminAuditEvent>;
    exportEvents(options?: AdminAuditListOptions, format?: "csv" | "json"): Promise<AdminAuditExportResponse>;
    listReportingPackEvents(packKey: string): Promise<AdminReportingPackAuditListResponse>;
}
declare class AdminReportingPacksNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    listDrafts(): Promise<ReportingPackDraftListResponse>;
    /** List the reviewed setup templates (each with its canonical definition). */
    listSetupTemplates(): Promise<ReportingPackSetupTemplateListResponse>;
    /**
     * Apply typed bindings to one reviewed setup template and return the
     * server-built definition. Pure build: the server creates no data, grants no
     * scope, and writes no generation; post the result through createDraft/preview
     * only when the caller intends to.
     */
    bindSetupTemplate(kind: string, body: ReportingPackSetupTemplateBindRequest): Promise<ReportingPackSetupTemplateBindResponse>;
    getDraft(draftId: string): Promise<ReportingPackDraft>;
    createDraft(body: ReportingPackDraftCreateRequest): Promise<ReportingPackDraft>;
    updateDraft(draftId: string, body: ReportingPackDraftUpdateRequest): Promise<ReportingPackDraft>;
    validate(body: ReportingPackDraftCreateRequest): Promise<ReportingPackValidateResponse>;
    preview(body: ReportingPackPreviewRequest): Promise<ReportingPackPreviewResponse>;
    publish(draftId: string): Promise<ReportingPackGeneration>;
    restart(draftId: string): Promise<ReportingPackDraft>;
    getGeneration(generationId: string): Promise<ReportingPackGeneration>;
    getGenerationStatus(generationId: string): Promise<ReportingPackGenerationStatusResponse>;
    rollbackGeneration(generationId: string): Promise<ReportingPackGeneration>;
    listGenerationValidity(): Promise<ReportingPackGenerationValidityListResponse>;
    getRollupProvenance(generationId: string): Promise<ReportingPackRollupProvenance>;
}
export type PrepareEventMode = "producer" | "browser-cookieless";
export type PrepareEventOptions = {
    mode?: PrepareEventMode;
};
export declare function redactedProvisionedProducer(credentials: ProvisionedProducerCredentials): RedactedProvisionedProducerCredentials;
export declare function validateEvent(event: EventEnvelope): void;
/** Reserved envelope label carrying a declared environment. */
export declare const environmentLabelKey = "custd.environment";
/**
 * Checks a declared environment against the contract ingest applies, so a
 * rejected declaration fails locally instead of failing the event at the API.
 */
export declare function validateEnvironmentValue(value: string): void;
/**
 * Stamps the effective environment onto the envelope labels. An event-level
 * declaration wins over the client default, and a label the caller set is never
 * overwritten.
 */
export declare function applyEnvironmentLabel(event: EventEnvelope, clientEnvironment?: string): void;
export declare function validateBrowserEvent(event: EventEnvelope): void;
export declare function createDogfoodEvent(input: DogfoodEventInput): EventEnvelope;
export declare function prepareEvent(event: EventEnvelope, options?: PrepareEventOptions): EventEnvelope;
export declare class RetryableError extends Error {
}
export declare class CustdProblemError extends Error {
    readonly problem?: ProblemDetails;
    readonly failures: EventResult[];
    constructor(message: string, problem?: ProblemDetails, failures?: EventResult[]);
}
export declare function normalizeRetryOptions(options?: RetryOptions): Required<RetryOptions>;
export declare function withRetry<T>(options: Required<RetryOptions>, op: () => Promise<T>): Promise<T>;
/** Opaque per-event identity, including runtimes without Web Crypto. Not an authentication token. */
export declare function createEventId(): string;
export * from "./admin-accounting-evidence.js";
export * from "./admin-campaign-email.js";
export * from "./admin-email-relay.js";
export * from "./admin-environment-policy.js";
export * from "./admin-error-issues.js";
export * from "./admin-event-types.js";
export * from "./admin-impersonation.js";
export * from "./admin-ingest-claims.js";
export * from "./admin-managed-audit.js";
export * from "./admin-measurement-projects.js";
export * from "./admin-notification-destinations.js";
export * from "./admin-notification-webhooks.js";
export * from "./admin-oauth-client-admissions.js";
export * from "./admin-rls.js";
export * from "./admin-sdk-usage.js";
export type { SiteRegionalTrendMarket, SiteRegionalTrendMatch, SiteRegionalTrends, SiteTechnicalTrends, } from "./admin-site-regional-trends.js";
export * from "./admin-support-access.js";
export * from "./admin-system.js";
export * from "./admin-uncertainty-models.js";
export * from "./analytics-reads.js";
export * from "./app-account.js";
export { type CaptureExceptionRequest, createErrorCaptureEvent, ErrorCaptureClient, type ErrorCaptureConfig, type ErrorCaptureEvent, type ErrorCaptureEventConfig, type ErrorCaptureResult, type ErrorFrame, installBrowserErrorCapture, installNativeErrorCapture, type NativeErrorHandler, type NativeErrorSource, } from "./error-capture.js";
export * from "./ingest-operations.js";
export * from "./measurement.js";
export * from "./public-reads.js";
export * from "./reporting-catalogue.js";
export type { EventSchemaDocument, EventSchemaRegisterRequest, EventSchemaStateResult, EventSchemaVersion, EventSchemaVersionList, RegisteredEventType, RegisteredEventTypeList, } from "./schema-registry.js";
export { SiteAIOwnerSession, type SiteAIOwnerSettings, type SiteAIOwnerTransport } from "./site-ai-owner.js";
export * from "./site-monitor-reports.js";
