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

it("uses explicit invoice-only consent and supports reading and cancelling the schedule", async () => {
  const calls: Array<{ method: string; path: string; body: unknown }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    const method = init?.method ?? "GET";
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Response.json({ enrollmentUuid: "enrollment", state: method === "DELETE" ? "cancelled" : "scheduled" });
  };
  const client = new CustdClient({ baseUrl: "https://store.example", getToken: () => "buyer-token", fetch: fetchImpl });
  await client.storefronts.scheduleUsageInvoice("shop", "enrollment", { invoiceOnlyAttested: true });
  await expect(client.storefronts.getUsageSchedule("shop", "enrollment")).resolves.toMatchObject({
    state: "scheduled",
  });
  await expect(client.storefronts.cancelUsageSchedule("shop", "enrollment")).resolves.toMatchObject({
    state: "cancelled",
  });
  const path = "/api/v1/storefronts/shop/usage-enrollments/enrollment/scheduled-issuance";
  expect(calls).toEqual([
    { method: "POST", path, body: { invoiceOnlyAttested: true } },
    { method: "GET", path, body: undefined },
    { method: "DELETE", path, body: undefined },
  ]);
});

it("uses separate seller and partner routes for settlement preferences", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ mode: "set_off" }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "partner-token",
    fetch: fetchImpl,
  });
  await client.storefronts.listBillingPartnerSellers({ after: "previous" });
  await client.storefronts.getSellerSettlementPreference("seller");
  await client.storefronts.getPartnerSettlementPreference("partner");
  await expect(
    client.storefronts.recordPartnerSettlementPreference("seller", { preferenceUuid: "revision", mode: "set_off" }),
  ).resolves.toMatchObject({ mode: "set_off" });
  const calls = fetchImpl.mock.calls.map(([url, init]) => [String(url), init?.method, init?.body]);
  const base = "https://store.example/api/v1/billing/partners";
  expect(calls).toEqual([
    [`${base}/sellers?after=previous`, "GET", undefined],
    [`${base}/sellers/seller/settlement-preference`, "GET", undefined],
    [`${base}/partner/settlement-preference`, "GET", undefined],
    [`${base}/sellers/seller/settlement-preference`, "POST", '{"preferenceUuid":"revision","mode":"set_off"}'],
  ]);
});

it("preserves an absent tax disclosure and sends explicit non-registration only to the seller route", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ sellerCompanyUuid: "seller", partnerCompanyUuid: "partner" }))
    .mockResolvedValueOnce(Response.json({ sellerCompanyUuid: "seller", partnerCompanyUuid: "partner" }))
    .mockResolvedValueOnce(Response.json({ status: "not_registered", jurisdiction: "ZA" }));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "partner-token",
    fetch: fetchImpl,
  });
  const selection = await client.storefronts.getSellerTaxDisclosure("seller");
  expect(selection.current).toBeUndefined();
  await client.storefronts.getPartnerTaxDisclosure("partner");
  await expect(
    client.storefronts.recordPartnerTaxDisclosure("seller", {
      disclosureUuid: "revision",
      status: "not_registered",
      jurisdiction: "ZA",
    }),
  ).resolves.toMatchObject({ status: "not_registered", jurisdiction: "ZA" });
  const base = "https://store.example/api/v1/billing/partners";
  expect(fetchImpl.mock.calls.map(([url, init]) => [String(url), init?.method, init?.body])).toEqual([
    [`${base}/sellers/seller/tax-disclosure`, "GET", undefined],
    [`${base}/partner/tax-disclosure`, "GET", undefined],
    [
      `${base}/sellers/seller/tax-disclosure`,
      "POST",
      '{"disclosureUuid":"revision","status":"not_registered","jurisdiction":"ZA"}',
    ],
  ]);
});

it("issues an invoice and applies set-off without calling the provider checkout", async () => {
  const amount = { currency: "ZAR", amountMinor: "9007199254740993" };
  const totals = { netTotal: amount, taxTotal: { ...amount, amountMinor: "0" }, grossTotal: amount };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ invoiceUuid: "invoice", status: "open", totals }))
    .mockResolvedValueOnce(Response.json({ eligible: true }))
    .mockResolvedValueOnce(Response.json({ setOffUuid: "set-off", amount }));
  const client = new CustdClient({ baseUrl: "https://store.example", getToken: () => "buyer-token", fetch: fetchImpl });
  await expect(client.storefronts.issueStorefrontInvoice("shop", "quote")).resolves.toMatchObject({ totals });
  await expect(client.storefronts.getStorefrontSetOffEligibility("shop", "invoice")).resolves.toEqual({
    eligible: true,
  });
  await expect(client.storefronts.applyStorefrontSetOff("shop", "invoice")).resolves.toMatchObject({ amount });
  const base = "https://store.example/api/v1/storefronts/shop";
  expect(fetchImpl.mock.calls.map(([url, init]) => [String(url), init?.method, init?.body])).toEqual([
    [`${base}/quotes/quote/invoice`, "POST", undefined],
    [`${base}/purchases/invoice/set-off`, "GET", undefined],
    [`${base}/purchases/invoice/set-off`, "POST", undefined],
  ]);
});

it("preserves exact payout amounts and uses the partner payout cursor", async () => {
  const amount = { currency: "ZAR", amountMinor: "9007199254740993" };
  const payout = { externalReference: "transfer", amount, paidAt: "2026-11-28T00:00:00Z" };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ payouts: [payout], nextBefore: "next" }))
    .mockResolvedValueOnce(Response.json(payout));
  const client = new CustdClient({
    baseUrl: "https://store.example",
    getToken: () => "seller-token",
    fetch: fetchImpl,
  });
  await expect(
    client.storefronts.listPartnerPayouts({ partnerCompanyUuid: "partner", before: "previous" }),
  ).resolves.toEqual({
    payouts: [payout],
    nextBefore: "next",
  });
  await expect(client.storefronts.recordPartnerPayout("partner", payout)).resolves.toEqual(payout);
  const path = "https://store.example/api/v1/billing/partners/partner/payouts";
  expect(fetchImpl.mock.calls.map(([url, init]) => [String(url), init?.method, init?.body])).toEqual([
    [`${path}?before=previous`, "GET", undefined],
    [path, "POST", JSON.stringify(payout)],
  ]);
});
