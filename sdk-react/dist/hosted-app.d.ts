import { type AppEventMap, type HostedAppOptions, type HostedAppStart } from "@haakco/custd-sdk/browser";
import { type ReactNode } from "react";
export declare const CUSTD_HOSTED_APP_LOADING = "loading";
export type CustdHostedAppState<TEvents extends AppEventMap = AppEventMap> = {
    status: typeof CUSTD_HOSTED_APP_LOADING;
} | HostedAppStart<TEvents>;
export type CustdHostedAppProviderProps = {
    /** Read once on mount; later changes do not restart the app. */
    options?: HostedAppOptions;
    /** Called after a sign-in redirect completes. Defaults to replacing the URL with `returnTo`. */
    onSignInComplete?: (returnTo: string) => void;
    children?: ReactNode;
};
/**
 * Starts the hosted app once and shares its state. Children render while the
 * discovery file loads and after it fails; when sign-in is enabled they are
 * wrapped in `CustdSessionProvider`, so `useCustdSession` works once ready.
 */
export declare function CustdHostedAppProvider({ options, onSignInComplete, children }: CustdHostedAppProviderProps): import("react").JSX.Element;
/** The hosted app's state: loading, ready with its handle, or a typed error. */
export declare function useCustdHostedApp<TEvents extends AppEventMap = AppEventMap>(): CustdHostedAppState<TEvents>;
/**
 * Starts the app and reports its result while active. The returned cleanup
 * stops the app, including one that resolves after cleanup.
 */
export declare function watchHostedApp(start: () => Promise<HostedAppStart>, onResult: (result: HostedAppStart) => void): () => void;
