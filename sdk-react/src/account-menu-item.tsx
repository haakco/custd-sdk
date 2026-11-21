import { type AppAccountNavigationConfig, appAccountNavigation } from "@haakco/custd-sdk";
import type { ComponentPropsWithoutRef } from "react";

export type CustdAccountMenuItemProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "target" | "download"> & {
  account: AppAccountNavigationConfig;
};

export function CustdAccountMenuItem({ account, children, ...props }: CustdAccountMenuItemProps) {
  return (
    <a {...props} href={appAccountNavigation(account).settingsUrl} target="_self">
      {children ?? "Account settings"}
    </a>
  );
}
