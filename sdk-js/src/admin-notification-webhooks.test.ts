import { expect, it, vi } from "vitest";
import { CustdClient } from "./index.js";

it("retains typed Hosting submission acceptance in the delivery status", async () => {
  const hostingAcceptance = {
    messageId: "0193a000-0000-7000-8000-000000000080",
    acceptedAt: "2026-11-28T12:30:00Z",
    recipientIds: ["recipient-fixture"],
  };
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ state: "sent", hostingAcceptance }));
  const client = new CustdClient({ baseUrl: "https://store.example", getToken: () => "admin-token", fetch: fetchImpl });
  const status = await client.admin.webhooks.getDelivery("delivery", "acme");
  expect(status.hostingAcceptance).toEqual(hostingAcceptance);
});
