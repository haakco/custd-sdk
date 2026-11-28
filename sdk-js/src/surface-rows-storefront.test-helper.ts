import { readFileSync } from "node:fs";
import type { StorefrontPurchase } from "./storefront.js";
import { dto, type RowArea } from "./surface-conformance.test-helper.js";

const root = "/api/v1/storefronts/{storefront}";
const purchase = JSON.parse(
  readFileSync(new URL("../../contract-fixtures/storefront-purchase.json", import.meta.url), "utf8"),
) as StorefrontPurchase;
const quote = { quoteUuid: "quote-1", lines: [], totals: purchase.totals };
const creditNote = { creditNoteUuid: "note-1", creditNoteNumber: "CRN-1", totals: purchase.totals };

const amount = purchase.totals.grossTotal;

export const storefrontRows: RowArea = {
  rows: [
    {
      id: `billing GET ${root}/offers`,
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.listOffers("shop"),
    },
    {
      id: `billing POST ${root}/offers`,
      params: { storefront: "shop" },
      call: (c) =>
        c.custd.storefronts.publishOffer("shop", {
          name: "Starter",
          billingInterval: "month",
          unitPrice: { currency: "ZAR", amount: "15.25" },
          taxRate: "0.15",
          taxLabel: "VAT",
        }),
    },
    {
      id: `billing POST ${root}/carts`,
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.createCart("shop"),
    },
    {
      id: `billing GET ${root}/carts/{cart}`,
      params: { storefront: "shop", cart: "cart-1" },
      call: (c) => c.custd.storefronts.getCart("shop", "cart-1"),
    },
    {
      id: `billing PUT ${root}/carts/{cart}/lines/{offer}`,
      params: { storefront: "shop", cart: "cart-1", offer: "offer-1" },
      call: (c) => c.custd.storefronts.updateLine("shop", "cart-1", "offer-1", { quantity: "2.50" }),
    },
    {
      id: `billing POST ${root}/carts/{cart}/quotes`,
      params: { storefront: "shop", cart: "cart-1" },
      call: (c) => c.custd.storefronts.createQuote("shop", "cart-1"),
      response: () => Response.json(quote),
    },
    {
      id: `billing GET ${root}/quotes/{quote}`,
      params: { storefront: "shop", quote: "quote-1" },
      call: (c) => c.custd.storefronts.getQuote("shop", "quote-1"),
      response: () => Response.json(quote),
    },
    {
      id: `billing POST ${root}/quotes/{quote}/checkout`,
      params: { storefront: "shop", quote: "quote-1" },
      call: (c) => c.custd.storefronts.checkout("shop", "quote-1"),
      response: () => Response.json(purchase),
    },
    {
      id: `billing GET ${root}/purchases/{invoice}`,
      params: { storefront: "shop", invoice: "invoice-1" },
      call: (c) => c.custd.storefronts.getPurchase("shop", "invoice-1"),
      response: () => Response.json(purchase),
    },
    {
      id: `billing POST ${root}/purchases/{invoice}/payment`,
      params: { storefront: "shop", invoice: "invoice-1" },
      call: (c) => c.custd.storefronts.startPayment("shop", "invoice-1"),
      response: () => Response.json(purchase),
    },
    {
      id: `billing POST ${root}/invoices/{invoice}/credit-note`,
      params: { storefront: "shop", invoice: "invoice-1" },
      call: (c) => c.custd.storefronts.issueCreditNote("shop", "invoice-1", { reason: "Duplicate sale" }),
      response: () => Response.json(creditNote),
    },
    {
      id: "billing DELETE /api/v1/billing/merchant",
      call: (c) => c.custd.storefronts.revokeMerchant(dto()),
    },
    {
      id: "billing DELETE /api/v1/billing/storefronts/{storefront}/analytics-destination",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.disableAnalyticsDestination("shop"),
    },
    {
      id: "billing DELETE /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
      params: { storefront: "shop", enrollment: "enrollment" },
      call: (c) => c.custd.storefronts.cancelUsageSchedule("shop", "enrollment"),
    },
    {
      id: "billing GET /api/v1/billing/accounting-export",
      query: { month: "2026-11", businessTimeZone: "UTC" },
      call: (c) => c.custd.storefronts.readAccountingExport({ month: "2026-11", businessTimeZone: "UTC" }),
    },
    {
      id: "billing GET /api/v1/billing/merchant",
      call: (c) => c.custd.storefronts.getMerchant(),
    },
    {
      id: "billing GET /api/v1/billing/partners",
      call: (c) => c.custd.storefronts.listBillingPartners(dto()),
    },
    {
      id: "billing GET /api/v1/billing/partners/referral-reviews",
      call: (c) => c.custd.storefronts.listReferralReviews(dto()),
    },
    {
      id: "billing GET /api/v1/billing/partners/sellers",
      call: (c) => c.custd.storefronts.listBillingPartnerSellers(dto()),
    },
    {
      id: "billing GET /api/v1/billing/partners/sellers/{seller}/settlement-preference",
      params: { seller: "seller" },
      call: (c) => c.custd.storefronts.getSellerSettlementPreference("seller"),
    },
    {
      id: "billing GET /api/v1/billing/partners/sellers/{seller}/tax-disclosure",
      params: { seller: "seller" },
      call: (c) => c.custd.storefronts.getSellerTaxDisclosure("seller"),
    },
    {
      id: "billing GET /api/v1/billing/partners/{partner}/fee-balance",
      params: { partner: "partner" },
      query: { asOf: "2026-11-01" },
      call: (c) => c.custd.storefronts.getPartnerFeeBalance("partner", { asOf: "2026-11-01" }),
    },
    {
      id: "billing GET /api/v1/billing/partners/{partner}/payouts",
      params: { partner: "partner" },
      call: (c) => c.custd.storefronts.listPartnerPayouts({ partnerCompanyUuid: "partner" }),
      response: () => Response.json({ payouts: [] }),
    },
    {
      id: "billing GET /api/v1/billing/partners/{partner}/referral-terms",
      params: { partner: "partner" },
      call: (c) => c.custd.storefronts.listPartnerReferralTerms("partner", dto()),
    },
    {
      id: "billing GET /api/v1/billing/partners/{partner}/settlement-preference",
      params: { partner: "partner" },
      call: (c) => c.custd.storefronts.getPartnerSettlementPreference("partner"),
    },
    {
      id: "billing GET /api/v1/billing/partners/{partner}/tax-disclosure",
      params: { partner: "partner" },
      call: (c) => c.custd.storefronts.getPartnerTaxDisclosure("partner"),
    },
    {
      id: "billing GET /api/v1/billing/storefronts",
      call: (c) => c.custd.storefronts.listOwnedStorefronts(),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/analytics-destination",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.getAnalyticsDestination("shop"),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/invoices",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.listSellerInvoices({ storefront: "shop" }),
      response: () => Response.json({ invoices: [] }),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms",
      params: { storefront: "shop", offer: "offer" },
      call: (c) => c.custd.storefronts.listPartnerProductTerms({ storefront: "shop", offerUuid: "offer" }),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/partners/{partner}/statement",
      params: { storefront: "shop", partner: "partner" },
      query: { month: "2026-11" },
      call: (c) =>
        c.custd.storefronts.getPartnerStatement({
          storefront: "shop",
          partnerCompanyUuid: "partner",
          month: "2026-11",
        }),
      response: () => Response.json({ movements: [] }),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}",
      params: { storefront: "shop", handoff: "handoff" },
      call: (c) => c.custd.storefronts.getPurchaseHandoff("shop", "handoff"),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing GET /api/v1/billing/storefronts/{storefront}/receipt-template",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.getReceiptTemplate("shop"),
    },
    {
      id: "billing GET /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off",
      params: { storefront: "shop", invoice: "invoice" },
      call: (c) => c.custd.storefronts.getStorefrontSetOffEligibility("shop", "invoice"),
    },
    {
      id: "billing GET /api/v1/storefronts/{storefront}/usage-enrollments",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.listUsageEnrollments({ storefront: "shop" }),
    },
    {
      id: "billing GET /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
      params: { storefront: "shop", enrollment: "enrollment" },
      call: (c) => c.custd.storefronts.getUsageSchedule("shop", "enrollment"),
    },
    {
      id: "billing GET /api/v1/storefronts/{storefront}/usage-tariffs",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.listUsageTariffs({ storefront: "shop" }),
    },
    {
      id: "billing GET /api/v1/storefronts/{storefront}/usage-tariffs/{revision}",
      params: { storefront: "shop", revision: "revision" },
      call: (c) => c.custd.storefronts.getUsageTariff("shop", "revision"),
    },
    {
      id: "billing POST /api/v1/billing/merchant/test",
      call: (c) => c.custd.storefronts.verifyMerchant(dto()),
    },
    {
      id: "billing POST /api/v1/billing/partners/invitations",
      call: (c) => c.custd.storefronts.createBillingPartnerInvitation(),
    },
    {
      id: "billing POST /api/v1/billing/partners/invitations/accept",
      call: (c) => c.custd.storefronts.acceptBillingPartnerInvitation(dto()),
    },
    {
      id: "billing POST /api/v1/billing/partners/referral-reviews/{attribution}/retry",
      params: { attribution: "attribution" },
      call: (c) => c.custd.storefronts.retryReferralReview("attribution"),
    },
    {
      id: "billing POST /api/v1/billing/partners/sellers/{seller}/settlement-preference",
      params: { seller: "seller" },
      call: (c) => c.custd.storefronts.recordPartnerSettlementPreference("seller", dto()),
    },
    {
      id: "billing POST /api/v1/billing/partners/sellers/{seller}/tax-disclosure",
      params: { seller: "seller" },
      call: (c) => c.custd.storefronts.recordPartnerTaxDisclosure("seller", dto()),
    },
    {
      id: "billing POST /api/v1/billing/partners/{partner}/payouts",
      params: { partner: "partner" },
      call: (c) =>
        c.custd.storefronts.recordPartnerPayout("partner", {
          externalReference: "settlement",
          paidAt: "2026-11-01T00:00:00Z",
          amount,
        }),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/billing/partners/{partner}/referral-terms",
      params: { partner: "partner" },
      call: (c) => c.custd.storefronts.publishPartnerReferralTerms("partner", dto()),
    },
    {
      id: "billing POST /api/v1/billing/storefronts",
      call: (c) => c.custd.storefronts.registerStorefront(dto()),
    },
    {
      id: "billing POST /api/v1/billing/storefronts/{storefront}/capacity-offers",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.publishCapacityOffer("shop", dto()),
    },
    {
      id: "billing POST /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms",
      params: { storefront: "shop", offer: "offer" },
      call: (c) => c.custd.storefronts.publishPartnerProductTerms("shop", "offer", dto()),
    },
    {
      id: "billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs",
      params: { storefront: "shop" },
      call: (c) =>
        c.custd.storefronts.createPurchaseHandoff("shop", { orderReference: "order", offerUuid: "offer", amount }),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}/cancel",
      params: { storefront: "shop", handoff: "handoff" },
      call: (c) => c.custd.storefronts.cancelPurchaseHandoff("shop", "handoff"),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund",
      params: { storefront: "shop", invoice: "invoice" },
      call: (c) => c.custd.storefronts.requestRefund("shop", "invoice", dto()),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund/reconcile",
      params: { storefront: "shop", invoice: "invoice" },
      call: (c) => c.custd.storefronts.reconcileRefund("shop", "invoice"),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/purchase-handoffs/{handoff}/redeem",
      params: { storefront: "shop", handoff: "handoff" },
      call: (c) => c.custd.storefronts.redeemPurchaseHandoff("shop", "handoff"),
      response: () => Response.json(quote),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off",
      params: { storefront: "shop", invoice: "invoice" },
      call: (c) => c.custd.storefronts.applyStorefrontSetOff("shop", "invoice"),
      response: () => Response.json({ amount }),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/quotes/{quote}/invoice",
      params: { storefront: "shop", quote: "quote" },
      call: (c) => c.custd.storefronts.issueStorefrontInvoice("shop", "quote"),
      response: () => Response.json(purchase),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/usage-enrollments",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.enrollUsage("shop", dto()),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/issue",
      params: { storefront: "shop", enrollment: "enrollment" },
      call: (c) => c.custd.storefronts.issueUsageInvoice("shop", "enrollment"),
      response: () =>
        Response.json({
          status: "no_amount_due",
          usage: { line: { quantity: "0", windows: [], netAmount: amount, taxAmount: amount, grossAmount: amount } },
        }),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
      params: { storefront: "shop", enrollment: "enrollment" },
      call: (c) => c.custd.storefronts.scheduleUsageInvoice("shop", "enrollment", dto()),
    },
    {
      id: "billing POST /api/v1/storefronts/{storefront}/usage-tariffs",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.publishUsageTariff("shop", dto()),
    },
    {
      id: "billing PUT /api/v1/billing/merchant",
      call: (c) => c.custd.storefronts.configureMerchant(dto()),
    },
    {
      id: "billing PUT /api/v1/billing/storefronts/{storefront}/analytics-destination",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.selectAnalyticsDestination("shop", dto()),
    },
    {
      id: "billing PUT /api/v1/billing/storefronts/{storefront}/receipt-template",
      params: { storefront: "shop" },
      call: (c) => c.custd.storefronts.selectReceiptTemplate("shop", dto()),
    },
  ],
  decoded: [],
};
