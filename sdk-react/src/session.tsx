import {
  type BrowserSignIn,
  SIGN_IN_STATUSES,
  type SignInError,
  type SignInSession,
  type SignInStartOptions,
  type SignInState,
  type SignInStatus,
  type SignOutOptions,
  type SignOutResult,
} from "@haakco/custd-sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

export type CustdSession = {
  status: SignInStatus;
  session: SignInSession | null;
  error: SignInError | null;
  signIn: (options?: SignInStartOptions) => Promise<void>;
  signOut: (options?: SignOutOptions) => SignOutResult;
};

export type CustdSessionProviderProps = {
  client: BrowserSignIn;
  children?: ReactNode;
  /** Called after a sign-in redirect completes. Defaults to replacing the URL with `returnTo`. */
  onSignInComplete?: (returnTo: string) => void;
};

const SessionContext = createContext<BrowserSignIn | null>(null);

/** Restores the session on mount (completing a sign-in redirect) and shares the client. */
export function CustdSessionProvider({ client, children, onSignInComplete }: CustdSessionProviderProps) {
  const onComplete = useRef(onSignInComplete);
  onComplete.current = onSignInComplete;
  useEffect(() => {
    let active = true;
    void client.restore().then((result) => {
      if (!active || result.returnTo === undefined) return;
      (onComplete.current ?? replaceUrl)(result.returnTo);
    });
    return () => {
      active = false;
    };
  }, [client]);
  return <SessionContext.Provider value={client}>{children}</SessionContext.Provider>;
}

export function useCustdSession(): CustdSession {
  const client = useContext(SessionContext);
  if (!client) throw new Error("custd: useCustdSession must be used inside CustdSessionProvider");
  const subscribe = useCallback((listener: () => void) => client.subscribe(listener), [client]);
  const getState = useCallback(() => client.getState(), [client]);
  const state = useSyncExternalStore(subscribe, getState, getState);
  return useMemo(() => toSession(client, state), [client, state]);
}

function toSession(client: BrowserSignIn, state: SignInState): CustdSession {
  return {
    status: state.status,
    session: state.status === SIGN_IN_STATUSES.signedIn ? state.session : null,
    error: state.status === SIGN_IN_STATUSES.error ? state.error : null,
    // A failed start is already published as the error state.
    signIn: (options) => client.signIn(options).catch(() => undefined),
    signOut: (options) => client.signOut(options),
  };
}

function replaceUrl(returnTo: string): void {
  window.history.replaceState(null, "", returnTo);
}
