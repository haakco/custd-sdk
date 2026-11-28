//! Typed client for the Custd API.
//!
//! - [`CustdClient`] calls the signed-in measurement routes with a bearer access token.
//! - [`CustdClient`] also manages a Site's public status page by domain UUID.
//! - [`CustdClient`] also manages a Site's domains: verification, findings, uptime, page tools,
//!   search, keywords, reports, analytics and AI settings (the `/api/v1/site-domains` routes).
//! - [`CustdClient`] also administers hosted applications, auth projects (environments, domains,
//!   directories, principals, invitations and releases), producers, data spaces, tenant storage
//!   locations and Sites. Hosted applications are under `/api/v1/admin/apps`.
//! - [`CustdClient`] built with an application member's access token reads and writes that
//!   member's own profile (`/api/v1/app/profile`).
//! - [`CustdClient`] with an archive owner's access token imports messages and images into that
//!   owner's private archive (`/api/v1/app/messages`).
//! - [`CustdClient`] also runs measurement predictions, decisions and project changes, time plans,
//!   workflow timings, uncertainty models and reporting packs (Admin API), and the tenant's
//!   reporting, event queries, measurement reads and prepared-data receipts (Analytics API).
//! - [`CustdClient`] also administers the platform and the tenant: tenants, users and roles, OAuth
//!   clients and admissions, impersonation and support access, jobs and scheduled tasks, row-level
//!   security, storage and usage, audit and accounting, privacy, retention, offboarding, subject
//!   exports, data labels and scopes, event types and schemas, campaign email, the email relay,
//!   notifications, error issues and the tenant manifest.
//! - [`CustdClient`] also sends events and raw lines, manages event schemas and parsers, and runs
//!   the ingest operations: monitoring, diagnostics and generated-data cleanup plans and jobs.
//! - [`SiteCollector`] collects events and captures errors with a Site's public write key.
//! - [`get_site_config`], [`read_shared_site_report`], [`read_app_host_discovery`],
//!   [`read_public_status_page`] and the other public routes take no bearer token.
//! - [`submit_site_heartbeat`], [`submit_private_uptime`] and [`get_private_uptime_work`] report for
//!   one site monitor with its own write token.
//! - [`redeem_site_ai_owner_handoff`] opens a [`SiteAIOwnerSession`] in which a data-space owner
//!   changes their tenant's AI settings.
//! - [`AppClient`] calls the hosted-app item routes (`/api/v1/app/`) with an app's Site key and a
//!   link token, the signed-in user's token, or both: items, meetings, alerts and forecasts.
//! - [`read_hosted_app_discovery`] reads a hosted app's `/.well-known/custd.json`.
//! - [`BrowserLogin`] signs in to a hosted application with a configured loopback callback.
//! - [`DeviceLogin`] signs a person in with the RFC 8628 device flow, the same way `custdctl` does.
//!
//! Every call is blocking. Every request reports this release in `X-Custd-Sdk`.

mod admin_actions;
mod admin_apps;
mod admin_sites;
mod admin_users;
mod analytics_events;
mod analytics_reads;
mod api_path;
mod app;
mod app_account_entry;
mod app_alerts;
mod app_item_runs;
mod app_meetings;
mod app_messages;
mod app_models;
mod app_profile;
mod app_story;
mod audit_accounting;
mod auth_project_directories;
mod auth_project_domains;
mod auth_project_releases;
mod auth_projects;
mod browser_login;
mod campaign_email;
mod client;
mod data_labels;
mod data_scopes;
mod data_spaces;
mod device;
mod discovery;
mod error;
mod error_issues;
mod event_types;
mod ingest;
mod machine_access;
mod measurement;
mod measurement_predictions;
mod measurement_projects;
mod measurement_reads;
mod notifications;
mod oauth_clients;
mod offboarding;
mod parsers;
mod privacy;
mod producers;
mod public_routes;
mod reporting;
mod reporting_packs;
mod retention;
mod schema_registry;
mod site_ai_owner;
mod site_analytics;
mod site_collector;
mod site_domains;
mod site_findings;
mod site_insights_admin;
mod site_keywords;
mod site_monitor_reports;
mod site_monitors;
mod site_pages;
mod site_reports;
mod site_search;
mod site_status_page;
mod site_web_data;
mod storage_usage;
mod subject_exports;
mod support_access;
mod system_operations;
mod tenant_manifest;
mod tenant_storage;
mod tenants;
mod time_plans;
mod transport;
mod uncertainty_models;
mod uploads;
mod workflow_timings;

