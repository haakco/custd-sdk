import {
  type AppEventMap,
  HOSTED_APP_STATUSES,
  type HostedAppOptions,
  type HostedAppStart,
  startHostedApp,
} from "@haakco/custd-sdk/browser";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { CustdSessionProvider } from "./session.js";

export const CUSTD_HOSTED_APP_LOADING = "loading";

export type CustdHostedAppState<TEvents extends AppEventMap = AppEventMap> =
  | { status: typeof CUSTD_HOSTED_APP_LOADING }
  | HostedAppStart<TEvents>;

export type CustdHostedAppProviderProps = {
  /** Read once on mount; later changes do not restart the app. */
  options?: HostedAppOptions;
  /** Called after a sign-in redirect completes. Defaults to replacing the URL with `returnTo`. */
  onSignInComplete?: (returnTo: string) => void;
  children?: ReactNode;
};

const HostedAppContext = createContext<CustdHostedAppState | null>(null);

/**
 * Starts the hosted app once and shares its state. Children render while the
 * discovery file loads and after it fails; when sign-in is enabled they are
 * wrapped in `CustdSessionProvider`, so `useCustdSession` works once ready.
 */
export function CustdHostedAppProvider({ options, onSignInComplete, children }: CustdHostedAppProviderProps) {
  const [state, setState] = useState<CustdHostedAppState>({ status: CUSTD_HOSTED_APP_LOADING });
  const initialOptions = useRef(options);
  useEffect(() => watchHostedApp(() => startHostedApp(initialOptions.current), setState), []);
  const signIn = state.status === HOSTED_APP_STATUSES.ready ? state.app.signIn : undefined;
  return (
    <HostedAppContext.Provider value={state}>
      {signIn ? (
        <CustdSessionProvider client={signIn} onSignInComplete={onSignInComplete}>
          {children}
        </CustdSessionProvider>
      ) : (
        children
      )}
    </HostedAppContext.Provider>
  );
}

/** The hosted app's state: loading, ready with its handle, or a typed error. */
export function useCustdHostedApp<TEvents extends AppEventMap = AppEventMap>(): CustdHostedAppState<TEvents> {
  const state = useContext(HostedAppContext);
  if (!state) throw new Error("custd: useCustdHostedApp must be used inside CustdHostedAppProvider");
  return state as unknown as CustdHostedAppState<TEvents>;
}

/** The hosted app's state, or null outside `CustdHostedAppProvider`. */
export function useOptionalCustdHostedApp(): CustdHostedAppState | null {
  return useContext(HostedAppContext);
}

/**
 * Starts the app and reports its result while active. The returned cleanup
 * stops the app, including one that resolves after cleanup.
 */
export function watchHostedApp(
  start: () => Promise<HostedAppStart>,
  onResult: (result: HostedAppStart) => void,
): () => void {
  let active = true;
  const pending = start();
  void pending.then((result) => {
    if (active) onResult(result);
  });
  return () => {
    active = false;
    void pending.then((result) => {
      if (result.status === HOSTED_APP_STATUSES.ready) result.app.stop();
    });
  };
}
