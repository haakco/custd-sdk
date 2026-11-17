import { jsx as _jsx } from "react/jsx-runtime";
import { SIGN_IN_STATUSES, } from "@haakco/custd-sdk";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, } from "react";
const SessionContext = createContext(null);
/** Restores the session on mount (completing a sign-in redirect) and shares the client. */
export function CustdSessionProvider({ client, children, onSignInComplete }) {
    const onComplete = useRef(onSignInComplete);
    onComplete.current = onSignInComplete;
    useEffect(() => {
        let active = true;
        void client.restore().then((result) => {
            if (!active || result.returnTo === undefined)
                return;
            (onComplete.current ?? replaceUrl)(result.returnTo);
        });
        return () => {
            active = false;
        };
    }, [client]);
    return _jsx(SessionContext.Provider, { value: client, children: children });
}
export function useCustdSession() {
    const client = useContext(SessionContext);
    if (!client)
        throw new Error("custd: useCustdSession must be used inside CustdSessionProvider");
    const subscribe = useCallback((listener) => client.subscribe(listener), [client]);
    const getState = useCallback(() => client.getState(), [client]);
    const state = useSyncExternalStore(subscribe, getState, getState);
    return useMemo(() => toSession(client, state), [client, state]);
}
function toSession(client, state) {
    return {
        status: state.status,
        session: state.status === SIGN_IN_STATUSES.signedIn ? state.session : null,
        error: state.status === SIGN_IN_STATUSES.error ? state.error : null,
        // A failed start is already published as the error state.
        signIn: (options) => client.signIn(options).catch(() => undefined),
        signOut: (options) => client.signOut(options),
    };
}
function replaceUrl(returnTo) {
    window.history.replaceState(null, "", returnTo);
}
