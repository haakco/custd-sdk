const timePlanAnnotationTypes = ["note", "marker", "decision", "action"];
const timePlanAnnotationFields = [
    "text",
    "markerLabel",
    "decisionStatus",
    "assigneeRef",
    "dueDate",
    "actionStatus",
];
const timePlanAllocationBases = [
    "absolute",
    "horizon_fraction",
    "remainder_weight",
];
const timePlanThresholdSeverities = ["info", "warning", "critical"];
const maxTimePlanThresholdCues = 16;
export function validateTimePlanDefinition(definition) {
    if (!Number.isSafeInteger(definition.horizonMs) || definition.horizonMs <= 0) {
        throw new Error("custd: time-plan horizonMs must be a positive integer");
    }
    if (definition.annotationSchema) {
        validateTimePlanEnumList(definition.annotationSchema.allowedTypes, timePlanAnnotationTypes, "allowedTypes", 4);
        validateTimePlanEnumList(definition.annotationSchema.fields, timePlanAnnotationFields, "fields", 6);
    }
    const thresholdCues = definition.thresholdCues ?? [];
    if (thresholdCues.length > maxTimePlanThresholdCues) {
        throw new Error("custd: time-plan thresholdCues cannot contain more than 16 values");
    }
    const seenTriggers = new Set();
    for (const cue of thresholdCues) {
        validateTimePlanThresholdCue(cue);
        const trigger = cue.remainingMs !== undefined ? `ms:${cue.remainingMs}` : `bps:${cue.remainingFractionBps}`;
        if (seenTriggers.has(trigger)) {
            throw new Error("custd: time-plan thresholdCues must not contain duplicate triggers");
        }
        seenTriggers.add(trigger);
    }
    for (const block of definition.blocks) {
        if (!timePlanAllocationBases.includes(block.basis)) {
            throw new Error("custd: time-plan block basis is invalid");
        }
    }
}
function validateTimePlanThresholdCue(cue) {
    const hasRemainingMs = cue.remainingMs !== undefined && cue.remainingMs !== null;
    const hasRemainingFractionBps = cue.remainingFractionBps !== undefined && cue.remainingFractionBps !== null;
    if (hasRemainingMs === hasRemainingFractionBps) {
        throw new Error("custd: time-plan threshold cue must have one remaining threshold");
    }
    if (!timePlanThresholdSeverities.includes(cue.severity)) {
        throw new Error("custd: time-plan threshold cue severity is invalid");
    }
    if (hasRemainingMs) {
        const remainingMs = cue.remainingMs;
        if (remainingMs === undefined ||
            remainingMs === null ||
            !Number.isSafeInteger(remainingMs) ||
            remainingMs < 0 ||
            remainingMs > 2419200000) {
            throw new Error("custd: time-plan remainingMs is out of range");
        }
    }
    if (hasRemainingFractionBps) {
        const remainingFractionBps = cue.remainingFractionBps;
        if (remainingFractionBps === undefined ||
            remainingFractionBps === null ||
            !Number.isSafeInteger(remainingFractionBps) ||
            remainingFractionBps < 0 ||
            remainingFractionBps > 10000) {
            throw new Error("custd: time-plan remainingFractionBps is out of range");
        }
    }
}
function validateTimePlanEnumList(values, allowed, field, maxItems) {
    if (!values)
        return;
    if (values.length > maxItems || new Set(values).size !== values.length) {
        throw new Error(`custd: time-plan ${field} contains too many or duplicate values`);
    }
    if (values.some((value) => !allowed.includes(value))) {
        throw new Error(`custd: time-plan ${field} contains an unsupported value`);
    }
}
export class TimePlanAdminClient {
    constructor(request) {
        this.request = request;
    }
    list(companySlug, limit, options) {
        return this.request("GET", collectionPath("/time-plans", companySlug, limit), undefined, options);
    }
    get(companySlug, planUuid, options) {
        return this.request("GET", resourcePath(`/time-plans/${planUuid}`, companySlug), undefined, options);
    }
    create(companySlug, body, options) {
        validateTimePlanDefinition(body.definition);
        return this.request("POST", collectionPath("/time-plans", companySlug), body, options);
    }
    preview(companySlug, definition, options) {
        validateTimePlanDefinition(definition);
        return this.request("POST", collectionPath("/time-plans/preview", companySlug), definition, options);
    }
    revise(companySlug, planUuid, body, options) {
        validateTimePlanDefinition(body.definition);
        return this.request("PATCH", resourcePath(`/time-plans/${planUuid}`, companySlug), body, options);
    }
    publish(companySlug, planUuid, body, options) {
        return this.request("POST", resourcePath(`/time-plans/${planUuid}/publish`, companySlug), body, options);
    }
    retire(companySlug, planUuid, options) {
        return this.request("POST", resourcePath(`/time-plans/${planUuid}/retire`, companySlug), undefined, options);
    }
    createRun(companySlug, body, options) {
        return this.request("POST", collectionPath("/time-plans/runs", companySlug), body, options);
    }
    getRun(companySlug, runUuid, options) {
        return this.request("GET", resourcePath(`/time-plans/runs/${runUuid}`, companySlug), undefined, options);
    }
    history(companySlug, runUuid, limit, options) {
        return this.request("GET", resourcePath(`/time-plans/runs/${runUuid}/history`, companySlug, limit), undefined, options);
    }
    execute(companySlug, runUuid, body, options) {
        return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/commands`, companySlug), body, options);
    }
    createAnnotation(companySlug, runUuid, body, options) {
        return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/annotations`, companySlug), body, options);
    }
    listAnnotations(companySlug, runUuid, limit, options) {
        return this.request("GET", resourcePath(`/time-plans/runs/${runUuid}/annotations`, companySlug, limit), undefined, options);
    }
    correctAnnotation(companySlug, runUuid, annotationUuid, body, options) {
        return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/annotations/${annotationUuid}/corrections`, companySlug), body, options);
    }
    redactAnnotation(companySlug, runUuid, annotationUuid, request, options) {
        return this.request("POST", resourcePath(`/time-plans/runs/${runUuid}/annotations/${annotationUuid}/redact`, companySlug), request, options);
    }
}
function collectionPath(path, companySlug, limit) {
    const query = new URLSearchParams({ companySlug });
    if (limit !== undefined)
        query.set("limit", String(limit));
    return `${path}?${query.toString()}`;
}
function resourcePath(path, companySlug, limit) {
    const segments = path.split("/").map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)));
    return collectionPath(segments.join("/"), companySlug, limit);
}