pub use app::{
    APP_ITEM_KIND_LINK_COLLECTION, APP_ITEM_KIND_MEASUREMENT_PROJECT, APP_ITEM_KIND_MEETING,
    APP_ITEM_KIND_PLAN, APP_ITEM_KIND_UNCERTAINTY_MODEL, AppClient, AppItem, AppItemCreate,
    AppItemCreated, AppItemLink, AppItemLinkRotated, AppItemList, AppItemRead, AppItemSummary,
    AppLink, AppLinkCollection, AppLinkCollectionEntry, AppMeasurementProjectCreate, AppPlan,
    AppPlanForecast, AppPlanPart, AppPlanPartUpdate, AppPlanProgressBand, AppPlanProgressPoint,
    AppPlanUpdate, AppReadOptions, Conditional,
};
pub use app_alerts::{
    APP_ALERT_DESTINATION_SLACK, APP_ALERT_DESTINATION_WEBHOOK, APP_ALERT_EMAIL_CHECK_UNAVAILABLE,
    APP_ALERT_LIMIT, APP_ALERT_NO_VERIFIED_EMAIL, APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW,
    APP_ALERT_RULE_ESTIMATE_STALE, APP_ALERT_RULE_FORECAST_MOVED_INSIDE_TARGET,
    APP_ALERT_RULE_TARGET_REACHED, AppAlertDelivery, AppAlertDeliveryList, AppAlertRule,
    AppAlertRuleSpec, AppAlertSettings, AppAlertSubscription, AppAlertWebhook,
    AppAlertWebhookCreated,
};
pub use app_meetings::{
    APP_ITEM_MEETING_STEP_REFUSED, AppMeeting, AppMeetingAction, AppMeetingBlock,
    AppMeetingBlockCreate, AppMeetingCreate, AppMeetingMinutes, AppMeetingMinutesUpdate,
    AppMeetingSummary, AppPlanMeetingSummary,
};
pub use app_messages::{
    APP_MESSAGES_MAX_BATCH_BYTES, APP_MESSAGES_MAX_BATCH_MESSAGES, AppMessageConnectorConnection,
    AppMessageConnectorEnrollment, AppMessageConnectorReport, AppMessageConnectorState,
    AppMessageConnectorStatus, AppMessageDirection, AppMessageImportResult, AppMessageImportStatus,
    AppMessageInput, AppMessageMedia, AppMessageMutation, AppMessageMutationKind,
    AppMessageMutationResult, AppMessageMutationStatus, AppMessageSource, AppMessagesBatchRequest,
    AppMessagesBatchResponse, AppMessagesMutationRequest, AppMessagesMutationResponse,
    AppMessagesSession,
};
pub use app_models::{
    AppModelHistogram, AppModelPercentiles, AppModelQuantityError, AppModelQuantityResult,
    AppModelQuantitySummary, AppModelRun, AppModelRunRequest, AppUncertaintyModel,
};
pub use app_story::{
    AppForecastStory, AppForecastStoryDelivery, AppForecastStoryEstimate,
    AppForecastStoryObservation, AppForecastStoryPercentiles, AppForecastStoryPresentation,
    AppForecastStoryProvenance, AppForecastStorySnapshot, AppForecastStoryTarget,
    AppForecastStoryTrust,
};
pub use browser_login::BrowserLogin;
pub use client::CustdClient;
pub use device::{
    DeviceInstructions, DeviceLogin, DeviceLoginError, DeviceRefreshError, DeviceToken,
    device_user_code_groups,
};
pub use discovery::{
    HOSTED_APP_DISCOVERY_PATH, HostedAppDiscovery, HostedAppSignIn, read_hosted_app_discovery,
};
pub use error::{ApiError, Error, Problem};
pub use measurement::{
    MeasurementForecastCounter, MeasurementForecastDetail, MeasurementForecastHistogram,
    MeasurementForecastHistogramBin, MeasurementForecastInterval, MeasurementForecastLine,
    MeasurementForecastPoint, MeasurementForecastRate, MeasurementForecastRun,
    MeasurementForecastRunRequest, MeasurementForecastWarning, MeasurementObservation,
    MeasurementObservationBulk, MeasurementObservationImport, MeasurementObservationResult,
    MeasurementProject, MeasurementProjectCreate, MeasurementProjectDelivery,
    MeasurementProjectList, MeasurementProjectRun, MeasurementSeries, MeasurementSeriesCreate,
    MeasurementTarget, MeasurementTargetCreate, ProjectComplete, ProjectEstimate,
    ProjectEstimateCreate, ProjectEstimateList, ProjectEstimateStatus,
};
pub use site_analytics::{
    SiteAIAnswerSample, SiteAIAnswerSampleProduct, SiteAIConsentAction, SiteAIConsentRequest,
    SiteAIMode, SiteAIPage, SiteAISettings, SiteAISettingsRequest, SiteAITenantUsage,
    SiteAIUsageRow, SiteAIVisibility, SiteAnalyticsConnection, SiteAnalyticsConnectionProvider,
    SiteAnalyticsConnectionRequest, SiteAnalyticsConnectionStatus, SiteAnalyticsReport,
    SiteAnalyticsRow, SiteAnalyticsUnavailable, SiteAnalyticsUnavailableReport, SiteTraffic,
    SiteTrafficClass, SiteTrafficCount, SiteTrafficCoverage, SiteTrafficCrawler,
    SiteTrafficCrawlerIdentity, SiteTrafficDay, SiteTrafficDayCoverage, SiteTrafficReferrer,
    SiteTrafficReferrerClass, SiteTrafficSlowPath, SiteTrafficTotals,
};
pub use site_domains::{
    SiteBrowserCollector, SiteBrowserCollectorRequest, SiteBrowserCollectorRequestMode,
    SiteCheckSettingsRequest, SiteChromeUX, SiteChromeUXObservation, SiteDomain,
    SiteDomainAttestation, SiteDomainAudit, SiteDomainChecks, SiteDomainChecksMode,
    SiteDomainCreateRequest, SiteDomainListResponse, SiteDomainListWithUptimePaths,
    SiteDomainOwnership, SiteDomainVerification, SiteDomainWithUptimePath, SiteFindingCounts,
    SiteHTTPExpectations, SiteHTTPJSONExpectation, SiteHTTPPathExpectations, SiteIncident,
    SiteNextAction, SiteNextActionSeverity, SiteNextActionTarget, SiteNextActions,
    SitePortfolioDomain, SitePortfolioSummary, SiteRegistrationExpiry, SiteSummary, SiteTLS,
    SiteUptime, SiteUptimeStatus, SiteWarming,
};
pub use site_findings::{
    SiteAuditDelta, SiteAuditDeltaRun, SiteAuditPage, SiteAuditPageIndexability, SiteAuditPageList,
    SiteFinding, SiteFindingDismissal, SiteFindingDismissalRequest,
    SiteFindingDismissalRequestScope, SiteFindingDismissals, SiteFindingHistory,
    SiteFindingListResponse, SiteFindingSuggestion, SiteFindingsState, SiteGeneratedFix,
    SiteGeneratedFixFormat, SiteRemedy, SiteRemedyKind,
};
pub use site_keywords::{
    SiteContentGap, SiteContentGapOwnCoverage, SiteGapCompetitor, SiteGapPage, SiteGapTopic,
    SiteKeywordCluster, SiteKeywordClusters, SiteKeywordDemand, SiteKeywordDemandSet,
    SiteKeywordDemandSetState, SiteKeywordList, SiteKeywordListRequest, SiteKeywordLists,
    SiteKeywordStriking, SiteMarketSample, SiteMarketSearchHit, SiteRankObservation,
    SiteRankObservationState, SiteRankings, SiteRankingsPool, SiteRankingsSource,
    SiteRelatedKeyword, SiteRelatedKeywords, SiteSearchPoolBand, SiteTrackedKeyword,
    SiteTrackedKeywordRequest, SiteTrackedKeywordStatus, SiteTrackedKeywordUpdate,
};
pub use site_monitors::{
    SiteAlertDestination, SiteAlertDestinationRequest, SiteDeliveryCache, SiteDeliveryTimings,
    SiteHeartbeatCreate, SiteHeartbeatCredential, SiteHeartbeatList, SiteHeartbeatMonitor,
    SiteHeartbeatMonitorStatus, SiteHeartbeatReceipt, SiteHeartbeatReport,
    SiteHeartbeatReportOutcome, SiteHeartbeatSchedule, SiteIncidentListResponse,
    SiteMaintenanceWindow, SiteMaintenanceWindowRequest, SiteMaintenanceWindows,
    SitePrivateUptimeCredential, SitePrivateUptimeMonitor, SitePrivateUptimeMonitorCreate,
    SitePrivateUptimeMonitorStatus, SitePrivateUptimeReport, SitePrivateUptimeReportFailure,
    SitePrivateUptimeWork, SiteProbe, SiteProbeDetail, SiteProbeKind, SiteProbeListResponse,
    SiteProbeProtocol, SiteProbeSpec, SiteProbeStatus, SiteProbesRequest, SiteResponseHour,
    SiteUptimeDay, SiteUptimeHistory, SiteUptimeWindow, SiteUptimeWindows,
};
pub use site_pages::{
    SiteHreflangLink, SiteLighthouseHistory, SiteLighthouseMetrics, SiteLighthousePageComparison,
    SiteLighthousePageComparisonProfile, SiteLighthousePages, SiteLighthousePagesRequest,
    SiteLighthouseRun, SiteLighthouseRunOutcome, SiteLighthouseScores, SiteLinkSource,
    SiteLinkSourceWhere, SiteObservedWording, SitePageCheckFinding, SitePageCheckRequest,
    SitePageCheckRequestScope, SitePageCheckResponse, SitePageFacts, SitePageHeading,
    SitePageOpenGraph, SitePageQuery, SitePageQueryWindow, SitePageReadability, SitePageRecheck,
    SitePageRecheckList, SitePageRecheckRequest, SitePageRecheckState, SitePageRobots,
    SitePageSearchQueries, SitePageSearchQueriesState, SitePageTwitter, SitePhraseUse,
    SiteRobotsRule, SiteRobotsRuleDirective, SiteRobotsTestRequest, SiteRobotsTestResponse,
    SiteRobotsTestResponseSource, SiteTitleOption, SiteTitleOptionTemplate, SiteWordingCompare,
    SiteWordingCompareRequest, SiteWordingObservation, SiteWordingObservationState,
};
pub use site_reports::{
    SavedSiteReport, SavedSiteReportListResponse, SavedSiteReportRequest, SavedSiteReportSummary,
    SiteCampaignLink, SiteCampaignLinkList, SiteCampaignLinkRequest, SiteInsightsExport,
    SiteInsightsExportWithUptimePath, SiteInsightsMonitoringExport, SiteInsightsReportsExport,
    SiteInsightsSearchExport, SiteInsightsSiteExport, SiteReport, SiteReportAudit,
    SiteReportCertificate, SiteReportFinding, SiteReportSearch, SiteReportShare,
    SiteReportShareCreated, SiteReportShareListResponse, SiteReportShareRequest, SiteReportSpeed,
    SiteReportTemplate, SiteReportUptime,
};
pub use site_search::{
    SiteFindingImpact, SiteFindingImpactSource, SiteFindingImpactSourceGranularity,
    SiteFindingImpactSourceStatus, SiteFindingImpactStatus, SiteIndexNowState,
    SiteIndexNowSubmission, SiteIndexNowSubmissionRequest, SiteIndexNowSubmissionStatus,
    SiteSearchAccount, SiteSearchConnection, SiteSearchConnectionRequest, SiteSearchDay,
    SiteSearchImpactPeriod, SiteSearchImpactWindow, SiteSearchInspection, SiteSearchInspectionList,
    SiteSearchInspectionRequest, SiteSearchInspectionStatus, SiteSearchMetricDay,
    SiteSearchMetricDayDimension, SiteSearchMetricExportPage, SiteSearchPerformance,
    SiteSearchPoolPositions, SiteSearchPoolQuery, SiteSearchPoolQueryDemandBand,
    SiteSearchPoolQueryPage, SiteSearchPoolSetting, SiteSearchPoolSettingRequest,
    SiteSearchProvider, SiteSearchRow, SiteSearchRowPage, SiteSearchRowsDimension,
    SiteSearchRowsQuery, SiteSearchSource, SiteSearchTotals, SiteSearchUnavailable,
    SiteSearchValue, SiteSearchValueGoalStatus, SiteSearchValuePage,
};
pub use site_status_page::{
    SiteStatusComponent, SiteStatusComponentStatus, SiteStatusDraft, SiteStatusPage,
    SiteStatusPublication, SiteStatusSelection, SiteStatusSettings, SiteStatusUpdate,
    SiteStatusUpdateHistory, SiteStatusUpdateRequest,
};
pub use site_web_data::{
    SiteDomainAuthority, SiteLinkSourceTotal, SiteLinkSourceTotalSource, SiteLinkSourceTotalStatus,
    SiteLostLinks, SiteLostLinksStatus, SiteLostReferringDomain, SiteMarket, SiteProjectContext,
    SiteProjectContextRequest, SiteReferringDomain, SiteReferringDomains, SiteRegionalTrendMarket,
    SiteRegionalTrendMatch, SiteRegionalTrends, SiteTechnicalTrends, SiteTopicTrend,
    SiteTopicTrendSource, SiteTopicTrendStatus, SiteTopicTrends, SiteTrendMonth, SiteWebDomain,
    SiteWebDomainRole, SiteWebDomainSitemapStatus, SiteWebDomainTrancoBand, SiteWebDomains,
    SiteWebPage, SiteWebPages, SiteWebPagesQuery,
};

