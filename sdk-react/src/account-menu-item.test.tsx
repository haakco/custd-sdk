import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CustdAccountMenuItem } from "./account-menu-item.js";

it("renders a keyboard-native account link with same-tab navigation", () => {
  const account = { issuer: "https://auth.canvas.test/", applicationHome: "https://canvas.test/" };
  expect(renderToStaticMarkup(<CustdAccountMenuItem account={account} role="menuitem" />)).toBe(
    '<a role="menuitem" href="https://auth.canvas.test/settings" target="_self">Account settings</a>',
  );
});
