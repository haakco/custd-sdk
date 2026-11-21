// @vitest-environment jsdom

import { APP_ITEM_KINDS } from "@haakco/custd-sdk/browser";
import { FakeCustd } from "@haakco/custd-sdk/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAppItem } from "./app-items.js";
import { CustdFakeHostedAppProvider } from "./testing.js";

afterEach(cleanup);

function MeetingName({ token }: { token: string }) {
  const item = useAppItem(token);
  return <p>{item.status === "fresh" ? item.data.meeting?.name : item.status}</p>;
}

describe("CustdFakeHostedAppProvider", () => {
  it("serves the hosted app and its item hooks from the fake", async () => {
    const fake = new FakeCustd();
    const created = await fake.appItemsClient().createItem({
      kind: APP_ITEM_KINDS.meeting,
      meeting: { name: "Standup", blocks: [{ title: "Updates", predictedMs: 60_000 }] },
    });

    render(
      <CustdFakeHostedAppProvider fake={fake}>
        <MeetingName token={created.shareToken} />
      </CustdFakeHostedAppProvider>,
    );

    expect(await screen.findByText("Standup")).toBeTruthy();
    expect(fake.requests.some((request) => request.path === "/.well-known/custd.json")).toBe(true);
  });
});
