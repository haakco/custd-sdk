import { expect, it, vi } from "vitest";
import { CustdClient } from "./index.js";

it("registers a storefront using the authenticated seller", async () => {
  const binding = { slug: "shop", appUuid: "app", sellerCompanyUuid: "seller", createdAt: "2026-11-28T00:00:00Z" };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ sellerCompanyUuid: "seller", storefronts: [] }))
    .mockResolvedValueOnce(Response.json(binding))
    .mockResolvedValueOnce(Response.json({ revision: "fixture" }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  const registry = "https://store.example/api/v1/billing/storefronts";

  await expect(client.storefronts.listOwnedStorefronts()).resolves.toMatchObject({ sellerCompanyUuid: "seller" });
  await expect(client.storefronts.registerStorefront({ slug: "shop", appUuid: "app" })).resolves.toEqual(binding);
  await expect(client.storefronts.selectReceiptTemplate("shop", { revision: "fixture" })).resolves.toEqual({
    revision: "fixture",
  });
  expect(fetchImpl).toHaveBeenNthCalledWith(1, registry, expect.objectContaining({ method: "GET" }));
  expect(fetchImpl).toHaveBeenNthCalledWith(
    2,
    registry,
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer seller-token" }),
      body: '{"slug":"shop","appUuid":"app"}',
    }),
  );
  expect(fetchImpl).toHaveBeenNthCalledWith(
    3,
    `${registry}/shop/receipt-template`,
    expect.objectContaining({ method: "PUT", body: '{"revision":"fixture"}' }),
  );
});

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

it("scopes merchant revocation and payment verification to the authenticated account", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ account: { status: "revoked", revision: 8 } }))
    .mockResolvedValueOnce(Response.json({ verified: true }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  const merchant = "https://store.example/api/v1/billing/merchant";

  await expect(client.storefronts.revokeMerchant({ expectedRevision: 7 })).resolves.toMatchObject({
    account: { status: "revoked", revision: 8 },
  });
  await expect(client.storefronts.verifyMerchant({ appUuid: "app", invoiceUuid: "invoice" })).resolves.toEqual({
    verified: true,
  });
  expect(fetchImpl).toHaveBeenNthCalledWith(
    1,
    merchant,
    expect.objectContaining({
      method: "DELETE",
      headers: expect.objectContaining({ Authorization: "Bearer seller-token" }),
      body: '{"expectedRevision":7}',
    }),
  );
  expect(fetchImpl).toHaveBeenNthCalledWith(
    2,
    `${merchant}/test`,
    expect.objectContaining({
      method: "POST",
      body: '{"appUuid":"app","invoiceUuid":"invoice"}',
    }),
  );
});
