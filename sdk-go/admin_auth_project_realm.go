package custd

import (
	"context"
	"strings"
)

// AuthProjectRealmStep names one step of a realm provision, reported so a caller
// knows exactly where a partial provision stopped without re-reading state.
type AuthProjectRealmStep string

const (
	// AuthProjectRealmStepApply writes the environment's desired state and runs
	// the client registration it implies.
	AuthProjectRealmStepApply AuthProjectRealmStep = "apply"
	// AuthProjectRealmStepDirectory enables the addressed directory's credential store.
	AuthProjectRealmStepDirectory AuthProjectRealmStep = "directory_enable"
	// AuthProjectRealmStepStatus reads the resulting configured state back.
	AuthProjectRealmStepStatus AuthProjectRealmStep = "status"
)

// AuthProjectRealmProvisionRequest is one environment's realm setup: the desired
// state to apply and the directory credential store to enable. The owning-user
// option and the base idempotency key come from AuthProjectRequestOptions.
type AuthProjectRealmProvisionRequest struct {
	// DesiredStateRequest is the environment configuration to write. Its
	// ExpectedRevision is the revision the caller read, or 0 for a first apply.
	DesiredStateRequest AuthProjectDesiredStateRequest
	// DirectoryPoolID names the directory whose credential store is enabled.
	DirectoryPoolID string
	// DirectoryExpectedRevision is the directory revision the caller read, or 0.
	DirectoryExpectedRevision int64
}

// AuthProjectRealmProvisionReceipt reports what each step wrote and, when a step
// failed, which one. It always carries the steps that completed, so a caller can
// resume from FailedStep rather than repeating the whole provision.
type AuthProjectRealmProvisionReceipt struct {
	ProjectID     string
	EnvironmentID string
	Apply         *AuthProjectOperation
	Directory     *AuthProjectOperation
	Status        *AuthProjectStatus
	// FailedStep is empty when every step completed.
	FailedStep AuthProjectRealmStep
}

// ProvisionRealm sets one environment's identity realm up through the public
// control plane in the order the service requires, so a consumer does not have to
// sequence separate calls itself. It applies the desired state (which also
// reconciles the environment's application clients), enables the addressed
// directory credential store, and reads status back.
//
// Each mutating step derives a stable key from the base Idempotency-Key in
// options, so retrying the whole call with the same base key resumes rather than
// duplicating: a step that already succeeded answers from its recorded operation.
// On failure the returned receipt carries FailedStep and the steps that
// completed, so a caller can inspect or resume.
func (c *AuthProjectAdminClient) ProvisionRealm(
	ctx context.Context,
	projectID string,
	environmentID string,
	req AuthProjectRealmProvisionRequest,
	options AuthProjectRequestOptions,
) (*AuthProjectRealmProvisionReceipt, error) {
	if err := requireAuthProjectIdempotencyKey(options); err != nil {
		return nil, err
	}
	base := strings.TrimSpace(options.IdempotencyKey)
	receipt := &AuthProjectRealmProvisionReceipt{ProjectID: projectID, EnvironmentID: environmentID}

	applyOptions := options
	applyOptions.IdempotencyKey = base + ":apply"
	operation, err := c.ApplyEnvironmentDesiredState(
		ctx, projectID, environmentID, req.DesiredStateRequest, applyOptions,
	)
	if err != nil {
		receipt.FailedStep = AuthProjectRealmStepApply
		return receipt, err
	}
	receipt.Apply = operation

	directoryOptions := options
	directoryOptions.IdempotencyKey = base + ":directory-enable"
	directoryOperation, err := c.ActOnDirectory(
		ctx, projectID, environmentID, AuthProjectDirectoryEnable,
		AuthProjectDirectoryRequest{
			PoolID: req.DirectoryPoolID, ExpectedRevision: req.DirectoryExpectedRevision,
		},
		directoryOptions,
	)
	if err != nil {
		receipt.FailedStep = AuthProjectRealmStepDirectory
		return receipt, err
	}
	receipt.Directory = directoryOperation

	statusOptions := options
	// Status is a read, so it does not carry the workflow's write key.
	statusOptions.IdempotencyKey = ""
	status, err := c.GetEnvironmentStatus(ctx, projectID, environmentID, statusOptions)
	if err != nil {
		receipt.FailedStep = AuthProjectRealmStepStatus
		return receipt, err
	}
	receipt.Status = status
	return receipt, nil
}
