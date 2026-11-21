import type { AppForecastRun, AppForecastRunRequest, AppForecastStory, AppMeasurementProject, AppProjectEstimate, AppProjectEstimateList } from "../app-items.js";
import { type AppMeeting, type AppMeetingCreate } from "../app-meetings.js";
import type { AppModelQuantity, AppModelQuantityResult, AppModelSensitivity } from "../app-models.js";
/** A refusal the fake answers with as an RFC 9457 problem. */
export declare class FakeCustdProblem extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string);
}
export type FakeObservation = {
    observedAt: string;
    value: number;
};
/** The `n`th element from the end (1 is the last); `Array.prototype.at` is newer than the SDK's target. */
export declare function fromEnd<T>(list: T[], n: number): T | undefined;
/** A least-squares line through the measurements, projected to the target. Needs three points. */
export declare function fakeForecastRun(project: AppMeasurementProject, observations: FakeObservation[], request: AppForecastRunRequest, meta: {
    runUuid: string;
    now: number;
}): AppForecastRun;
export declare function fakeForecastStory(project: AppMeasurementProject, observations: FakeObservation[], now: number): AppForecastStory;
export declare function fakeEstimateList(estimates: AppProjectEstimate[], deliveryTargetDate: string | undefined, now: number): AppProjectEstimateList;
/** Each quantity's midpoint and spread, with formulas over earlier quantities. */
export declare function fakeModelResults(quantities: AppModelQuantity[]): AppModelQuantityResult[];
export declare function fakeSensitivity(quantities: AppModelQuantity[], output: string): AppModelSensitivity;
export declare function fakeMeeting(create: AppMeetingCreate, blockUuid: () => string): AppMeeting;
export declare function startFakeMeeting(meeting: AppMeeting, now: number): void;
/** Returns false for a repeat of the advance that just happened: the meeting is unchanged. */
export declare function advanceFakeMeeting(meeting: AppMeeting, blockUuid: string, now: number): boolean;
export declare function endFakeMeeting(meeting: AppMeeting, now: number): void;
