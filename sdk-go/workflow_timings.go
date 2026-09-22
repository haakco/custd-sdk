package custd

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// WorkflowTimingAdminClient records work another system performed.
//
// Custd is not the controller here: the caller keeps ownership of its own
// lifecycle and reports the facts it observed after its own commit. Nothing in
// this client executes, schedules, retries or cancels the caller's work, and
// every append is idempotent through the caller's deterministic key.
type WorkflowTimingAdminClient struct {
	admin *AdminClient
}

// WorkflowTimingStepDeclaration is one declared step of a workflow shape.
type WorkflowTimingStepDeclaration struct {
	StepKey   string `json:"stepKey"`
	Name      string `json:"name"`
	NominalMS int64  `json:"nominalMs"`
}

// WorkflowTimingDeclaration is the declarative workflow shape declared once.
// Repeating an identical declaration is a no-op; a change to the shape creates a
// new forward-only revision.
type WorkflowTimingDeclaration struct {
	WorkflowKey           string                          `json:"workflowKey"`
	Name                  string                          `json:"name"`
	Description           string                          `json:"description,omitempty"`
	AllowOverlap          bool                            `json:"allowOverlap,omitempty"`
	Dimensions            []string                        `json:"dimensions,omitempty"`
	Steps                 []WorkflowTimingStepDeclaration `json:"steps"`
	Retired               bool                            `json:"retired,omitempty"`
	PredictionVersionUUID string                          `json:"predictionVersionUuid,omitempty"`
}

// WorkflowTimingRunFact carries the run-level fields of a run observation.
type WorkflowTimingRunFact struct {
	State string `json:"state"`
}

// WorkflowTimingStepFact carries the step-attempt fields of an observation.
type WorkflowTimingStepFact struct {
	StepKey    string `json:"stepKey"`
	Attempt    int    `json:"attempt"`
	State      string `json:"state"`
	ErrorClass string `json:"errorClass,omitempty"`
}

// WorkflowTimingFact is the observed fact body.
type WorkflowTimingFact struct {
	Kind       string                  `json:"kind"`
	OccurredAt string                  `json:"occurredAt"`
	Dimensions map[string]string       `json:"dimensions,omitempty"`
	Run        *WorkflowTimingRunFact  `json:"run,omitempty"`
	Step       *WorkflowTimingStepFact `json:"step,omitempty"`
}

// WorkflowTimingProvenance records which collector supplied a fact.
type WorkflowTimingProvenance struct {
	ActorKind string `json:"actorKind,omitempty"`
	Collector string `json:"collector,omitempty"`
}

// WorkflowTimingObservation is one observed fact with its idempotency identity.
type WorkflowTimingObservation struct {
	WorkflowKey      string                    `json:"workflowKey"`
	ExternalRunID    string                    `json:"externalRunId"`
	IdempotencyKey   string                    `json:"idempotencyKey"`
	SupersedesFactID string                    `json:"supersedesFactUuid,omitempty"`
	Provenance       *WorkflowTimingProvenance `json:"provenance,omitempty"`
	Fact             WorkflowTimingFact        `json:"fact"`
}

// WorkflowTimingObservationResult is the per-item outcome of an append. A
// transport-level success is not a successful append: read Accepted.
type WorkflowTimingObservationResult struct {
	Index          int    `json:"index"`
	Accepted       bool   `json:"accepted"`
	Duplicate      bool   `json:"duplicate"`
	IdempotencyKey string `json:"idempotencyKey"`
	RunUUID        string `json:"runUuid,omitempty"`
	FactUUID       string `json:"factUuid,omitempty"`
	ErrorCode      string `json:"errorCode,omitempty"`
	ErrorMessage   string `json:"errorMessage,omitempty"`
}

// WorkflowTimingBatchResult is the outcome of one append.
type WorkflowTimingBatchResult struct {
	Results    []WorkflowTimingObservationResult `json:"results"`
	Accepted   int                               `json:"accepted"`
	Rejected   int                               `json:"rejected"`
	Duplicates int                               `json:"duplicates"`
}

