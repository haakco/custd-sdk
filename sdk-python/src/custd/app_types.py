"""Typed bodies of the hosted-app item routes under ``/api/v1/app/``.

Generated once from Custd's OpenAPI components and kept by hand since; the field names are the
wire names. Enum-like strings are open sets owned by Custd: compare them with the constants in
:mod:`custd.app_items`. The SDK decodes a JSON null list as an empty list.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict


class AppItemRead(TypedDict):
    counterProgress: NotRequired[AppItemCounterProgress]
    estimates: NotRequired[ProjectEstimateListResponse]
    item: AppItem
    linkCollection: NotRequired[AppLinkCollection]
    links: NotRequired[list[AppItemLink]]
    measurementProject: NotRequired[MeasurementProject]
    measurementRuns: NotRequired[AppItemRunPage]
    meeting: NotRequired[AppMeeting]
    meetingMinutes: NotRequired[AppMeetingMinutes]
    modelPreview: NotRequired[AppModelPreview]
    plan: NotRequired[AppPlan]
    planMeetingSummaries: NotRequired[list[AppPlanMeetingSummary]]
    uncertaintyModel: NotRequired[AppModelDetail]


class AppItemCreateRequest(TypedDict):
    idleExpirySeconds: NotRequired[int]
    kind: str
    measurementProject: NotRequired[AppMeasurementProjectCreate]
    meeting: NotRequired[AppMeetingCreate]
    name: NotRequired[str]
    uncertaintyModel: NotRequired[AppModelCreate]


class AppItemCreated(TypedDict):
    item: AppItemRead
    ownerToken: str
    shareToken: str


class AppItemList(TypedDict):
    items: list[AppItemSummary]


class AppItemSettingsRequest(TypedDict):
    idleExpirySeconds: NotRequired[int]
    name: NotRequired[str]
    project: NotRequired[ProjectUpdateRequest]


class AppItemMeasurementPage(TypedDict):
    nextCursor: NotRequired[str]
    rows: list[AppItemMeasurement]
    runUuid: str


class AppItemRunPage(TypedDict):
    nextCursor: NotRequired[str]
    runs: list[AppItemRun]


class AppPlanForecast(TypedDict):
    asOf: str
    completedParts: int
    deadlineProbability: NotRequired[float]
    horizon: str
    horizonMissFraction: NotRequired[float]
    lower: NotRequired[str]
    median: NotRequired[str]
    missingParts: list[str]
    model: str
    observedProgress: list[AppPlanProgressPoint]
    previousMedian: NotRequired[str]
    projectedProgress: list[AppPlanProgressBand]
    requiredParts: int
    revision: int
    upper: NotRequired[str]


class AppPlanUpdate(TypedDict):
    deadline: NotRequired[str]
    expectedRevision: int
    parts: list[AppPlanPartUpdate]


class AppLinkCollectionEntryAddRequest(TypedDict):
    token: str


class AppLinkCollectionEntry(TypedDict):
    createdAt: str
    entryUuid: str
    itemUuid: str
    kind: str
    position: int
    shareToken: NotRequired[str]


class AppItemLinkRotated(TypedDict):
    link: AppItemLink
    token: str


class ProjectCompleteRequest(TypedDict):
    completedAt: str


class ProjectEstimateCreateRequest(TypedDict):
    estimatedAt: NotRequired[str]
    highDate: str
    lowDate: str
    note: NotRequired[str]


class ProjectEstimate(TypedDict):
    estimateUuid: str
    estimatedAt: str
    highDate: str
    lowDate: str
    note: str


class ProjectRunCreateRequest(TypedDict):
    name: NotRequired[str]
    projectCode: str
    targetDate: NotRequired[str]


class MeasurementObservationBulkRequest(TypedDict):
    rows: list[MeasurementObservationRow]


class MeasurementObservationBulkResponse(TypedDict):
    accepted: int
    completedTargetUuid: NotRequired[str]
    importId: str
    rejected: int
    results: list[MeasurementObservationResult]


class MeasurementObservationCSVImportRequest(TypedDict):
    csv: str


class AppItemAlertSettings(TypedDict):
    deliveryAvailable: bool
    rules: list[AppItemAlertRule]
    subscription: NotRequired[AppItemAlertSubscription]
    webhooks: list[AppItemAlertWebhook]


class AppItemAlertDeliveryList(TypedDict):
    deliveries: list[AppItemAlertDelivery]


class AppItemAlertRuleCreateRequest(TypedDict):
    modelOutput: NotRequired[str]
    staleDays: NotRequired[int]
    threshold: NotRequired[float]
    type: str


class AppItemAlertRule(TypedDict):
    conditionMet: bool
    createdAt: str
    crossings: int
    modelOutput: NotRequired[str]
    ruleUuid: str
    staleDays: NotRequired[int]
    threshold: NotRequired[float]
    type: str


class AppItemAlertSlackCreateRequest(TypedDict):
    webhookUrl: str


class AppItemAlertWebhook(TypedDict):
    createdAt: str
    endpoint: str
    kind: str
    webhookUuid: str


class AppItemAlertWebhookCreateRequest(TypedDict):
    endpoint: str


class AppItemAlertWebhookCreated(TypedDict):
    signingSecret: str
    webhook: AppItemAlertWebhook


class AppItemAlertSubscription(TypedDict):
    createdAt: str
    subscriptionUuid: str


class AppAlertUnsubscribeRequest(TypedDict):
    token: str


class AppMeetingMinutesUpdate(TypedDict):
    actions: list[AppMeetingAction]
    decisions: str
    expectedRevision: int
    minutes: str
    planLinkToken: NotRequired[str]
    planUuid: NotRequired[str]
    sharedSummary: NotRequired[str]


class AppMeetingAdvanceRequest(TypedDict):
    blockUuid: str


class AppModelCopyRequest(TypedDict):
    name: NotRequired[str]
    versionNumber: NotRequired[int]


class AppModelVersionRequest(TypedDict):
    counterLinks: NotRequired[list[str]]
    note: NotRequired[str]
    quantities: list[AppModelQuantity]


class AppItemCounterProgress(TypedDict):
    current: NotRequired[float]
    forecastP50: NotRequired[str]
    percent: NotRequired[int]


class ProjectEstimateListResponse(TypedDict):
    deliveryTargetDate: NotRequired[str]
    estimates: list[ProjectEstimate]
    latest: NotRequired[ProjectEstimateStatus]


class AppItem(TypedDict):
    expiresAt: str
    idleExpirySeconds: int
    itemUuid: str
    kind: str
    ownership: str
    role: str
    updatedAt: str
    version: int


class AppLinkCollection(TypedDict):
    entries: list[AppLinkCollectionEntry]
    name: NotRequired[str]


class AppItemLink(TypedDict):
    createdAt: str
    linkUuid: str
    role: str
    shareToken: NotRequired[str]


class MeasurementProject(TypedDict):
    createdAt: str
    delivery: MeasurementProjectDelivery
    description: str
    kind: str
    name: str
    projectCode: str
    projectUuid: str
    run: MeasurementProjectRun
    series: NotRequired[list[MeasurementSeriesResponse]]
    status: str
    target: NotRequired[MeasurementTargetResponse]
    updatedAt: str


class AppMeeting(TypedDict):
    blocks: list[AppMeetingBlock]
    currentBlockUuid: NotRequired[str]
    endsAt: NotRequired[str]
    name: str
    startedAt: NotRequired[str]
    status: str
    summary: AppMeetingSummary


class AppMeetingMinutes(TypedDict):
    actions: list[AppMeetingAction]
    decisions: str
    minutes: str
    planUuid: NotRequired[str]
    sharedSummary: NotRequired[str]


class AppModelPreview(TypedDict):
    p5: float
    p50: float
    p95: float
    quantity: str


class AppPlan(TypedDict):
    deadline: NotRequired[str]
    name: str
    parts: list[AppPlanPart]
    revision: int


class AppPlanMeetingSummary(TypedDict):
    meetingUuid: str
    name: str
    summary: str


class AppModelDetail(TypedDict):
    createdAt: str
    description: str
    latestVersion: int
    modelUuid: str
    name: str
    queuedRunFailure: NotRequired[AppModelQueuedRunFailure]
    updatedAt: str
    version: NotRequired[AppModelVersion]


class AppMeasurementProjectCreate(TypedDict):
    description: NotRequired[str]
    kind: str
    name: str
    series: list[MeasurementSeriesCreateRequest]
    target: MeasurementTargetCreateRequest


class AppMeetingCreate(TypedDict):
    blocks: list[AppMeetingBlockCreate]
    name: str


class AppModelCreate(TypedDict):
    description: NotRequired[str]
    name: str
    note: NotRequired[str]
    quantities: NotRequired[list[AppModelQuantity]]


class AppItemSummary(TypedDict):
    expiresAt: str
    idleExpirySeconds: int
    itemUuid: str
    kind: str
    name: str
    ownership: str
    role: str
    seriesCode: NotRequired[str]
    status: str
    updatedAt: str
    version: int


class ProjectUpdateRequest(TypedDict):
    definitionOfDone: NotRequired[str]
    deliveryTargetDate: NotRequired[str]
    description: NotRequired[str]
    forecastMethod: NotRequired[str]
    name: NotRequired[str]
    runSimilar: NotRequired[bool]
    status: NotRequired[str]


class AppItemMeasurement(TypedDict):
    observationUuid: str
    observedAt: str
    seriesUuid: str
    value: float


class AppItemRun(TypedDict):
    createdAt: str
    name: str
    runUuid: str
    status: str


class AppPlanProgressPoint(TypedDict):
    at: str
    completed: int


class AppPlanProgressBand(TypedDict):
    at: str
    lower: int
    median: int
    upper: int


class AppPlanPartUpdate(TypedDict):
    itemUuid: str
    linkToken: NotRequired[str]
    prerequisites: list[str]
    required: bool


class MeasurementObservationRow(TypedDict):
    idempotencyKey: NotRequired[str]
    observationUuid: NotRequired[str]
    observedAt: str
    seriesUuid: str
    value: float


class MeasurementObservationResult(TypedDict):
    detail: NotRequired[str]
    observationUuid: NotRequired[str]
    rowIndex: int
    status: NotRequired[int]
    success: bool
    title: NotRequired[str]
    type: NotRequired[str]


class AppItemAlertDelivery(TypedDict):
    attempts: int
    channel: str
    createdAt: str
    crossing: int
    deliveryUuid: str
    lastErrorClass: NotRequired[str]
    lastStatusCode: NotRequired[int]
    outcome: str
    ruleType: str
    ruleUuid: str
    updatedAt: str
    webhookUuid: NotRequired[str]


class AppMeetingAction(TypedDict):
    description: str
    partUuid: NotRequired[str]


class AppModelQuantity(TypedDict):
    description: NotRequired[str]
    formula: NotRequired[str]
    input: NotRequired[AppModelInput]
    kind: str
    name: str
    unit: NotRequired[str]


class ProjectEstimateStatus(TypedDict):
    ageDays: float
    chanceByDeliveryTarget: NotRequired[float]
    estimate: ProjectEstimate
    movementDays: NotRequired[float]


class MeasurementProjectDelivery(TypedDict):
    completedAt: NotRequired[str]
    definitionOfDone: str
    targetDate: NotRequired[str]


class MeasurementProjectRun(TypedDict):
    forecastMethod: NotRequired[str]
    seriesRootUuid: NotRequired[str]
    similar: bool


class MeasurementSeriesResponse(TypedDict):
    completionDirection: str
    name: str
    seriesCode: str
    seriesUuid: str
    source: str
    unitLabel: NotRequired[str]
    unitSlug: str


class MeasurementTargetResponse(TypedDict):
    completedAt: NotRequired[str]
    name: str
    state: str
    targetCode: str
    targetDate: NotRequired[str]
    targetUuid: str
    targetValue: float


class AppMeetingBlock(TypedDict):
    actualMs: int
    allocatedMs: int
    blockUuid: str
    endedAt: NotRequired[str]
    position: int
    predictedMs: int
    startedAt: NotRequired[str]
    status: str
    title: str


class AppMeetingSummary(TypedDict):
    finishedActualMs: int
    finishedBlocks: int
    finishedPredictedMs: int
    overrunMs: int
    predictedMs: int


class AppPlanPart(TypedDict):
    itemUuid: str
    prerequisites: list[str]
    required: bool


class AppModelQueuedRunFailure(TypedDict):
    attempts: int
    error: str
    failedAt: str


class AppModelVersion(TypedDict):
    createdAt: str
    note: str
    quantities: list[AppModelQuantity]
    versionNumber: int
    versionUuid: str


class MeasurementSeriesCreateRequest(TypedDict):
    completionDirection: str
    name: str
    seriesCode: str
    source: str
    unitLabel: NotRequired[str]
    unitSlug: str


class MeasurementTargetCreateRequest(TypedDict):
    name: str
    state: str
    targetCode: str
    targetDate: NotRequired[str]
    targetValue: float


class AppMeetingBlockCreate(TypedDict):
    predictedMs: int
    title: str


class AppModelInput(TypedDict):
    distribution: NotRequired[str]
    high: NotRequired[float]
    low: NotRequired[float]
    samples: NotRequired[list[float]]
    shape: str
    source: NotRequired[AppModelInputSource]
    successes: NotRequired[int]
    trials: NotRequired[int]
    value: NotRequired[float]


class AppModelInputSource(TypedDict):
    field: str
    kind: str
    projectUuid: str


class MeasurementForecastRunResponse(TypedDict):
    counter: NotRequired[MeasurementForecastCounterResult]
    forecastFrom: NotRequired[str]
    forecastRunUuid: str
    generatedAt: str
    inputCount: int
    method: str
    percentiles: dict[str, str]
    projectUuid: str
    provenance: dict[str, str]
    sampleCount: int
    seed: int
    status: str
    warnings: NotRequired[list[MeasurementForecastWarning]]


class MeasurementForecastStoryResponse(TypedDict):
    currentSnapshotUuid: NotRequired[str]
    delivery: MeasurementForecastStoryDelivery
    observations: list[MeasurementForecastStoryObservation]
    prediction: NotRequired[MeasurementPredictionStory]
    presentation: AppModelCompiledPresentation
    projectKind: str
    projectName: str
    projectUuid: str
    provenance: MeasurementForecastStoryProvenance
    snapshots: list[MeasurementForecastStorySnapshot]
    state: str
    target: MeasurementForecastStoryTarget
    truncated: bool
    trust: MeasurementForecastStoryTrust


class AppModelRun(TypedDict):
    boundInputs: list[AppModelBoundInput]
    createdAt: str
    decision: NotRequired[AppModelDecision]
    information: NotRequired[AppModelInformation]
    modelUuid: str
    quantities: list[AppModelQuantityResult]
    queuedRunFailure: NotRequired[AppModelQueuedRunFailure]
    runUuid: str
    sampleCount: int
    seed: int
    sensitivity: NotRequired[AppModelSensitivity]
    sensitivityOutput: NotRequired[str]
    sourceForecastRunUuid: NotRequired[str]
    trigger: str
    versionNumber: int


class MeasurementForecastRunRequest(TypedDict):
    forecastFrom: NotRequired[str]
    method: NotRequired[str]
    sampleCount: NotRequired[int]
    seed: NotRequired[int]


class AppModelCalculateRequest(TypedDict):
    inputs: NotRequired[list[AppModelInputOverride]]
    outputs: list[str]
    sampleCount: NotRequired[int]
    seed: NotRequired[int]
    versionNumber: NotRequired[int]


class AppModelCalculateResult(TypedDict):
    modelUuid: str
    quantities: list[AppModelQuantityResult]
    sampleCount: int
    seed: int
    versionNumber: int


class AppModelRunRequest(TypedDict):
    decision: NotRequired[AppModelDecision]
    sampleCount: NotRequired[int]
    seed: int
    sensitivityOutput: NotRequired[str]
    versionNumber: NotRequired[int]


class MeasurementForecastCounterResult(TypedDict):
    completionInterval: NotRequired[MeasurementForecastInterval]
    deadlineProbability: NotRequired[float]
    detail: MeasurementForecastDetail
    pooledRunCount: int
    rate: NotRequired[MeasurementForecastRate]


class MeasurementForecastWarning(TypedDict):
    code: str
    message: str
    severity: str


class MeasurementForecastStoryDelivery(TypedDict):
    estimates: list[MeasurementForecastStoryEstimate]
    targetDate: NotRequired[str]


class MeasurementForecastStoryObservation(TypedDict):
    observedAt: str
    value: float


class MeasurementPredictionStory(TypedDict):
    contributions: list[MeasurementPredictionContribution]
    current: NotRequired[MeasurementPredictionStoryPoint]
    definitionKey: str
    definitionUuid: str
    displayName: str
    evaluation: NotRequired[MeasurementPredictionStoryEvaluation]
    history: list[MeasurementPredictionStoryPoint]
    outcomes: list[MeasurementPredictionStoryOutcome]
    qualityState: str
    sources: list[MeasurementPredictionSourceHealth]
    state: str


class AppModelCompiledPresentation(TypedDict):
    caption: str
    height: int
    layers: list[AppModelPresentationLayer]
    nonColorEncoding: str
    presetId: str
    references: list[AppModelPresentationReference]
    renderer: str
    summary: str
    supportingTables: NotRequired[list[AppModelPresentationSupportingTable]]
    tableColumns: list[AppModelPresentationTableColumn]
    tableRows: list[AppModelPresentationTableRow]
    version: int
    width: int


class MeasurementForecastStoryProvenance(TypedDict):
    generatedAt: str
    latestEngine: NotRequired[str]
    latestInputHash: NotRequired[str]
    owner: str


class MeasurementForecastStorySnapshot(TypedDict):
    asOfAt: str
    generatedAt: str
    horizonEndAt: NotRequired[str]
    inputCount: int
    inputHash: NotRequired[str]
    intervalState: str
    method: str
    movement: str
    observedValue: NotRequired[float]
    outputProbability: NotRequired[float]
    percentiles: MeasurementForecastStoryPercentiles
    runUuid: str
    sampleCount: int
    status: str
    warnings: NotRequired[list[MeasurementForecastWarning]]


class MeasurementForecastStoryTarget(TypedDict):
    available: bool
    deadline: NotRequired[str]
    label: str
    value: float


class MeasurementForecastStoryTrust(TypedDict):
    evidence: str
    observationCount: int
    snapshotCount: int
    state: str


class AppModelBoundInput(TypedDict):
    detail: NotRequired[str]
    forecastGeneratedAt: NotRequired[str]
    forecastRunUuid: NotRequired[str]
    quantity: str
    source: AppModelInputSource
    state: str
    value: NotRequired[float]


class AppModelDecision(TypedDict):
    minimumWorthwhile: NotRequired[float]
    output: str
    threshold: float
    valuePerUnit: float


class AppModelInformation(TypedDict):
    actProbability: float
    expectedValueOfPerfectInformation: float
    inputs: list[AppModelInputInformation]
    recommended: str
    suggestedNextMeasurement: NotRequired[str]


class AppModelQuantityResult(TypedDict):
    error: NotRequired[AppModelQuantityError]
    name: str
    summary: NotRequired[AppModelQuantitySummary]


class AppModelSensitivity(TypedDict):
    inputs: list[AppModelInputSensitivity]
    output: str


class AppModelInputOverride(TypedDict):
    input: AppModelInput
    name: str


class MeasurementForecastInterval(TypedDict):
    confidence: float
    lower: str
    upper: str


class MeasurementForecastDetail(TypedDict):
    arrivalHistogram: MeasurementForecastHistogram
    posteriorLines: list[MeasurementForecastLine]


class MeasurementForecastRate(TypedDict):
    perDay: float
    perHour: float
    perMinute: float
    perSecond: float


class MeasurementForecastStoryEstimate(TypedDict):
    estimatedAt: str
    high: str
    low: str
    movementDays: NotRequired[float]
    note: NotRequired[str]
    widthDays: float


class MeasurementPredictionContribution(TypedDict):
    delta: float
    featureKey: str
    featureValue: NotRequired[float]
    movement: str
    value: float


class MeasurementPredictionStoryPoint(TypedDict):
    asOfAt: str
    horizonEndAt: NotRequired[str]
    inputHash: NotRequired[str]
    probability: float
    runUuid: str


class MeasurementPredictionStoryEvaluation(TypedDict):
    brierScore: NotRequired[float]
    calibration: list[MeasurementPredictionCalibrationBucket]
    logLoss: NotRequired[float]
    negativeCount: int
    positiveCount: int
    resolvedRunCount: int
    windowEndAt: str
    windowStartAt: str


class MeasurementPredictionStoryOutcome(TypedDict):
    isLateEvidence: bool
    observedValue: int
    outcomeKind: NotRequired[str]
    resolution: str
    resolvedAt: NotRequired[str]
    runUuid: str


class MeasurementPredictionSourceHealth(TypedDict):
    consecutiveFailures: int
    displayName: str
    lastAttemptAt: NotRequired[str]
    lastSucceededAt: NotRequired[str]
    nextEligibleAt: NotRequired[str]
    sourceKey: str
    status: str


class AppModelPresentationLayer(TypedDict):
    label: str
    points: list[AppModelPresentationPoint]
    role: str
    yKind: str


class AppModelPresentationReference(TypedDict):
    date: NotRequired[str]
    label: str
    role: str
    value: NotRequired[float]


class AppModelPresentationSupportingTable(TypedDict):
    columns: list[AppModelPresentationTableColumn]
    key: str
    label: str
    rows: list[AppModelPresentationSupportingTableRow]


class AppModelPresentationTableColumn(TypedDict):
    key: str
    label: str


class AppModelPresentationTableRow(TypedDict):
    cells: list[str]
    snapshotUuid: str


class MeasurementForecastStoryPercentiles(TypedDict):
    p10: NotRequired[str]
    p25: NotRequired[str]
    p50: NotRequired[str]
    p75: NotRequired[str]
    p90: NotRequired[str]


class AppModelInputInformation(TypedDict):
    expectedValueOfPerfectInformation: float
    name: str


class AppModelQuantityError(TypedDict):
    code: str
    detail: str


class AppModelQuantitySummary(TypedDict):
    histogram: AppModelHistogram
    mean: float
    percentiles: AppModelPercentiles
    stdDev: float


class AppModelInputSensitivity(TypedDict):
    name: str
    rankCorrelation: float
    scatter: NotRequired[list[AppModelScatterPoint]]
    share: float


class MeasurementForecastHistogram(TypedDict):
    bins: list[MeasurementForecastHistogramBin]
    neverCount: int


class MeasurementForecastLine(TypedDict):
    points: list[MeasurementForecastPoint]


class MeasurementPredictionCalibrationBucket(TypedDict):
    lower: float
    observedRate: NotRequired[float]
    positiveCount: int
    predicted: float
    sampleCount: int
    upper: float


class AppModelPresentationPoint(TypedDict):
    date: NotRequired[str]
    lowerDate: NotRequired[str]
    lowerValue: NotRequired[float]
    selected: NotRequired[bool]
    snapshotUuid: NotRequired[str]
    upperDate: NotRequired[str]
    upperValue: NotRequired[float]
    value: NotRequired[float]
    x: str


class AppModelPresentationSupportingTableRow(TypedDict):
    cells: list[str]
    key: str


class AppModelHistogram(TypedDict):
    counts: list[int]
    max: float
    min: float


class AppModelPercentiles(TypedDict):
    p25: float
    p5: float
    p50: float
    p75: float
    p95: float


class AppModelScatterPoint(TypedDict):
    input: float
    output: float


class MeasurementForecastHistogramBin(TypedDict):
    count: int
    end: str
    start: str


class MeasurementForecastPoint(TypedDict):
    at: str
    value: float
