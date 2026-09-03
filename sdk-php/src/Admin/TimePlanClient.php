<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\TimePlan\AllocationPreview;
use HaakCo\Custd\Admin\TimePlan\Annotation;
use HaakCo\Custd\Admin\TimePlan\AnnotationInput;
use HaakCo\Custd\Admin\TimePlan\AnnotationListResponse;
use HaakCo\Custd\Admin\TimePlan\CommandRequest;
use HaakCo\Custd\Admin\TimePlan\CommandResult;
use HaakCo\Custd\Admin\TimePlan\Definition;
use HaakCo\Custd\Admin\TimePlan\DraftRequest;
use HaakCo\Custd\Admin\TimePlan\DraftRevisionRequest;
use HaakCo\Custd\Admin\TimePlan\Dto;
use HaakCo\Custd\Admin\TimePlan\HistoryResponse;
use HaakCo\Custd\Admin\TimePlan\Plan;
use HaakCo\Custd\Admin\TimePlan\PlanListResponse;
use HaakCo\Custd\Admin\TimePlan\RedactionRequest;
use HaakCo\Custd\Admin\TimePlan\RevisionRequest;
use HaakCo\Custd\Admin\TimePlan\Run;
use HaakCo\Custd\Admin\TimePlan\RunRequest;
use HaakCo\Custd\Admin\TimePlan\Version;

/**
 * TimePlanClient owns the tenant-scoped time-plan lifecycle and run controls.
 * The server remains authoritative for allocation and command results.
 */
final class TimePlanClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    public function list(string $companySlug, ?int $limit = null): PlanListResponse
    {
        return PlanListResponse::fromPayload($this->requiredResponse(
            "GET",
            $this->collection("/time-plans", $companySlug, $limit),
        ));
    }

    public function get(string $companySlug, string $planUuid): Plan
    {
        return Plan::fromPayload($this->requiredResponse(
            "GET",
            $this->resource("/time-plans/{$planUuid}", $companySlug),
        ));
    }

    public function create(string $companySlug, DraftRequest $body): Plan
    {
        return Plan::fromPayload($this->requiredResponse(
            "POST",
            $this->collection("/time-plans", $companySlug),
            $body,
        ));
    }

    public function preview(string $companySlug, Definition $definition): AllocationPreview
    {
        return AllocationPreview::fromPayload($this->requiredResponse(
            "POST",
            $this->collection("/time-plans/preview", $companySlug),
            $definition,
        ));
    }

    public function revise(string $companySlug, string $planUuid, DraftRevisionRequest $body): Plan
    {
        return Plan::fromPayload($this->requiredResponse(
            "PATCH",
            $this->resource("/time-plans/{$planUuid}", $companySlug),
            $body,
        ));
    }

    public function publish(string $companySlug, string $planUuid, RevisionRequest $body): Version
    {
        return Version::fromPayload($this->requiredResponse(
            "POST",
            $this->resource("/time-plans/{$planUuid}/publish", $companySlug),
            $body,
        ));
    }

    public function retire(string $companySlug, string $planUuid): Plan
    {
        return Plan::fromPayload($this->requiredResponse(
            "POST",
            $this->resource("/time-plans/{$planUuid}/retire", $companySlug),
        ));
    }

    public function createRun(string $companySlug, RunRequest $body): \HaakCo\Custd\Admin\TimePlan\CreatedRun
    {
        return \HaakCo\Custd\Admin\TimePlan\CreatedRun::fromPayload($this->requiredResponse(
            "POST",
            $this->collection("/time-plans/runs", $companySlug),
            $body,
        ));
    }

    public function getRun(string $companySlug, string $runUuid): Run
    {
        return Run::fromPayload($this->requiredResponse(
            "GET",
            $this->resource("/time-plans/runs/{$runUuid}", $companySlug),
        ));
    }

    public function history(string $companySlug, string $runUuid, ?int $limit = null): HistoryResponse
    {
        return HistoryResponse::fromPayload($this->requiredResponse(
            "GET",
            $this->resource("/time-plans/runs/{$runUuid}/history", $companySlug, $limit),
        ));
    }

    public function execute(string $companySlug, string $runUuid, CommandRequest $body): CommandResult
    {
        return CommandResult::fromPayload($this->requiredResponse(
            "POST",
            $this->resource("/time-plans/runs/{$runUuid}/commands", $companySlug),
            $body,
        ));
    }

    public function createAnnotation(string $companySlug, string $runUuid, AnnotationInput $body): Annotation
    {
        return Annotation::fromPayload($this->requiredResponse(
            "POST",
            $this->resource("/time-plans/runs/{$runUuid}/annotations", $companySlug),
            $body,
        ));
    }

    public function listAnnotations(string $companySlug, string $runUuid, ?int $limit = null): AnnotationListResponse
    {
        return AnnotationListResponse::fromPayload($this->requiredResponse(
            "GET",
            $this->resource("/time-plans/runs/{$runUuid}/annotations", $companySlug, $limit),
        ));
    }

    public function correctAnnotation(
        string $companySlug,
        string $runUuid,
        string $annotationUuid,
        AnnotationInput $body,
    ): Annotation {
        $path = "/time-plans/runs/{$runUuid}/annotations/{$annotationUuid}/corrections";
        return Annotation::fromPayload($this->requiredResponse("POST", $this->resource($path, $companySlug), $body));
    }

    public function redactAnnotation(
        string $companySlug,
        string $runUuid,
        string $annotationUuid,
        RedactionRequest $request,
    ): void {
        $path = "/time-plans/runs/{$runUuid}/annotations/{$annotationUuid}/redact";
        $this->request("POST", $this->resource($path, $companySlug), $request);
    }

    /** @param Dto|null $body
     *  @return array<string, mixed>|null
     */
    private function request(string $method, string $path, ?Dto $body = null): ?array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, $method, $path, $body?->toPayload());
    }

    /** @param Dto|null $body
     *  @return array<string, mixed>
     */
    private function requiredResponse(string $method, string $path, ?Dto $body = null): array
    {
        $response = $this->request($method, $path, $body);
        if ($response === null) {
            throw new \UnexpectedValueException("custd: time-plan response body is required");
        }
        return $response;
    }

    private function collection(string $path, string $companySlug, ?int $limit = null): string
    {
        $query = ["companySlug" => $companySlug];
        if ($limit !== null) {
            $query["limit"] = $limit;
        }
        return $path . "?" . http_build_query($query, "", "&", PHP_QUERY_RFC3986);
    }

    private function resource(string $path, string $companySlug, ?int $limit = null): string
    {
        $segments = explode("/", $path);
        foreach ($segments as $index => $segment) {
            if ($index > 0) {
                $segments[$index] = rawurlencode($segment);
            }
        }
        return $this->collection(implode("/", $segments), $companySlug, $limit);
    }
}
