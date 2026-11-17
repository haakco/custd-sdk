import { type BrowserSignIn, type SignInError, type SignInSession, type SignInStartOptions, type SignInStatus, type SignOutOptions, type SignOutResult } from "@haakco/custd-sdk";
import { type ReactNode } from "react";
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
/** Restores the session on mount (completing a sign-in redirect) and shares the client. */
export declare function CustdSessionProvider({ client, children, onSignInComplete }: CustdSessionProviderProps): import("react").JSX.Element;
export declare function useCustdSession(): CustdSession;
