import { jsx as _jsx } from "react/jsx-runtime";
import { HOSTED_APP_STATUSES, startHostedApp, } from "@haakco/custd-sdk/browser";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CustdSessionProvider } from "./session.js";
export const CUSTD_HOSTED_APP_LOADING = "loading";
const HostedAppContext = createContext(null);
/**
 * Starts the hosted app once and shares its state. Children render while the
 * discovery file loads and after it fails; when sign-in is enabled they are
 * wrapped in `CustdSessionProvider`, so `useCustdSession` works once ready.
 */
export function CustdHostedAppProvider({ options, onSignInComplete, children }) {
    const [state, setState] = useState({ status: CUSTD_HOSTED_APP_LOADING });
    const initialOptions = useRef(options);
    useEffect(() => watchHostedApp(() => startHostedApp(initialOptions.current), setState), []);
    const signIn = state.status === HOSTED_APP_STATUSES.ready ? state.app.signIn : undefined;
    return (_jsx(HostedAppContext.Provider, { value: state, children: signIn ? (_jsx(CustdSessionProvider, { client: signIn, onSignInComplete: onSignInComplete, children: children })) : (children) }));
}
/** The hosted app's state: loading, ready with its handle, or a typed error. */
export function useCustdHostedApp() {
    const state = useContext(HostedAppContext);
    if (!state)
        throw new Error("custd: useCustdHostedApp must be used inside CustdHostedAppProvider");
    return state;
}
/** The hosted app's state, or null outside `CustdHostedAppProvider`. */
export function useOptionalCustdHostedApp() {
    return useContext(HostedAppContext);
}
/**
 * Starts the app and reports its result while active. The returned cleanup
 * stops the app, including one that resolves after cleanup.
 */
export function watchHostedApp(start, onResult) {
    let active = true;
    const pending = start();
    void pending.then((result) => {
        if (active)
            onResult(result);
    });
    return () => {
        active = false;
        void pending.then((result) => {
            if (result.status === HOSTED_APP_STATUSES.ready)
                result.app.stop();
        });
    };
}
