import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CustdAccountMenuItem } from "./account-menu-item.js";

it("renders a keyboard-native button that opens settings without navigating by itself", () => {
  expect(
    renderToStaticMarkup(
      <CustdAccountMenuItem
        issuer="https://auth.canvas.test"
        accessToken={() => "t"}
        returnPath="/mine"
        role="menuitem"
      />,
    ),
  ).toBe('<button role="menuitem" type="button">Account settings</button>');
});