// RequireAccepted returns an error naming every rejected item. Callers should use
// this rather than inspecting counts, because a 200 response with a rejected item
// is not a durable append.
func (result *WorkflowTimingBatchResult) RequireAccepted() error {
	if result.Rejected == 0 {
		return nil
	}
	reasons := make([]string, 0, len(result.Results))
	for _, item := range result.Results {
		if !item.Accepted {
			reasons = append(reasons, fmt.Sprintf(
				"item %d (%s): %s", item.Index, item.IdempotencyKey, item.ErrorCode,
			))
		}
	}
	return fmt.Errorf(
		"custd: %d of %d observations were rejected: %s",
		result.Rejected, len(result.Results), strings.Join(reasons, "; "),
	)
}

// WorkflowTimingRevision is an immutable compiled workflow shape.
type WorkflowTimingRevision struct {
	UUID         string `json:"uuid"`
	Number       int64  `json:"number"`
	Hash         string `json:"hash"`
	AllowOverlap bool   `json:"allowOverlap"`
	Steps        []struct {
		StepKey   string `json:"stepKey"`
		Name      string `json:"name"`
		Sequence  int    `json:"sequence"`
		NominalMS int64  `json:"nominalMs"`
	} `json:"steps"`
}

// WorkflowTimingDefinition is one tenant-scoped workflow shape.
type WorkflowTimingDefinition struct {
	UUID          string                 `json:"uuid"`
	WorkflowKey   string                 `json:"workflowKey"`
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	Status        string                 `json:"status"`
	Current       WorkflowTimingRevision `json:"currentRevision"`
	RevisionCount int64                  `json:"revisionCount"`
}

// WorkflowTimingReconcileResult reports what one reconcile changed.
type WorkflowTimingReconcileResult struct {
	Definition      WorkflowTimingDefinition `json:"definition"`
	Created         bool                     `json:"created"`
	RevisionChanged bool                     `json:"revisionChanged"`
}

// WorkflowTimingObservationBatch is the bounded batch append body.
type WorkflowTimingObservationBatch struct {
	Observations []WorkflowTimingObservation `json:"observations"`
}

// WorkflowTimingExpectation is one evidence-backed duration expectation. The
// point and range are nil when the engine did not produce them, which is what
// keeps a cold start from looking like a supported forecast.
type WorkflowTimingExpectation struct {
	SeriesKey             string   `json:"seriesKey"`
	StepKey               string   `json:"stepKey,omitempty"`
	State                 string   `json:"state"`
	BaselineMS            int64    `json:"baselineMs"`
	ExpectedMS            *int64   `json:"expectedMs,omitempty"`
	ConservativeLowMS     *int64   `json:"conservativeLowMs,omitempty"`
	ConservativeHighMS    *int64   `json:"conservativeHighMs,omitempty"`
	SampleCount           int      `json:"sampleCount"`
	Method                string   `json:"method"`
	MethodVersion         string   `json:"methodVersion"`
	PredictionVersionUUID string   `json:"predictionVersionUuid,omitempty"`
	InputHash             string   `json:"inputHash"`
	Warnings              []string `json:"warnings"`
}

// WorkflowTimingPrediction is one observed run's completion expectation.
type WorkflowTimingPrediction struct {
	RunUUID       string                      `json:"runUuid"`
	WorkflowKey   string                      `json:"workflowKey"`
	ExternalRunID string                      `json:"externalRunId"`
	State         string                      `json:"state"`
	AllowOverlap  bool                        `json:"allowOverlap"`
	Run           WorkflowTimingExpectation   `json:"run"`
	Steps         []WorkflowTimingExpectation `json:"steps"`
}

