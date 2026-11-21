import { APP_ITEM_ERROR_CODES, APP_LIVE_STATUSES, AppItemError, HOSTED_APP_STATUSES, } from "@haakco/custd-sdk/browser";
import { useMemo, useSyncExternalStore } from "react";
import { CUSTD_HOSTED_APP_LOADING, useOptionalCustdHostedApp } from "./hosted-app.js";
/** No link token yet: nothing is read. */
export const CUSTD_APP_LIVE_IDLE = "idle";
const IDLE = { status: CUSTD_APP_LIVE_IDLE };
const LOADING = { status: APP_LIVE_STATUSES.loading };
const UNAVAILABLE = {
    status: APP_LIVE_STATUSES.error,
    error: new AppItemError(null, APP_ITEM_ERROR_CODES.unavailable),
    retrying: false,
};
const noSubscription = () => () => { };
const noRefresh = () => { };
/**
 * The item a link opens, kept fresh by conditional polling (paused while the tab is hidden).
 * Every component watching the same item and link shares one poller.
 */
export function useAppItem(token, options = {}) {
    return useAppLive(token, options, watchItem);
}
/** The item's latest forecast run, kept fresh; its data is null until the first run exists. */
export function useAppForecast(token, options = {}) {
    return useAppLive(token, options, watchLatestForecast);
}
/** The item's measurements and forecast story, kept fresh. */
export function useAppForecastStory(token, options = {}) {
    return useAppLive(token, options, watchForecastStory);
}
/** The model item's latest run, kept fresh; `empty` until the first run exists. */
export function useAppModelRun(token, options = {}) {
    return useAppLive(token, options, watchLatestModelRun);
}
/**
 * The meeting a meeting item runs, kept fresh through the item's shared poller, so it costs no
 * extra request beside `useAppItem` on the same link. An item of another kind is an `error`
 * with code `app_item_wrong_kind`.
 */
export function useAppMeeting(token, options = {}) {
    const item = useAppItem(token, options);
    return useMemo(() => meetingOf(item), [item]);
}
const NOT_A_MEETING = new AppItemError(null, APP_ITEM_ERROR_CODES.wrongKind);
function meetingOf(result) {
    if (!("data" in result) || result.data === undefined)
        return result;
    const meeting = result.data.meeting;
    if (meeting)
        return { ...result, data: meeting };
    return { status: APP_LIVE_STATUSES.error, error: NOT_A_MEETING, retrying: false, refresh: result.refresh };
}
function watchLatestModelRun(client, access, options) {
    return client.watchLatestModelRun(access, options);
}
function watchItem(client, access, options) {
    return client.watchItem(access, options);
}
function watchLatestForecast(client, access, options) {
    return client.watchLatestForecast(access, options);
}
function watchForecastStory(client, access, options) {
    return client.watchForecastStory(access, options);
}
function useAppLive(token, options, watchOf) {
    const hosted = useOptionalCustdHostedApp();
    const { item, intervalMs, maxBackoffMs } = options;
    let client = options.client;
    let fallback = UNAVAILABLE;
    if (!client && hosted?.status === CUSTD_HOSTED_APP_LOADING)
        fallback = LOADING;
    if (!client && hosted?.status === HOSTED_APP_STATUSES.ready)
        client = hosted.app.appItems;
    // Primitive keys, so an inline `{ item }` does not start a new watch on every render.
    const linkToken = typeof token === "string" ? token : undefined;
    const ownedItem = typeof token === "object" && token ? token.item : undefined;
    if (!linkToken && !ownedItem)
        fallback = IDLE;
    const watch = useMemo(() => {
        const access = linkToken || (ownedItem ? { item: ownedItem } : undefined);
        return client && access ? watchOf(client, access, { item, intervalMs, maxBackoffMs }) : null;
    }, [client, linkToken, ownedItem, item, intervalMs, maxBackoffMs, watchOf]);
    const getState = watch ? watch.getState : () => fallback;
    const state = useSyncExternalStore(watch ? watch.subscribe : noSubscription, getState, getState);
    const refresh = watch ? watch.refresh : noRefresh;
    return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
