// Deterministic stand-ins for the results Custd computes: a straight-line forecast, model runs from
// each input's midpoint and spread, estimate summaries and meeting steps. They are simple on purpose;
// they give pages realistic shapes to render, not real statistics.
import { APP_MEETING_BLOCK_STATUSES, APP_MEETING_ERROR_CODES, APP_MEETING_STATUSES, } from "../app-meetings.js";
const DAY_MS = 86400000;
const HISTOGRAM_COUNTS = [40, 140, 320, 300, 150, 50];
/** A refusal the fake answers with as an RFC 9457 problem. */
export class FakeCustdProblem extends Error {
    constructor(status, code) {
        super(code);
        this.status = status;
        this.code = code;
        this.name = "FakeCustdProblem";
    }
}
/** The `n`th element from the end (1 is the last); `Array.prototype.at` is newer than the SDK's target. */
export function fromEnd(list, n) {
    return list[list.length - n];
}
function iso(ms) {
    return new Date(ms).toISOString();
}
function slopeOf(points) {
    const n = points.length;
    const meanT = points.reduce((sum, point) => sum + point.t, 0) / n;
    const meanV = points.reduce((sum, point) => sum + point.v, 0) / n;
    const covariance = points.reduce((sum, point) => sum + (point.t - meanT) * (point.v - meanV), 0);
    const variance = points.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0);
    return variance === 0 ? 0 : covariance / variance;
}
/** A least-squares line through the measurements, projected to the target. Needs three points. */
export function fakeForecastRun(project, observations, request, meta) {
    const from = request.forecastFrom ? Date.parse(request.forecastFrom) : Number.NEGATIVE_INFINITY;
    const points = observations
        .map((row) => ({ t: Date.parse(row.observedAt), v: row.value }))
        .filter((point) => point.t >= from)
        .sort((a, b) => a.t - b.t);
    const run = {
        forecastRunUuid: meta.runUuid,
        projectUuid: project.projectUuid,
        status: "completed",
        method: request.method ?? "bayesian_linear_regression",
        generatedAt: iso(meta.now),
        inputCount: points.length,
        sampleCount: request.sampleCount ?? 1000,
        seed: request.seed ?? 1,
        percentiles: {},
        provenance: { engine: "fake" },
        ...(request.forecastFrom ? { forecastFrom: request.forecastFrom } : {}),
    };
    const last = fromEnd(points, 1);
    const slope = points.length >= 3 ? slopeOf(points) : 0;
    if (last && project.target && slope > 0)
        addCounter(run, project.target, last, slope);
    return run;
}
function addCounter(run, target, last, slope) {
    const finish = last.t + (target.targetValue - last.v) / slope;
    const spread = Math.max(DAY_MS, (finish - last.t) * 0.25);
    const lower = finish - spread;
    const upper = finish + spread;
    const deadline = target.targetDate ? Date.parse(target.targetDate) : null;
    const perDay = slope * DAY_MS;
    run.percentiles = { p05: iso(lower), p50: iso(finish), p95: iso(upper) };
    run.counter = {
        completionInterval: { confidence: 0.9, lower: iso(lower), upper: iso(upper) },
        ...(deadline === null
            ? {}
            : { deadlineProbability: Math.min(0.99, Math.max(0.01, 0.5 + (deadline - finish) / (4 * spread))) }),
        rate: { perDay, perHour: perDay / 24, perMinute: perDay / 1440, perSecond: perDay / 86400 },
        pooledRunCount: 1,
        detail: {
            arrivalHistogram: {
                bins: HISTOGRAM_COUNTS.map((count, index) => ({
                    start: iso(lower + (index * (upper - lower)) / HISTOGRAM_COUNTS.length),
                    end: iso(lower + ((index + 1) * (upper - lower)) / HISTOGRAM_COUNTS.length),
                    count,
                })),
                neverCount: 0,
            },
            posteriorLines: [0.8, 0.9, 1, 1.1, 1.2].map((factor) => ({
                points: [
                    { at: iso(last.t), value: last.v },
                    { at: iso(last.t + (target.targetValue - last.v) / (slope * factor)), value: target.targetValue },
                ],
            })),
        },
    };
}
export function fakeForecastStory(project, observations, now) {
    const target = project.target;
    return {
        projectUuid: project.projectUuid,
        projectName: project.name,
        projectKind: project.kind,
        state: "ready",
        truncated: false,
        target: {
            available: target !== undefined,
            label: target?.name ?? "",
            value: target?.targetValue ?? 0,
            ...(target?.targetDate ? { deadline: target.targetDate } : {}),
        },
        observations: [...observations],
        snapshots: [],
        delivery: { estimates: [] },
        presentation: {
            version: 1,
            presetId: "forecast-story",
            renderer: "svg",
            caption: "",
            summary: "",
            nonColorEncoding: "",
            width: 640,
            height: 280,
            layers: [],
            references: [],
            tableColumns: [],
            tableRows: [],
        },
        trust: { state: "ok", evidence: "", observationCount: observations.length, snapshotCount: 0 },
        provenance: { owner: "fake", generatedAt: iso(now) },
    };
}
export function fakeEstimateList(estimates, deliveryTargetDate, now) {
    const list = {
        estimates: [...estimates],
        ...(deliveryTargetDate ? { deliveryTargetDate } : {}),
    };
    const latest = fromEnd(estimates, 1);
    if (!latest)
        return list;
    const low = Date.parse(latest.lowDate);
    const high = Date.parse(latest.highDate);
    list.latest = { estimate: latest, ageDays: (now - Date.parse(latest.estimatedAt)) / DAY_MS };
    if (deliveryTargetDate) {
        const chance = (Date.parse(deliveryTargetDate) - low) / Math.max(high - low, DAY_MS);
        list.latest.chanceByDeliveryTarget = Math.min(1, Math.max(0, chance));
    }
    const previous = fromEnd(estimates, 2);
    if (previous) {
        const middle = (low + high) / 2;
        const previousMiddle = (Date.parse(previous.lowDate) + Date.parse(previous.highDate)) / 2;
        list.latest.movementDays = Math.round((middle - previousMiddle) / DAY_MS);
    }
    return list;
}
// ---- Models ----
function midAndSpread(quantity, centre) {
    if (quantity.kind === "formula") {
        // Products or sums of named quantities only; the real engine parses full formulas.
        const values = (quantity.formula.match(/[A-Za-z_]\w*/g) ?? []).map((name) => centre.get(name) ?? 0);
        const mid = quantity.formula.includes("*")
            ? values.reduce((product, value) => product * value, 1)
            : values.reduce((sum, value) => sum + value, 0);
        return { mid, spread: Math.abs(mid) * 0.2 };
    }
    const input = quantity.input;
    if (input.shape === "point")
        return { mid: input.value, spread: 0 };
    if (input.shape === "range")
        return { mid: (input.low + input.high) / 2, spread: (input.high - input.low) / 2 };
    if (input.shape === "proportion")
        return { mid: input.trials === 0 ? 0 : input.successes / input.trials, spread: 0 };
    if (input.shape === "samples")
        return samplesMid(input.samples);
    return { mid: 0, spread: 0 };
}
function samplesMid(samples) {
    if (samples.length === 0)
        return { mid: 0, spread: 0 };
    const low = Math.min(...samples);
    const high = Math.max(...samples);
    return { mid: samples.reduce((sum, value) => sum + value, 0) / samples.length, spread: (high - low) / 2 };
}
/** Each quantity's midpoint and spread, with formulas over earlier quantities. */
export function fakeModelResults(quantities) {
    const centre = new Map();
    return quantities.map((quantity) => {
        const { mid, spread } = midAndSpread(quantity, centre);
        centre.set(quantity.name, mid);
        return {
            name: quantity.name,
            summary: {
                mean: mid,
                stdDev: spread / 1.645,
                percentiles: { p5: mid - spread, p25: mid - spread / 2, p50: mid, p75: mid + spread / 2, p95: mid + spread },
                histogram: { min: mid - spread, max: mid + spread, counts: [1, 3, 8, 15, 22, 22, 15, 8, 3, 1] },
            },
        };
    });
}
export function fakeSensitivity(quantities, output) {
    const inputs = quantities.filter((quantity) => quantity.kind === "input").map((quantity) => quantity.name);
    return {
        output,
        inputs: inputs.map((name, index) => ({ name, rankCorrelation: 0.8 / (index + 1), share: 1 / inputs.length })),
    };
}
// ---- Meetings: start, advance block by block, end; an overrun comes out of the blocks after it ----
const refused = () => new FakeCustdProblem(409, APP_MEETING_ERROR_CODES.stepRefused);
export function fakeMeeting(create, blockUuid) {
    const blocks = create.blocks.map((block, position) => ({
        blockUuid: blockUuid(),
        position,
        title: block.title,
        status: APP_MEETING_BLOCK_STATUSES.pending,
        predictedMs: block.predictedMs,
        allocatedMs: block.predictedMs,
        actualMs: 0,
    }));
    return summarise({ name: create.name, status: APP_MEETING_STATUSES.ready, blocks, summary: emptySummary() });
}
function emptySummary() {
    return { predictedMs: 0, finishedPredictedMs: 0, finishedActualMs: 0, finishedBlocks: 0, overrunMs: 0 };
}
function summarise(meeting) {
    const blocks = meeting.blocks ?? [];
    const finished = blocks.filter((block) => block.status === APP_MEETING_BLOCK_STATUSES.completed);
    const finishedPredictedMs = finished.reduce((sum, block) => sum + block.predictedMs, 0);
    const finishedActualMs = finished.reduce((sum, block) => sum + block.actualMs, 0);
    meeting.summary = {
        predictedMs: blocks.reduce((sum, block) => sum + block.predictedMs, 0),
        finishedPredictedMs,
        finishedActualMs,
        finishedBlocks: finished.length,
        overrunMs: Math.max(0, finishedActualMs - finishedPredictedMs),
    };
    return meeting;
}
function activate(meeting, block, now) {
    if (!block) {
        meeting.status = APP_MEETING_STATUSES.completed;
        delete meeting.currentBlockUuid;
        return;
    }
    block.status = APP_MEETING_BLOCK_STATUSES.active;
    block.startedAt = iso(now);
    meeting.currentBlockUuid = block.blockUuid;
}
export function startFakeMeeting(meeting, now) {
    if (meeting.status !== APP_MEETING_STATUSES.ready)
        throw refused();
    meeting.status = APP_MEETING_STATUSES.running;
    meeting.startedAt = iso(now);
    meeting.endsAt = iso(now + (meeting.blocks ?? []).reduce((sum, block) => sum + block.predictedMs, 0));
    activate(meeting, meeting.blocks?.[0], now);
    summarise(meeting);
}
function finish(block, now) {
    block.status = APP_MEETING_BLOCK_STATUSES.completed;
    block.endedAt = iso(now);
    block.actualMs = now - Date.parse(block.startedAt ?? iso(now));
}
function takeOverrun(blocks, overrunMs) {
    let left = overrunMs;
    for (const block of blocks) {
        const taken = Math.min(left, block.allocatedMs);
        block.allocatedMs -= taken;
        left -= taken;
    }
}
/** Returns false for a repeat of the advance that just happened: the meeting is unchanged. */
export function advanceFakeMeeting(meeting, blockUuid, now) {
    const blocks = meeting.blocks ?? [];
    const current = blocks.find((block) => block.blockUuid === meeting.currentBlockUuid);
    if (!current || current.blockUuid !== blockUuid) {
        const lastFinished = fromEnd(blocks.filter((block) => block.status === APP_MEETING_BLOCK_STATUSES.completed), 1);
        if (lastFinished?.blockUuid === blockUuid)
            return false;
        throw refused();
    }
    finish(current, now);
    const later = blocks.filter((block) => block.position > current.position);
    takeOverrun(later, Math.max(0, current.actualMs - current.allocatedMs));
    activate(meeting, later[0], now);
    summarise(meeting);
    return true;
}
export function endFakeMeeting(meeting, now) {
    if (meeting.status === APP_MEETING_STATUSES.completed || meeting.status === APP_MEETING_STATUSES.cancelled) {
        throw refused();
    }
    for (const block of meeting.blocks ?? []) {
        if (block.status === APP_MEETING_BLOCK_STATUSES.active)
            finish(block, now);
        if (block.status === APP_MEETING_BLOCK_STATUSES.pending)
            block.status = APP_MEETING_BLOCK_STATUSES.notRun;
    }
    meeting.status = APP_MEETING_STATUSES.completed;
    delete meeting.currentBlockUuid;
    summarise(meeting);
}