pub use admin_actions::{
    ImpersonationSession, ImpersonationSessionCreateRequest, ImpersonationSessionListResponse,
    ImpersonationSessionState, NotificationDeliveryReplayRequest, PrivacyErasureForceResponse,
    RetentionRun, RetentionRunListResponse, RetentionRunPreview, RetentionStoreBreakdown,
    ScheduledTaskSummary,
};
pub use admin_apps::{
    AppCreateRequest, AppCreation, AppDeployCredential, AppDeployCredentialList,
    AppDeployCredentialSummary, AppListResponse, AppOverview, AppReason, AppReleaseSummary,
    AppReleaseSummaryState, AppSignInRequest, AppSignInRequestMode, AppSummary, AppSummaryStatus,
};
pub use admin_sites::{
    Site, SiteConfigResponse, SiteCreateRequest, SiteCreateResponse, SiteIdentityMode,
    SiteIngestTarget, SiteListResponse, SiteUpdateRequest, SiteWriteKeyResponse,
};
pub use admin_users::{
    AdminPasswordResetResponse, AdminUser, AdminUserCreateRequest, AdminUserDisableRequest,
    AdminUserEnableRequest, AdminUserGlobalUserState, AdminUserListResponse,
    AdminUserMembershipCreateRequest, AdminUserMembershipState, AdminUserQuery,
    AdminUserRemovalRequest, AdminUserRole, AdminUserRoleListResponse, AdminUserUpdateRequest,
    TenantRole,
};
pub use analytics_events::{
    AnalyticsEventsQueryRequest, AnalyticsEventsQueryRequestSource, AnalyticsEventsQueryResponse,
    AnalyticsLabelFilter, AnalyticsRangeBucket, AnalyticsRangeQueryRequest,
    AnalyticsRangeQueryResponse, AnalyticsSourceSummary, AnalyticsTimingSummary,
};
pub use analytics_reads::{
    AnalyticsActiveNow, AnalyticsDashboardCoverage, AnalyticsDashboardDogfood,
    AnalyticsDashboardDogfoodMetric, AnalyticsDashboardDogfoodSource, AnalyticsDashboardEvents,
    AnalyticsDashboardLoadedDay, AnalyticsDashboardSummary, AnalyticsDashboardTenant,
    AnalyticsTelemetryEventCount, MeasurementPredictionDefinitionRead,
    MeasurementPredictionDefinitionReadList, MeasurementPredictionEvaluationRead,
    MeasurementPredictionOutcomeRead, MeasurementPredictionOutcomeReadList,
    MeasurementPredictionRunRead, MeasurementPredictionRunReadList, MeasurementSimulationRun,
    MeasurementSimulationRunRequest, MeasurementSimulationVariable, MeasurementSimulationWarning,
    ReportingDraftPreviewRequest,
};
pub use app_account_entry::{AppAccountEntry, AppAccountEntryRequest};
pub use app_item_runs::{
    AppAlertUnsubscribeRequest, AppItemInput, AppItemInputDistribution, AppItemInputShape,
    AppItemInputSource, AppItemInputSourceField, AppItemInputSourceKind, AppItemMeasurement,
    AppItemMeasurementPage, AppItemProjectUpdateRequest, AppItemProjectUpdateRequestForecastMethod,
    AppItemQuantity, AppItemQuantityKind, AppItemRun, AppItemRunCreateRequest, AppItemRunPage,
    AppItemSettingsRequest, AppModelCalculateRequest, AppModelCalculateResult, AppModelCopyRequest,
    AppModelInputOverride, AppModelVersionRequest,
};
pub use app_profile::{
    ApplicationProfileFieldState, ApplicationProfileValue, ApplicationProfileValuesRequest,
    CurrentApplicationProfile,
};
pub use audit_accounting::{
    AccountingEvidence, AccountingEvidenceCreateRequest, AccountingEvidenceKind,
    AccountingEvidenceListResponse, AccountingEvidenceResponse, AccountingEvidenceUnit,
    AuditChange, AuditDomainHistory, AuditEvent, AuditEventOutcome, AuditEventQuery,
    AuditEventsFormat, AuditEventsScope, AuditListCursor, AuditListResponse,
    AuditNetworkDisclosure, AuditNetworkDisclosureIpAddressState, AuditRetentionDisclosure,
};
pub use auth_project_directories::{
    ApplicationIdentityTrait, ApplicationMembershipChoice, ApplicationMembershipContext,
    ApplicationMembershipRevocation, ApplicationMembershipRevokeRequest,
    ApplicationPrincipalErasure, ApplicationPrincipalErasureRequest, ApplicationPrincipalExport,
    ApplicationPrincipalIdentityExport, ApplicationPrincipalIdentityExportTraitsStatus,
    ApplicationPrincipalListItem, ApplicationPrincipalListResponse,
    ApplicationPrincipalMembershipView, ApplicationPrincipalMembershipViewRole,
    ApplicationPrincipalProfile, ApplicationPrincipalProfileValueView,
    ApplicationPrincipalSuspension, ApplicationProfileField, ApplicationSession,
    ApplicationSessionInventory, ApplicationSessionRevocation, ApplicationSessionRevokeRequest,
    ApplicationSessionsRevokeAllRequest, AuthDirectoryAction, AuthProjectAudienceGrant,
    AuthProjectAudienceGrantRequest, AuthProjectDirectoryCapacity, AuthProjectDirectoryRequest,
    AuthProjectDirectoryStatus, AuthProjectDirectoryView, AuthProjectDirectoryViewState,
    AuthProjectEnvironmentOrganisation, AuthProjectEnvironmentOrganisationList,
    AuthProjectInvitationIssueRequest, AuthProjectInvitationIssued,
    AuthProjectInvitationListResponse, AuthProjectInvitationRedeliveryRequest,
    AuthProjectInvitationRevocationRequest, AuthProjectInvitationView,
    AuthProjectPrincipalAudience, AuthProjectPrincipalAudiences,
};
pub use auth_project_domains::{
    AuthDomainBindRequest, AuthDomainBinding, AuthDomainBindingLifecycle, AuthDomainBindingStatus,
    AuthDomainDNSProof, AuthDomainImageOverrideSetRequest, AuthDomainImageOverrideStatus,
    AuthDomainImageSet, AuthDomainImages, AuthDomainImagesConvergence, AuthDomainImagesSource,
    AuthDomainMintRequest, AuthProjectBrandLogo,
};
pub use auth_project_releases::{
    AuthProjectAppCacheRule, AuthProjectAppCacheRuleMode, AuthProjectAppCreateReleaseRequest,
    AuthProjectAppHeaderRule, AuthProjectAppHeaderRuleFraming, AuthProjectAppPromotion,
    AuthProjectAppRelease, AuthProjectAppReleaseFile, AuthProjectAppReleaseList,
    AuthProjectAppReleaseManifest, AuthProjectAppResponseHeader, AuthProjectAppRoutingRules,
    AuthProjectAppSPAFallback, AuthProjectAppShareableRoute, AuthProjectAppSiteCard,
    AuthProjectAppUploadedFile,
};
pub use auth_projects::{
    AppItemEnvironmentLink, AppItemEnvironmentLinkKind, AppItemEnvironmentLinkList,
    AppItemEnvironmentLinkRole, AuthEnvironmentClientCleanup, AuthEnvironmentHostingRemoval,
    AuthEnvironmentHostingWithdrawal, AuthEnvironmentReleasedResources,
    AuthEnvironmentRetainedResources, AuthProjectAudienceBinding, AuthProjectBrandMode,
    AuthProjectBrandPalette, AuthProjectCapability, AuthProjectChange,
    AuthProjectClientRegistration, AuthProjectClientRegistrationAction,
    AuthProjectClientRegistrationStatus, AuthProjectClientSyncReport, AuthProjectClientSyncRequest,
    AuthProjectClientSyncStatus, AuthProjectCompanyBinding, AuthProjectCreateRequest,
    AuthProjectCreateRequestAudienceEntitlementMode, AuthProjectCreateRequestIdentityMode,
    AuthProjectCreation, AuthProjectDeletion, AuthProjectDeletionRequest, AuthProjectDesiredState,
    AuthProjectDesiredStateApplicationSessionPolicy, AuthProjectDesiredStateRegistrationPolicy,
    AuthProjectDesiredStateRequest, AuthProjectEnvironmentCreateRequest,
    AuthProjectEnvironmentDeletion, AuthProjectEnvironmentDeletionRequest,
    AuthProjectEnvironmentOffboardRequest, AuthProjectEnvironmentOffboarding,
    AuthProjectHostedSignIn, AuthProjectHosting, AuthProjectHostingIngestTarget,
    AuthProjectHostingRemoval, AuthProjectHostingStatus, AuthProjectListResponse,
    AuthProjectOperation, AuthProjectPreview, AuthProjectProfileField,
    AuthProjectProfileFieldEditableBy, AuthProjectReleasedResources, AuthProjectSocialCallbackURL,
    AuthProjectSocialProvider, AuthProjectSocialProviderMode, AuthProjectSocialProviderProvider,
    AuthProjectSocialProviderStatus, AuthProjectSocialProviderStatusState, AuthProjectSocialSignIn,
    AuthProjectSocialSignInStatus, AuthProjectStatus, AuthProjectSummary,
};
pub use campaign_email::{
    CampaignConfirmation, CampaignEmailRevision, CampaignEmailRevisionPublishRequest,
    CampaignPermission, CampaignRecipient, CampaignRenderRequest, CampaignRenderResult,
    CampaignRunRecipientStatus, CampaignRunScheduleRequest, CampaignRunStatus,
    CampaignTestSelection, CampaignWelcomeActivation, CampaignWelcomeDefinition,
    CampaignWelcomeEnrollment, CampaignWelcomePause, CampaignWelcomeSignup, CampaignWelcomeState,
};
pub use client::{ResponseMetadata, record_metadata};
pub use data_labels::{
    DataLabelAssignmentListResponse, DataLabelCatalogueAssignment, DataLabelCatalogueDataset,
    DataLabelCataloguePack, DataLabelCatalogueResponse, DataLabelDefinition,
    DataLabelDefinitionCreateRequest, DataLabelDefinitionListResponse,
    DataLabelDefinitionUpdateRequest, DataLabelPropagationPolicy, DataLabelSensitivity,
    DataLabelUsage, DataLabelUsageListResponse, DataLabelValue, DataLabelValueCreateRequest,
    DataLabelValueUpdateRequest, DescriptiveLabel, DescriptiveLabelCatalogue,
    EventTypeDataLabelDefault, EventTypeDataLabelDefaultRequest, SchemaFieldDataLabelAssignment,
    SchemaFieldDataLabelAssignmentRequest,
};
pub use data_scopes::{
    DataScope, DataScopeCreateRequest, DataScopeGrant, DataScopeGrantAction,
    DataScopeGrantListResponse, DataScopeGrantRequest, DataScopeGrantTarget,
    DataScopeGrantTargetKind, DataScopeGrantsKind, DataScopeListResponse, DataScopePrincipalRef,
    DataScopeResource, DataScopeResourceCreateRequest, DataScopeResourceListResponse,
    DataScopeResourceUpdateRequest, DataScopeUpdateRequest, DataScopeUpdateRequestStatus,
};
pub use data_spaces::{
    DataSpace, DataSpaceCreateRequest, DataSpaceEntitlementState, DataSpaceErasure,
    DataSpaceErasureStatus, DataSpaceListResponse, DataSpaceSigningState, DataSpaceSigningStatus,
    DataSpaceSiteAdoption, DataSpaceSiteAdoptionStatus, DataSpaceStorageMeasurementState,
    DataSpaceUsageRow, DataSpaceUsageSummary, ProducerReservation, ProducerReservationClaimRequest,
    ProducerReservationCreateRequest, ProducerReservationListResponse, ProducerReservationStatus,
    SigningProducerState, SigningProducerStatus, SigningRefusalCounts,
};
pub use error_issues::{
    ErrorIssue, ErrorIssueDetail, ErrorIssueDetailWithCompanyName, ErrorIssueEvent,
    ErrorIssueException, ErrorIssueFrame, ErrorIssueListResponse, ErrorIssueState,
    ErrorIssueStateRequest, ErrorIssuesSort, ErrorIssuesState,
};
pub use event_types::{
    EventCategoryConfig, EventCategoryConfigListResponse, EventCategoryConfigUpdateRequest,
    EventRollupDimension, EventTypeConfig, EventTypeConfigListResponse,
    EventTypeConfigUpdateRequest, RollupDimensionProfile, SchemaActionDryRunRequest,
    SchemaActionDryRunResult, SchemaActionEnableRequest, SchemaActionRegisterRequest,
    SchemaActionValidateRequest, SchemaActionValidateResult, SchemaAuditResponse,
    SchemaAuditResult, SchemaAuditSummary, SchemaCompileResult, SchemaExampleValidationSummary,
    SchemaIssue,
};
pub use ingest::{
    CleanupApproval, CleanupJetStreamSelection, CleanupJob, CleanupJobCreateRequest,
    CleanupJobItem, CleanupJobList, CleanupJobProof, CleanupObjectProgress, CleanupPlan,
    CleanupPlanCreateRequest, CleanupPlanItem, CleanupPlanList, CleanupPlanScope, CurrentAccount,
    DeviceContext, EventContext, EventEnvelope, EventIngestReceipt, EventIngestResult,
    IngestBufferState, IngestCleanupResult, IngestDatabasePoolState, IngestDatabaseState,
    IngestDiagnosticsIngestState, IngestDiagnosticsSection, IngestDiagnosticsSnapshot,
    IngestIntegrityResult, IngestJetStreamCluster, IngestJetStreamConsumerState,
    IngestJetStreamState, IngestJetStreamStreamState, IngestMonitoringAlert,
    IngestMonitoringAlertList, IngestMonitoringSummary, IngestObjectStorageState,
    IngestPipelineStage, IngestReportingState, IngestReprocessOutcome, IngestReprocessResult,
    IngestRollupSchedulerState, IngestSegmentState, IngestSilentDropState, IngestStageProgress,
    IngestStatusCounts, IngestTableSize, IngestTopStatement, IngestWaitEvent, IngestWorkerState,
    ManagedAuditRedactionEvent, ManagedAuditRedactionRequest, ManagedAuditRedactionResponse,
    ManagedAuditRedactionResult, PageContext, RawIngestRequest, RawIngestResult, RawSourceTarget,
    SendEventsRequest, SendEventsResponse, SystemMonitoringSummary, SystemMonitoringTenant,
    SystemMonitoringTotals,
};
pub use machine_access::{
    MACHINE_ACCESS_ALLOWED, MACHINE_ACCESS_AREA_DESTRUCTIVE_JOBS,
    MACHINE_ACCESS_AREA_INGEST_SCHEMAS, MACHINE_ACCESS_AREA_PRIVACY_ERASURE,
    MACHINE_ACCESS_AREA_PROVISIONING_CREDENTIALS, MACHINE_ACCESS_AREA_REPORTING,
    MACHINE_ACCESS_AREA_SITES, MACHINE_ACCESS_AREA_USAGE_BILLING, MACHINE_ACCESS_AREA_USERS_ACCESS,
    MACHINE_ACCESS_BLOCKED, MACHINE_ACCESS_BLOCKED_CODE, MACHINE_ACCESS_DECIDED_BY_COMPANY,
    MACHINE_ACCESS_DECIDED_BY_MACHINE, MACHINE_ACCESS_DECIDED_BY_SUPPORT_AUTOMATION,
    MACHINE_ACCESS_INHERIT, MACHINE_ACCESS_UNAVAILABLE_CODE, MachineAccessAreaSetting,
    MachineAccessBlock, MachineAccessCompanyPolicy, MachineAccessCompanyUpdateRequest,
    MachineAccessEffective, MachineAccessEffectiveArea, MachineAccessMachinePolicy,
    MachineAccessMachineUpdateRequest,
};
pub use measurement_predictions::{
    DurationForecastDefinition, DurationForecastDefinitionMethod, DurationForecastEvaluation,
    DurationForecastEvaluationArtifact, DurationForecastEvaluationFold,
    DurationForecastEvaluationMetric, DurationForecastEvaluationMetrics, DurationForecastInterval,
    DurationForecastIntervalEvaluation, MeasurementDurationEvaluationOutcomeCounts,
    MeasurementDurationEvaluationRequest, MeasurementDurationEvaluationResponse,
    MeasurementDurationEvaluationVersion, MeasurementDurationEvaluationVersionEvidence,
    MeasurementDurationEvaluationVersionHistory, MeasurementDurationEvaluationVersionHistoryEntry,
    MeasurementPredictionActivateRequest, MeasurementPredictionDefinition,
    MeasurementPredictionDefinitionCreateRequest, MeasurementPredictionDefinitionListResponse,
    MeasurementPredictionDefinitionProjectKind, MeasurementPredictionDefinitionUpdateRequest,
    MeasurementPredictionEvaluationSummary, MeasurementPredictionOutcomeListResponse,
    MeasurementPredictionOutcomeSummary, MeasurementPredictionPauseRequest,
    MeasurementPredictionRunListResponse, MeasurementPredictionRunNowRequest,
    MeasurementPredictionRunSummary, MeasurementPredictionThresholdEvent,
    MeasurementPredictionThresholdEventListResponse, MeasurementPredictionVersion,
    MeasurementPredictionVersionPublishRequest, MeasurementSignalSource,
    MeasurementSignalSourceCreateRequest, MeasurementSignalSourceListResponse,
};
pub use measurement_projects::{
    MeasurementCalibrationExerciseCreateRequest, MeasurementCalibrationExerciseResponse,
    MeasurementDecisionChoiceRequest, MeasurementDecisionChoiceResponse,
    MeasurementDecisionDistributionParameters, MeasurementDecisionExpression,
    MeasurementDecisionModelCreateRequest, MeasurementDecisionModelListResponse,
    MeasurementDecisionModelResponse, MeasurementDecisionModelUpdateRequest,
    MeasurementDecisionVariableRequest, MeasurementDecisionVariableResponse,
    MeasurementImportRunResponse, MeasurementSeriesCreateRequest, MeasurementSeriesResponse,
    MeasurementTargetCreateRequest, MeasurementTargetResponse,
};
pub use measurement_reads::{
    MeasurementCompiledPresentation, MeasurementForecastStoryDelivery,
    MeasurementForecastStoryEstimate, MeasurementForecastStoryObservation,
    MeasurementForecastStoryPercentiles, MeasurementForecastStoryProvenance,
    MeasurementForecastStoryResponse, MeasurementForecastStorySnapshot,
    MeasurementForecastStoryTarget, MeasurementForecastStoryTrust, MeasurementOverviewArea,
    MeasurementOverviewPoint, MeasurementOverviewResponse, MeasurementOverviewTenant,
    MeasurementPredictionCalibrationBucket, MeasurementPredictionContribution,
    MeasurementPredictionSourceHealth, MeasurementPredictionStory,
    MeasurementPredictionStoryEvaluation, MeasurementPredictionStoryOutcome,
    MeasurementPredictionStoryPoint, PresentationLayer, PresentationLayerRole,
    PresentationLayerYKind, PresentationPoint, PresentationReference, PresentationSupportingTable,
    PresentationSupportingTableRow, PresentationTableColumn, PresentationTableRow,
};
pub use notifications::{
    EmailRelay, EmailRelayEffectiveSender, EmailRelayTestSendRequest, EmailRelayTestSendResult,
    EmailRelayView, EmailRelayWriteRequest, NotificationDeliveryStatus,
    NotificationDestinationEventSlug, NotificationWebhookCreateRequest,
    NotificationWebhookEnabledRequest, NotificationWebhookListResponse, NotificationWebhookSecret,
    NotificationWebhookSubscription, NotificationWebhookSubscriptionKind, TenantDestination,
    TenantDestinationChannel, TenantDestinationEventSlug, TenantDestinationRequest,
};
pub use oauth_clients::{
    OAuthClient, OAuthClientAdmission, OAuthClientAdmissionApproveRequest,
    OAuthClientAdmissionGrant, OAuthClientAdmissionListResponse, OAuthClientAdmissionMetadata,
    OAuthClientAdmissionMutationResponse, OAuthClientAdmissionReviewRequest,
    OAuthClientAdmissionReviewResponse, OAuthClientAdmissionRevokeRequest,
    OAuthClientCreateRequest, OAuthClientCreateResponse, OAuthClientListResponse,
    OAuthClientLoginSetup, OAuthClientSecretResponse, OAuthClientUpdateScopesRequest,
};
pub use offboarding::{
    OffboardingCancelRequest, OffboardingExecuteRequest, OffboardingExportResponse,
    OffboardingPreviewResponse, OffboardingRequestBody, OffboardingRequestCancellation,
    OffboardingRequestResponse, OffboardingSchedule, OffboardingScheduleListResponse,
    OffboardingScheduleRequest, TenantOffboardingExclusion, TenantOffboardingPreviewItem,
};
pub use parsers::{
    ParserDefinition, ParserDeleteResponse, ParserFraming, ParserFramingOutcome, ParserFramingType,
    ParserGeneratedFieldConfig, ParserListResponse, ParserPreset, ParserPresetListResponse,
    ParserPreviewDefinition, ParserPreviewRequest, ParserPreviewResponse, ParserPreviewRow,
    ParserSaveRequest, ParserType,
};
pub use privacy::{
    PrivacyConsentListResponse, PrivacyConsentRecord, PrivacyConsentRecordPurpose,
    PrivacyConsentRecordRequest, PrivacyErasureCreateRequest, PrivacyErasureListResponse,
    PrivacyErasureResponse, PrivacyErasureSelector, PrivacyIdentifierListResponse,
    PrivacyIdentifierMapRequest, PrivacyIdentifierMapping, PrivacyRule, PrivacyRulesReplaceRequest,
    PrivacyRulesResponse,
};
pub use producers::{
    ProducerEnvironmentUpdateRequest, ProducerProvisionListResponse, ProducerProvisionPublicClient,
    ProducerProvisionRequest, ProducerProvisionResponse, ProducerSecretRotationResponse,
    ProducerSigningKeysResponse, ProducerSigningKeysUpdateRequest,
};
pub use public_routes::{
    AppAlertUnsubscribePage, AuthDomainMonitoringInventory, SiteStatusSubscriptionRequest,
    SiteStatusSubscriptionToken, confirm_status_page_subscription, get_app_alert_unsubscribe_page,
    get_site_config, read_app_host_discovery, read_auth_domain_monitoring_inventory,
    read_public_status_page, read_shared_site_report, subscribe_to_status_page,
    unsubscribe_app_alert_email, unsubscribe_from_status_page,
};
pub use reporting::{
    CompletedRunExportAdjustmentSection, CompletedRunExportAnnotationsActionsSection,
    CompletedRunExportBlockSection, CompletedRunExportIdentity, CompletedRunExportIntegrity,
    CompletedRunExportMetadata, CompletedRunExportPredictionComparisonSection,
    CompletedRunExportRedaction, CompletedRunExportRedactionResult, CompletedRunExportRequest,
    CompletedRunExportSections, CompletedRunExportSource, DashboardCatalogueEntry,
    DashboardCatalogueEntryExportFormats, DashboardCatalogueEntryInteractions,
    DashboardCatalogueResponse, DashboardCatalogueTrust, DashboardDefinition,
    DashboardGenerationRequest, DashboardGenerationResponse, DashboardGenerationResponseState,
    DashboardInteractionRule, DashboardInteractionRuleResetBehavior, DashboardSharePolicy,
    DashboardSharePolicyRelativeRanges, ExecutiveReportDefinition,
    ExecutiveReportDefinitionComparisonBasis, ExecutiveReportDefinitionRecipe,
    PreparedDataOutputListResponse, PreparedDataOutputStatus, PreparedDataOutputStatusAvailability,
    PreparedDataOutputStatusProcessingState, PreparedDataQueryEnvelope, PreparedDataReceiptStatus,
    PresentationPresetSelection, PresentationPresetSelectionNonColorEncoding,
    PresentationPresetSelectionPresetId, PresentationPresetSelectionSummaryTemplateId,
    RenderedAnomaly, RenderedCalibrationBucket, RenderedCohortCell, RenderedDistributionBin,
    RenderedDriver, RenderedInterval, RenderedLifecycleStage, RenderedMetricValue,
    RenderedMetricValueDataSufficiency, RenderedMetricValueUnit, RenderedQuantile,
    RenderedVisualResult, RenderedVisualResultKind, RenderedWidgetBucket, RenderedWidgetData,
    ReportExportArtifact, ReportExportCancelRequest, ReportExportCreateRequest, ReportExportJob,
    ReportExportJobList, ReportExportProgressCounter, ReportExportQueryParameters,
    ReportingDatasetRowCount, ReportingEmailDeliveryRecipient,
    ReportingEmailDeliveryRecipientOutcome, ReportingEmailDeliveryRecipients,
    ReportingNarrativeBlock, ReportingNarrativeValueReference,
    ReportingNarrativeValueReferenceValue, ReportingNextActionHint, ReportingNextActionHintAction,
    ReportingProvenance, ReportingQueryMetadata, ReportingQueryRequest,
    ReportingQueryRequestComparison, ReportingReconciliationResult,
    ReportingReconciliationResultAvailability, ReportingReconciliationResultStatus,
    ReportingReconciliationResultUnit, ReportingReportSectionDefinition,
    ReportingReportSectionDefinitionLayout, ReportingRequestedFilter,
    ReportingRequestedFilterOperator, ReportingSnapshotColumn, ReportingSnapshotColumnType,
    ReportingSnapshotDatasetSchema, ReportingSnapshotLabelMetadata, ReportingSnapshotLabelValue,
    ReportingSourceContribution, ReportingSourceDivergence, ReportingSourceRange,
    ReportingSourceSummary, ReportingSubjectInsightRequest, ReportingSubjectInsightResponse,
    ReportingTemporalTrust, ReportingTrust, ReportingTrustDataFreshness,
    ReportingTrustRetryability, ReportingTrustStatus, ReportingWarning, ReportingWidgetDefinition,
    ReportingWidgetDefinitionKind,
};
pub use reporting_packs::{
    ExecutiveComparisonResult, ExecutiveConfidence, ExecutivePeriod, ExecutivePrimaryResult,
    ExecutiveReport, ReportingPack, ReportingPackAccountingContract, ReportingPackActivationRule,
    ReportingPackActivationRuleIdentity, ReportingPackActivityRule, ReportingPackAllocationRule,
    ReportingPackAllocationTarget, ReportingPackAssetHierarchy, ReportingPackAssetHierarchyEdge,
    ReportingPackAssetHierarchyEdgeMode, ReportingPackAssetNode, ReportingPackAuditEvent,
    ReportingPackAuditListResponse, ReportingPackDimension, ReportingPackDraft,
    ReportingPackDraftCreateRequest, ReportingPackDraftListResponse,
    ReportingPackDraftUpdateRequest, ReportingPackFilterDefinition, ReportingPackFlowRule,
    ReportingPackGeneration, ReportingPackGenerationAcknowledgementStatus,
    ReportingPackGenerationStatus, ReportingPackGenerationStatusGeneration,
    ReportingPackGenerationValidity, ReportingPackGenerationValidityListResponse,
    ReportingPackIdentitySelectors, ReportingPackLogObservabilityBindings,
    ReportingPackMatchPredicate, ReportingPackMaterializationProvenance, ReportingPackMetric,
    ReportingPackMetricCalculation, ReportingPackMetricFlowResult, ReportingPackMetricKind,
    ReportingPackMetricMeasurementKind, ReportingPackMetricResetPolicy,
    ReportingPackNumericSelector, ReportingPackObservationAsset, ReportingPackObservationContract,
    ReportingPackObservationSource, ReportingPackPreviewRequest, ReportingPackPreviewResponse,
    ReportingPackProofProfile, ReportingPackRateTier, ReportingPackRedactionRule,
    ReportingPackRetentionRule, ReportingPackRollupDimension, ReportingPackRollupProvenance,
    ReportingPackRollupRule, ReportingPackRoundingPolicy, ReportingPackRoundingPolicyMode,
    ReportingPackSelectorDefinition, ReportingPackSelectorDefinitionType,
    ReportingPackSemanticSeries, ReportingPackSetupBindingField, ReportingPackSetupTemplate,
    ReportingPackSetupTemplateBindRequest, ReportingPackSetupTemplateBindResponse,
    ReportingPackSetupTemplateListResponse, ReportingPackSourceReconciliation,
    ReportingPackSourceReconciliationMode, ReportingPackSourceSeries,
    ReportingPackSteppedRateSchedule, ReportingPackSteppedRateScheduleBillingBoundary,
    ReportingPackSubjectScopeRule, ReportingPackTemplate, ReportingPackTemplateAggregation,
    ReportingPackTemplateSourceModes, ReportingPackTransitionRule, ReportingPackTrustDiagnostics,
    ReportingPackValidateRequest, ReportingPackValidationResponse,
};
pub use retention::{
    RetentionPoliciesEnvelope, RetentionPolicy, RetentionPolicyListResponse,
    RetentionPolicyRetentionClass, RetentionPolicyScope, RetentionPolicyUpsertRequest,
};
pub use schema_registry::{
    EventSchemaCheckRequest, EventSchemaCheckResult, EventSchemaConflict, EventSchemaDocument,
    EventSchemaExampleResult, EventSchemaInferRequest, EventSchemaInferResult, EventSchemaIssue,
    EventSchemaRegisterRequest, EventSchemaStateResult, EventSchemaVersion, EventSchemaVersionList,
    EventType, EventTypeList,
};
pub use site_ai_owner::{
    SiteAIOwnerHandoffRequest, SiteAIOwnerHandoffResponse, SiteAIOwnerSession, SiteAIOwnerSettings,
    redeem_site_ai_owner_handoff,
};
pub use site_collector::{ErrorCaptureEvent, ErrorCaptureFrame, ErrorCaptureMode, SiteCollector};
pub use site_insights_admin::{
    AccessLogHourReplay, AccessLogHourReplayPreviousStatus, AccessLogHourReplayRequest,
    SiteAIPlatformUsage, SiteAIPlatformUsagePeriod, SiteInsightsBacklog, SiteInsightsTaskList,
    SiteInsightsTaskStatus,
};
pub use site_monitor_reports::{
    SiteMonitorDestination, get_private_uptime_work, submit_private_uptime, submit_site_heartbeat,
};
pub use storage_usage::{
    StorageAlertDelivery, StorageAlertEvaluation, StorageAlertEvent, StorageAlertEventListResponse,
    StorageAlertMeasurement, StorageAlertRule, StorageAlertRuleChannel,
    StorageAlertRuleCreateRequest, StorageAlertRuleListResponse, StorageUsageBreakdown,
    StorageUsageSummary, TenantStorageUsage, UsageResponse, UsageRow, UsageTotal,
};
pub use subject_exports::{
    SubjectExportArtifactResponse, SubjectExportCreateRequest, SubjectExportListResponse,
    SubjectExportResponse, SubjectExportResponseScope, SubjectExportResponseState,
    SubjectExportScope, SubjectExportStoreProgress,
};
pub use support_access::{
    SupportAccessGrant, SupportAccessGrantCreateRequest, SupportAccessGrantListResponse,
};
pub use system_operations::{
    BootstrapStatus, BootstrapStatusRetryability, BootstrapStatusState, ClientBootstrapProof,
    ClientBootstrapProofKind, ClientBootstrapSubmitRequest, DesiredStateDiagnostics,
    EnvironmentPolicy, EnvironmentPolicyReason, EnvironmentPolicyUpdateRequest, FailedJob,
    IngestClaim, IngestClaimListResponse, IngestClaimTerminalRequest, JobRetryReceipt,
    JobStatusResponse, OperationalBacklogSummary, OperationalStageSummary, OperationalSummary,
    OutboxStatus, QueueCount, RLSExecuteRequest, RLSExecuteResponse, RLSExecuteResponseOutcome,
    RLSPlan, RLSPlanRequest, RLSPolicyDiff, RLSPolicySpec, RLSProofResponse, RLSStatus,
    RLSTableDiff, SDKUsageItem, SDKUsageListResponse, SDKVersionDeprecation,
    SDKVersionDeprecationRequest, ScheduledTaskListItem, ScheduledTaskListRunSummary,
    ScheduledTaskListViewResponse, ScheduledTaskRunRequest, ScheduledTaskRunResponse,
    ScheduledTaskRunResponseSummary, SystemRealmCapacity, SystemStageProgress, SystemStageSignals,
    SystemStageStatus, SystemStageStatusStatus, SystemStatusKPIs, SystemStatusResponse,
    SystemStorageStatus, SystemTenantHotspot,
};
pub use tenant_manifest::{
    EventTypeConfigDesired, OAuthClientDesired, PrivacyDesired, ReportingPackDesired,
    RetentionDesired, SchemaDesired, TenantManifest, TenantManifestApplyResponse,
    TenantManifestOperationPendingStatus, TenantManifestOperationRetryFailure,
    TenantManifestOperationStatus, TenantManifestOperationStatusState, TenantManifestReadiness,
    TenantManifestResourceStatus,
};
pub use tenant_storage::{
    TenantStorageLocationCreateBody, TenantStorageLocationListResponse, TenantStorageLocationView,
};
pub use tenants::{
    DataSpaceEntitlementUpdateRequest, StorageLimit, StorageLimitUpdateRequest, Tenant,
    TenantCreateRequest, TenantListResponse, TenantOffboardingReceipt,
    TenantOffboardingReceiptFinalState, TenantPurpose, TenantReceiptPerStore, TenantReceiptWaiver,
};
pub use time_plans::{
    CompletedDurationReport, CompletedDurationReportAdjustmentInput,
    CompletedDurationReportAllocation, CompletedDurationReportAllocationChange,
    CompletedDurationReportAnnotationInput, CompletedDurationReportBlockInput,
    CompletedDurationReportBlockInputOutcome, CompletedDurationReportBlockInputStatus,
    CompletedDurationReportCalculationReceipt, CompletedDurationReportPredictionComparison,
    CompletedDurationReportProvenance, CompletedDurationReportSummary,
    CompletedDurationReportSummaryRunStatus, TimePlan, TimePlanAllocation,
    TimePlanAllocationChange, TimePlanAllocationResult, TimePlanAnnotation,
    TimePlanAnnotationInput, TimePlanAnnotationListResponse, TimePlanAnnotationRedactBody,
    TimePlanAnnotationSchema, TimePlanAnnotationSchemaAllowedTypes, TimePlanAnnotationSchemaFields,
    TimePlanCalculationReceipt, TimePlanCalculationReceiptReason, TimePlanCommandRequest,
    TimePlanCommandRequestType, TimePlanCommandResult, TimePlanCorrectedCommand,
    TimePlanCreateRunInput, TimePlanCreatedRun, TimePlanDefinition, TimePlanDefinitionBlock,
    TimePlanDefinitionBlockBasis, TimePlanDefinitionMathAdjustmentResult,
    TimePlanDefinitionMathAllocationResult, TimePlanDefinitionMathDefinitionResult,
    TimePlanDefinitionMathProofResponse, TimePlanDefinitionMathProofSummary, TimePlanDraftInput,
    TimePlanDurationObservationIdentity, TimePlanDurationObservationReadResponse,
    TimePlanListResponse, TimePlanOperationalStatus, TimePlanOutboxReplayRequest,
    TimePlanOutboxReplayResponse, TimePlanPredictionSnapshot, TimePlanPredictionSnapshotList,
    TimePlanProjectionLossResponse, TimePlanPublishedVersion, TimePlanPublishedVersionDetails,
    TimePlanReviseBody, TimePlanRevisionBody, TimePlanRunBlockView, TimePlanRunRepairResponse,
    TimePlanRunView, TimePlanRunViewStartPolicy, TimePlanThresholdCue,
    TimePlanThresholdCueSeverity, TimePlanTransitionHistoryResponse, TimePlanTransitionView,
};
pub use uncertainty_models::{
    UncertaintyModel, UncertaintyModelBoundInput, UncertaintyModelBoundInputState,
    UncertaintyModelCreateRequest, UncertaintyModelDecision, UncertaintyModelDetail,
    UncertaintyModelInformation, UncertaintyModelInformationRecommended,
    UncertaintyModelInputInformation, UncertaintyModelInputSensitivity, UncertaintyModelList,
    UncertaintyModelQueuedRunFailure, UncertaintyModelRunDetail, UncertaintyModelRunList,
    UncertaintyModelRunRequest, UncertaintyModelRunSummary, UncertaintyModelRunSummaryTrigger,
    UncertaintyModelScatterPoint, UncertaintyModelSensitivity, UncertaintyModelSource,
    UncertaintyModelVersion, UncertaintyModelVersionCreateRequest, UncertaintyModelVersionList,
    UncertaintyModelVersionSummary,
};
pub use uploads::{AuditEventExport, ImageFile, OffboardingDownload, ReportExportDownload};
pub use workflow_timings::{
    WorkflowTimingAttemptProjection, WorkflowTimingContributionEntry, WorkflowTimingDeclaration,
    WorkflowTimingDefinition, WorkflowTimingDefinitionList,
    WorkflowTimingDefinitionReconcileResult, WorkflowTimingDefinitionStatus,
    WorkflowTimingDimensionDefinition, WorkflowTimingDurationHistoryEntry,
    WorkflowTimingDurationHistoryResponse, WorkflowTimingDurationProjection,
    WorkflowTimingEvaluationResponse, WorkflowTimingEvaluationResponseState,
    WorkflowTimingExcludedStepOutcome, WorkflowTimingExcludedStepOutcomeOutcome,
    WorkflowTimingExpectation, WorkflowTimingFactPayload, WorkflowTimingFactPayloadKind,
    WorkflowTimingFactProvenance, WorkflowTimingObservation, WorkflowTimingObservationBatchRequest,
    WorkflowTimingObservationBatchResult, WorkflowTimingObservationRequest,
    WorkflowTimingObservationResult, WorkflowTimingOutcomeCounts, WorkflowTimingRebuildResult,
    WorkflowTimingRevision, WorkflowTimingRunDurationFact, WorkflowTimingRunFact,
    WorkflowTimingRunFactState, WorkflowTimingRunListResponse, WorkflowTimingRunPrediction,
    WorkflowTimingRunProjection, WorkflowTimingRunProjectionStatus, WorkflowTimingRunReadResponse,
    WorkflowTimingRunSummary, WorkflowTimingRunTimingSummary, WorkflowTimingStepDeclaration,
    WorkflowTimingStepDefinition, WorkflowTimingStepDurationFact, WorkflowTimingStepFact,
    WorkflowTimingStepFactState,
};
/// This SDK's released version, taken from `Cargo.toml` (which `scripts/bump-version.sh` moves).
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// The `X-Custd-Sdk` value every request carries.
pub const SDK_IDENTITY: &str = concat!("rust/", env!("CARGO_PKG_VERSION"));

/// The result of a request, or the error that stopped it.
pub type Result<T> = std::result::Result<T, Error>;
