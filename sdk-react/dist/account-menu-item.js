import { jsx as _jsx } from "react/jsx-runtime";
import { openAppAccountSettings } from "@haakco/custd-sdk/browser";
import { useState } from "react";
/** Opens hosted account settings in the same tab, with a verified link back to this app. */
export function CustdAccountMenuItem({ issuer, accessToken, returnPath, onError, children, disabled, ...props }) {
    const [opening, setOpening] = useState(false);
    const open = async () => {
        setOpening(true);
        try {
            await openAppAccountSettings({ issuer, accessToken: await accessToken(), returnPath });
        }
        catch (error) {
            setOpening(false);
            onError?.(error);
        }
    };
    return (_jsx("button", { ...props, type: "button", disabled: disabled || opening, onClick: () => {
            void open();
        }, children: children ?? "Account settings" }));
}
