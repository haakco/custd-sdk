import { expect, it, vi } from "vitest";
import { CustdClient } from "./index.js";

it("keeps the certified usage quantity and no-amount-due outcome exact", async () => {
  const zero = { currency: "ZAR", amountMinor: "0" };
  const quantity = "9007199254740993";
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
    Response.json({
      status: "no_amount_due",
      usage: {
        enrollmentUuid: "enrollment",
        line: { quantity, windows: [], netAmount: zero, taxAmount: zero, grossAmount: zero },
      },
    }),
  );
  const client = new CustdClient({ baseUrl: "https://store.example", getToken: () => "buyer-token", fetch: fetchImpl });
  await expect(client.storefronts.issueUsageInvoice("shop", "enrollment")).resolves.toMatchObject({
    status: "no_amount_due",
    usage: { line: { quantity } },
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    "https://store.example/api/v1/storefronts/shop/usage-enrollments/enrollment/issue",
    expect.objectContaining({ method: "POST", body: undefined }),
  );
});

it("lists seller invoices with the previous page cursor", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ invoices: [], nextBefore: "next" }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  await expect(client.storefronts.listSellerInvoices({ storefront: "shop", before: "previous" })).resolves.toEqual({
    invoices: [],
    nextBefore: "next",
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    "https://store.example/api/v1/billing/storefronts/shop/invoices?before=previous",
    expect.objectContaining({ method: "GET" }),
  );
});

it("encodes the partner statement cursor and validates negative exact amounts", async () => {
  const delta = { currency: "ZAR", amountMinor: "-9007199254740993" };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json({ movements: [{ partnerDelta: delta, sellerCutDelta: delta }] }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  const result = await client.storefronts.getPartnerStatement({
    storefront: "shop",
    partnerCompanyUuid: "partner",
    month: "2026-12",
    cursor: "2026-12-01/entry",
  });
  expect(result.movements[0].partnerDelta).toEqual(delta);
  expect(fetchImpl).toHaveBeenCalledWith(
    "https://store.example/api/v1/billing/storefronts/shop/partners/partner/statement?month=2026-12&cursor=2026-12-01%2Fentry",
    expect.objectContaining({ method: "GET" }),
  );
});

it("uses the seller's invoice routes and preserves exact adjustment amounts", async () => {
  const amount = { currency: "ZAR", amountMinor: "9007199254740993" };
  const totals = { netTotal: amount, taxTotal: amount, grossTotal: amount };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json({ refundUuid: "refund", creditNoteUuid: "credit", amount, totals }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  const endpoint = "https://store.example/api/v1/storefronts/shop/invoices/invoice/refund";
  await expect(client.storefronts.requestRefund("shop", "invoice", { reason: "Cancelled" })).resolves.toMatchObject({
    amount,
  });
  await expect(client.storefronts.reconcileRefund("shop", "invoice")).resolves.toMatchObject({ amount });
  await expect(client.storefronts.issueCreditNote("shop", "invoice", { reason: "Cancelled" })).resolves.toMatchObject({
    totals,
  });
  expect(fetchImpl).toHaveBeenNthCalledWith(
    1,
    endpoint,
    expect.objectContaining({ method: "POST", body: '{"reason":"Cancelled"}' }),
  );
  expect(fetchImpl).toHaveBeenNthCalledWith(
    2,
    `${endpoint}/reconcile`,
    expect.objectContaining({ method: "POST", body: undefined }),
  );
  expect(fetchImpl).toHaveBeenNthCalledWith(
    3,
    "https://store.example/api/v1/storefronts/shop/invoices/invoice/credit-note",
    expect.objectContaining({ method: "POST", body: '{"reason":"Cancelled"}' }),
  );
});

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
