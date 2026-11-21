import { jsx as _jsx } from "react/jsx-runtime";
import { appAccountNavigation } from "@haakco/custd-sdk";
export function CustdAccountMenuItem({ account, children, ...props }) {
    return (_jsx("a", { ...props, href: appAccountNavigation(account).settingsUrl, target: "_self", children: children ?? "Account settings" }));
}
