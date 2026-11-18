import {
  APP_ITEM_ERROR_CODES,
  APP_LIVE_STATUSES,
  type AppForecastRun,
  type AppForecastStory,
  type AppItemAccess,
  AppItemError,
  type AppItemRead,
  type AppItemsClient,
  type AppLiveState,
  type AppLiveWatch,
  type AppLiveWatchOptions,
  type AppModelRun,
  HOSTED_APP_STATUSES,
} from "@haakco/custd-sdk/browser";
import { useMemo, useSyncExternalStore } from "react";
import { CUSTD_HOSTED_APP_LOADING, useOptionalCustdHostedApp } from "./hosted-app.js";

/** No link token yet: nothing is read. */
export const CUSTD_APP_LIVE_IDLE = "idle";

export type CustdAppLiveState<T> = AppLiveState<T> | { status: typeof CUSTD_APP_LIVE_IDLE };

/** A watched read and a `refresh` that polls now. */
export type CustdAppLiveResult<T> = CustdAppLiveState<T> & { refresh: () => void };

export type UseAppLiveOptions = AppLiveWatchOptions & {
  /** Defaults to the `CustdHostedAppProvider` app's `appItems`. */
  client?: AppItemsClient;
};

type WatchOf<T> = (client: AppItemsClient, access: AppItemAccess, options: AppLiveWatchOptions) => AppLiveWatch<T>;

/** A link token, or `{ item }` for an item the signed-in user owns; empty reads nothing. */
export type CustdAppItemAccess = AppItemAccess | null | undefined;

const IDLE: CustdAppLiveState<never> = { status: CUSTD_APP_LIVE_IDLE };
const LOADING: CustdAppLiveState<never> = { status: APP_LIVE_STATUSES.loading };
const UNAVAILABLE: CustdAppLiveState<never> = {
  status: APP_LIVE_STATUSES.error,
  error: new AppItemError(null, APP_ITEM_ERROR_CODES.unavailable),
  retrying: false,
};
const noSubscription = () => () => {};
const noRefresh = () => {};

/**
 * The item a link opens, kept fresh by conditional polling (paused while the tab is hidden).
 * Every component watching the same item and link shares one poller.
 */
export function useAppItem(
  token: CustdAppItemAccess,
  options: UseAppLiveOptions = {},
): CustdAppLiveResult<AppItemRead> {
  return useAppLive(token, options, watchItem);
}

/** The item's latest forecast run, kept fresh; its data is null until the first run exists. */
export function useAppForecast(
  token: CustdAppItemAccess,
  options: UseAppLiveOptions = {},
): CustdAppLiveResult<AppForecastRun | null> {
  return useAppLive(token, options, watchLatestForecast);
}

/** The item's measurements and forecast story, kept fresh. */
export function useAppForecastStory(
  token: CustdAppItemAccess,
  options: UseAppLiveOptions = {},
): CustdAppLiveResult<AppForecastStory> {
  return useAppLive(token, options, watchForecastStory);
}

/** The model item's latest run, kept fresh; `empty` until the first run exists. */
export function useAppModelRun(
  token: CustdAppItemAccess,
  options: UseAppLiveOptions = {},
): CustdAppLiveResult<AppModelRun> {
  return useAppLive(token, options, watchLatestModelRun);
}

function watchLatestModelRun(client: AppItemsClient, access: AppItemAccess, options: AppLiveWatchOptions) {
  return client.watchLatestModelRun(access, options);
}

function watchItem(client: AppItemsClient, access: AppItemAccess, options: AppLiveWatchOptions) {
  return client.watchItem(access, options);
}

function watchLatestForecast(client: AppItemsClient, access: AppItemAccess, options: AppLiveWatchOptions) {
  return client.watchLatestForecast(access, options);
}

function watchForecastStory(client: AppItemsClient, access: AppItemAccess, options: AppLiveWatchOptions) {
  return client.watchForecastStory(access, options);
}

function useAppLive<T>(
  token: CustdAppItemAccess,
  options: UseAppLiveOptions,
  watchOf: WatchOf<T>,
): CustdAppLiveResult<T> {
  const hosted = useOptionalCustdHostedApp();
  const { item, intervalMs, maxBackoffMs } = options;
  let client = options.client;
  let fallback: CustdAppLiveState<T> = UNAVAILABLE;
  if (!client && hosted?.status === CUSTD_HOSTED_APP_LOADING) fallback = LOADING;
  if (!client && hosted?.status === HOSTED_APP_STATUSES.ready) client = hosted.app.appItems;
  // Primitive keys, so an inline `{ item }` does not start a new watch on every render.
  const linkToken = typeof token === "string" ? token : undefined;
  const ownedItem = typeof token === "object" && token ? token.item : undefined;
  if (!linkToken && !ownedItem) fallback = IDLE;
  const watch = useMemo(() => {
    const access: AppItemAccess | undefined = linkToken || (ownedItem ? { item: ownedItem } : undefined);
    return client && access ? watchOf(client, access, { item, intervalMs, maxBackoffMs }) : null;
  }, [client, linkToken, ownedItem, item, intervalMs, maxBackoffMs, watchOf]);
  const getState = watch ? watch.getState : () => fallback;
  const state = useSyncExternalStore<CustdAppLiveState<T>>(
    watch ? watch.subscribe : noSubscription,
    getState,
    getState,
  );
  const refresh = watch ? watch.refresh : noRefresh;
  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
