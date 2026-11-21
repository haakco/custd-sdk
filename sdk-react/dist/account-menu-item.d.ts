import { type AppAccountNavigationConfig } from "@haakco/custd-sdk";
import type { ComponentPropsWithoutRef } from "react";
export type CustdAccountMenuItemProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "target" | "download"> & {
    account: AppAccountNavigationConfig;
};
export declare function CustdAccountMenuItem({ account, children, ...props }: CustdAccountMenuItemProps): import("react").JSX.Element;