// WorkflowTimingProjectionStatus is the visible projection state of one run.
type WorkflowTimingProjectionStatus struct {
	State             string `json:"state"`
	ProjectedLedgerID int64  `json:"projectedLedgerId"`
	LatestLedgerID    int64  `json:"latestLedgerId"`
	PendingFacts      int64  `json:"pendingFacts"`
	FoldError         string `json:"foldError,omitempty"`
	Healthy           bool   `json:"healthy"`
	NextAction        string `json:"nextAction"`
}

// WorkflowTimingRun is one observed run with its projection status.
type WorkflowTimingRun struct {
	RunUUID          string                         `json:"runUuid"`
	WorkflowKey      string                         `json:"workflowKey"`
	ExternalRunID    string                         `json:"externalRunId"`
	State            string                         `json:"state"`
	Dimensions       map[string]string              `json:"dimensions"`
	ProjectionStatus WorkflowTimingProjectionStatus `json:"projectionStatus"`
}

// WorkflowTimingDefinitionList is the bounded definition list envelope.
type WorkflowTimingDefinitionList struct {
	Items []WorkflowTimingDefinition `json:"items"`
}

// WorkflowTimingIdempotency builds the deterministic identity of one observed
// fact. Deriving the key from the fact itself means a redelivery after an outage
// is a no-op rather than a second duration fact.
type WorkflowTimingIdempotency struct{}

// RunStarted is the identity of one run's start fact.
func (WorkflowTimingIdempotency) RunStarted(workflowKey, externalRunID string) string {
	return workflowTimingKey(workflowKey, externalRunID, "run_started")
}

// RunFinished is the identity of one run's finish fact.
func (WorkflowTimingIdempotency) RunFinished(workflowKey, externalRunID string) string {
	return workflowTimingKey(workflowKey, externalRunID, "run_finished")
}

// StepStarted is the identity of one step attempt's start fact.
func (WorkflowTimingIdempotency) StepStarted(workflowKey, externalRunID, stepKey string, attempt int) string {
	return workflowTimingStepKey(workflowKey, externalRunID, "step_started", stepKey, attempt)
}

// StepFinished is the identity of one step attempt's finish fact.
func (WorkflowTimingIdempotency) StepFinished(workflowKey, externalRunID, stepKey string, attempt int) string {
	return workflowTimingStepKey(workflowKey, externalRunID, "step_finished", stepKey, attempt)
}

func workflowTimingKey(workflowKey, externalRunID, kind string) string {
	return strings.Join([]string{"workflow-timing", workflowKey, externalRunID, kind}, ":")
}

func workflowTimingStepKey(workflowKey, externalRunID, kind, stepKey string, attempt int) string {
	return strings.Join([]string{
		"workflow-timing", workflowKey, externalRunID, kind, stepKey, strconv.Itoa(attempt),
	}, ":")
}

// Reconcile declaratively applies one workflow shape.
func (c *WorkflowTimingAdminClient) Reconcile(
	ctx context.Context, companySlug string, declaration WorkflowTimingDeclaration,
) (*WorkflowTimingReconcileResult, error) {
	var out WorkflowTimingReconcileResult
	err := c.admin.request(ctx, http.MethodPut, workflowTimingPath(
		companySlug, "/definitions/"+url.PathEscape(declaration.WorkflowKey), 0,
	), declaration, &out)
	return &out, err
}

// ListDefinitions lists the tenant's workflow shapes.
func (c *WorkflowTimingAdminClient) ListDefinitions(
	ctx context.Context, companySlug string, limit int,
) (*WorkflowTimingDefinitionList, error) {
	var out WorkflowTimingDefinitionList
	err := c.admin.request(ctx, http.MethodGet, workflowTimingPath(companySlug, "/definitions", limit), nil, &out)
	return &out, err
}

// GetDefinition reads one workflow shape.
func (c *WorkflowTimingAdminClient) GetDefinition(
	ctx context.Context, companySlug, workflowKey string,
) (*WorkflowTimingDefinition, error) {
	var out WorkflowTimingDefinition
	err := c.admin.request(ctx, http.MethodGet, workflowTimingResourcePath(
		companySlug, "/definitions/"+url.PathEscape(workflowKey),
	), nil, &out)
	return &out, err
}

