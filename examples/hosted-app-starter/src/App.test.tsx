import { CustdFakeHostedAppProvider } from "@haakco/custd-react/testing";
import { FakeCustd } from "@haakco/custd-sdk/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";
import { counterRequest } from "./CreateCounter";

test("the owner adds three measurements, sees the forecast and gets a share link", async () => {
  const fake = new FakeCustd({ capabilities: ["app_data"] });
  const created = await fake.appItemsClient().createItem(counterRequest("Pages read", 100));
  window.history.pushState(null, "", `/edit/c#${created.ownerToken}`);
  render(
    <CustdFakeHostedAppProvider fake={fake}>
      <App />
    </CustdFakeHostedAppProvider>,
  );

  await screen.findByRole("heading", { level: 1, name: "Pages read" });
  for (const value of ["10", "20", "30"]) {
    fireEvent.change(screen.getByLabelText("Count now"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Add measurement" }));
    await screen.findByText(`Saved ${value}.`);
  }
  expect(await screen.findByText(/Based on 3 measurements/)).toBeTruthy();
  expect(screen.getByText(/Likely reaches the target between/)).toBeTruthy();

  // Created outside this browser, so the share token was never stored here: make a new one.
  fireEvent.click(screen.getByRole("button", { name: "Make a new share link" }));
  const link = (await screen.findByLabelText("Read-only link")) as HTMLInputElement;
  expect(link.value).toMatch(/^http:\/\/localhost(:\d+)?\/c\/[A-Za-z0-9_-]{43}$/);
});
