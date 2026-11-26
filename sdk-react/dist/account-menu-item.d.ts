import { type ComponentPropsWithoutRef } from "react";
export type CustdAccountMenuItemProps = Omit<ComponentPropsWithoutRef<"button">, "onClick" | "type"> & {
    /** The application's configured Custd issuer. */
    issuer: string;
    /** Returns the signed-in member's current application access token. */
    accessToken: () => string | Promise<string>;
    /** The page settings links back to, such as "/mine". Defaults to the application's home. */
    returnPath?: string;
    /** Called when the issuer refuses or cannot be reached; the button becomes usable again. */
    onError?: (error: unknown) => void;
};
/** Opens hosted account settings in the same tab, with a verified link back to this app. */
export declare function CustdAccountMenuItem({ issuer, accessToken, returnPath, onError, children, disabled, ...props }: CustdAccountMenuItemProps): import("react").JSX.Element;