// Append records one observed fact. Use the returned RequireAccepted result
// rather than the transport status.
func (c *WorkflowTimingAdminClient) Append(
	ctx context.Context, companySlug string, observation WorkflowTimingObservation,
) (*WorkflowTimingBatchResult, error) {
	var out WorkflowTimingBatchResult
	err := c.admin.request(ctx, http.MethodPost, workflowTimingPath(companySlug, "/observations", 0),
		struct {
			Observation WorkflowTimingObservation `json:"observation"`
		}{Observation: observation}, &out)
	return &out, err
}

// AppendBatch records a bounded batch. The server returns one result per input,
// so a partially applied batch is visible rather than mistaken for success.
func (c *WorkflowTimingAdminClient) AppendBatch(
	ctx context.Context, companySlug string, observations []WorkflowTimingObservation,
) (*WorkflowTimingBatchResult, error) {
	if len(observations) == 0 {
		return nil, errors.New("custd: at least one workflow timing observation is required")
	}
	var out WorkflowTimingBatchResult
	err := c.admin.request(ctx, http.MethodPost, workflowTimingPath(companySlug, "/observations:batch", 0),
		WorkflowTimingObservationBatch{Observations: observations}, &out)
	return &out, err
}

// Correct appends a superseding fact for an accepted observation.
func (c *WorkflowTimingAdminClient) Correct(
	ctx context.Context, companySlug string, observation WorkflowTimingObservation,
) (*WorkflowTimingBatchResult, error) {
	if strings.TrimSpace(observation.SupersedesFactID) == "" {
		return nil, errors.New("custd: a correction requires the superseded fact UUID")
	}
	var out WorkflowTimingBatchResult
	err := c.admin.request(ctx, http.MethodPost, workflowTimingPath(companySlug, "/corrections", 0),
		struct {
			Observation WorkflowTimingObservation `json:"observation"`
		}{Observation: observation}, &out)
	return &out, err
}

// GetRun reads one observed run and its projection status.
func (c *WorkflowTimingAdminClient) GetRun(
	ctx context.Context, companySlug, runUUID string,
) (*WorkflowTimingRun, error) {
	var out WorkflowTimingRun
	err := c.admin.request(ctx, http.MethodGet, workflowTimingPath(
		companySlug, "/runs/"+url.PathEscape(runUUID), 0,
	), nil, &out)
	return &out, err
}

// Prediction reads the evidence-backed completion expectation for one run.
func (c *WorkflowTimingAdminClient) Prediction(
	ctx context.Context, companySlug, runUUID string,
) (*WorkflowTimingPrediction, error) {
	var out WorkflowTimingPrediction
	err := c.admin.request(ctx, http.MethodGet, workflowTimingPath(
		companySlug, "/runs/"+url.PathEscape(runUUID)+"/prediction", 0,
	), nil, &out)
	return &out, err
}

// Rebuild deterministically rebuilds one run's projections from its ledger.
func (c *WorkflowTimingAdminClient) Rebuild(ctx context.Context, companySlug, runUUID string) error {
	return c.admin.request(ctx, http.MethodPost, workflowTimingPath(
		companySlug, "/runs/"+url.PathEscape(runUUID)+"/rebuild", 0,
	), nil, nil)
}

func workflowTimingPath(companySlug, path string, limit int) string {
	query := url.Values{"companySlug": {companySlug}}
	if limit > 0 {
		query.Set("limit", strconv.Itoa(limit))
	}
	return "/workflow-timings" + path + "?" + query.Encode()
}

func workflowTimingResourcePath(companySlug, path string) string {
	segments := strings.Split(path, "/")
	for index, segment := range segments {
		if index > 0 {
			segments[index] = url.PathEscape(segment)
		}
	}
	return workflowTimingPath(companySlug, strings.Join(segments, "/"), 0)
}
