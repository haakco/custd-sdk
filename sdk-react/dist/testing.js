import { jsx as _jsx } from "react/jsx-runtime";
import { CustdHostedAppProvider } from "./hosted-app.js";
/**
 * `CustdHostedAppProvider` started against a `FakeCustd`, so `useCustdHostedApp`, `useCustdSession`
 * and the app item hooks run in tests with no network. Sign a user in with `signInWithFake`.
 */
export function CustdFakeHostedAppProvider({ fake, ...props }) {
    return _jsx(CustdHostedAppProvider, { ...props, options: fake.hostedAppOptions() });
}
