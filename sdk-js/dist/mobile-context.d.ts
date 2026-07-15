import type { EventEnvelope } from "./index.js";
declare const mobilePlatforms: readonly ["android", "ios"];
declare const mobileNetworkStates: readonly ["offline", "online", "unknown"];
export type MobilePlatform = (typeof mobilePlatforms)[number];
export type MobileNetworkState = (typeof mobileNetworkStates)[number];
export type MobileSubject = {
    kind: "anonymous";
    anonymousId: string;
} | {
    kind: "authenticated";
    userUuid: string;
};
export type MobileEventContext = {
    appVersion: string;
    platform: MobilePlatform;
    locale: string;
    timezone: string;
    networkState: MobileNetworkState;
};
export type MobileEventInput = {
    eventUuid?: string;
    eventTypeSlug: string;
    schemaVersion: string;
    timestamp: string;
    sessionId?: string;
    companySlug?: string;
    subject: MobileSubject;
    context: MobileEventContext;
    payload: Record<string, unknown>;
};
export declare function createMobileEvent(input: MobileEventInput): EventEnvelope;
export {};
