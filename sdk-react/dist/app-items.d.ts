import { type AppForecastRun, type AppForecastStory, type AppItemAccess, type AppItemRead, type AppItemsClient, type AppLiveState, type AppLiveWatchOptions, type AppMeeting, type AppModelRun } from "@haakco/custd-sdk/browser";
/** No link token yet: nothing is read. */
export declare const CUSTD_APP_LIVE_IDLE = "idle";
export type CustdAppLiveState<T> = AppLiveState<T> | {
    status: typeof CUSTD_APP_LIVE_IDLE;
};
/** A watched read and a `refresh` that polls now. */
export type CustdAppLiveResult<T> = CustdAppLiveState<T> & {
    refresh: () => void;
};
export type UseAppLiveOptions = AppLiveWatchOptions & {
    /** Defaults to the `CustdHostedAppProvider` app's `appItems`. */
    client?: AppItemsClient;
};
/** A link token, or `{ item }` for an item the signed-in user owns; empty reads nothing. */
export type CustdAppItemAccess = AppItemAccess | null | undefined;
/**
 * The item a link opens, kept fresh by conditional polling (paused while the tab is hidden).
 * Every component watching the same item and link shares one poller.
 */
export declare function useAppItem(token: CustdAppItemAccess, options?: UseAppLiveOptions): CustdAppLiveResult<AppItemRead>;
/** The item's latest forecast run, kept fresh; its data is null until the first run exists. */
export declare function useAppForecast(token: CustdAppItemAccess, options?: UseAppLiveOptions): CustdAppLiveResult<AppForecastRun | null>;
/** The item's measurements and forecast story, kept fresh. */
export declare function useAppForecastStory(token: CustdAppItemAccess, options?: UseAppLiveOptions): CustdAppLiveResult<AppForecastStory>;
/** The model item's latest run, kept fresh; `empty` until the first run exists. */
export declare function useAppModelRun(token: CustdAppItemAccess, options?: UseAppLiveOptions): CustdAppLiveResult<AppModelRun>;
/**
 * The meeting a meeting item runs, kept fresh through the item's shared poller, so it costs no
 * extra request beside `useAppItem` on the same link. An item of another kind is an `error`
 * with code `app_item_wrong_kind`.
 */
export declare function useAppMeeting(token: CustdAppItemAccess, options?: UseAppLiveOptions): CustdAppLiveResult<AppMeeting>;
