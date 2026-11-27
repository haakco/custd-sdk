import { expect, it, vi } from "vitest";
import { CustdClient } from "./index.js";

it("uses buyer authorization and preserves server-issued minor-unit strings", async () => {
  const money = { currency: "ZAR", amountMinor: "9007199254740993" };
  const totals = { netTotal: money, taxTotal: money, grossTotal: money };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ cartUuid: "cart", lines: [{ offerUuid: "offer", quantity: "1.25" }] }))
    .mockResolvedValueOnce(Response.json({ invoiceUuid: "invoice", status: "open", paymentStatus: "pending", totals }))
    .mockResolvedValueOnce(
      Response.json({
        totals: { ...totals, grossTotal: { currency: "ZAR", amountMinor: 1 } },
      }),
    );
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "buyer-token",
    fetch: fetchImpl,
  });
  const storefront = "https://store.example/api/v1/storefronts/custd";

  const cart = await client.storefronts.updateLine("custd", "cart", "offer", { quantity: "1.25" });
  expect(cart.lines[0].quantity).toBe("1.25");
  const purchase = await client.storefronts.startPayment("custd", "invoice");
  expect(purchase.totals.grossTotal).toEqual(money);

  expect(fetchImpl).toHaveBeenNthCalledWith(
    1,
    `${storefront}/carts/cart/lines/offer`,
    expect.objectContaining({
      method: "PUT",
      headers: expect.objectContaining({ Authorization: "Bearer buyer-token" }),
      body: '{"quantity":"1.25"}',
    }),
  );
  expect(fetchImpl).toHaveBeenNthCalledWith(
    2,
    `${storefront}/purchases/invoice/payment`,
    expect.objectContaining({ method: "POST", body: undefined }),
  );
  await expect(client.storefronts.getPurchase("custd", "invoice")).rejects.toThrow("invalid storefront money");
  await expect(client.storefronts.getPurchase("..", "invoice")).rejects.toThrow("invalid storefront path segment");
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
