// `@haakco/custd-react/testing`: React wiring for the SDK's in-memory Custd.
import type { FakeCustd } from "@haakco/custd-sdk/testing";
import { CustdHostedAppProvider, type CustdHostedAppProviderProps } from "./hosted-app.js";

export type CustdFakeHostedAppProviderProps = Omit<CustdHostedAppProviderProps, "options"> & {
  /** The fake every hook under this provider reaches, with its own in-memory sign-in storage. */
  fake: FakeCustd;
};

/**
 * `CustdHostedAppProvider` started against a `FakeCustd`, so `useCustdHostedApp`, `useCustdSession`
 * and the app item hooks run in tests with no network. Sign a user in with `signInWithFake`.
 */
export function CustdFakeHostedAppProvider({ fake, ...props }: CustdFakeHostedAppProviderProps) {
  return <CustdHostedAppProvider {...props} options={fake.hostedAppOptions()} />;
}
