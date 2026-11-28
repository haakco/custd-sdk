import type { RequestOptions } from "./index.js";

type StorefrontRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

/** An exact signed minor-unit count encoded as a decimal string. */
export type StorefrontMoney = { currency: string; amountMinor: string };

export type StorefrontUnitPrice = { currency: string; amount: string };

export type StorefrontPriceRevision = {
  priceRevisionUuid: string;
  revision: number;
  unitPrice: StorefrontUnitPrice;
  taxTreatment: string;
  taxRate: string;
  taxLabel: string;
  effectiveFrom: string;
};

export type StorefrontOffer = {
  offerUuid: string;
  name: string;
  billingInterval: string;
  priceRevision: StorefrontPriceRevision;
};

export type StorefrontCatalogue = { offers: StorefrontOffer[]; canPublish: boolean };

export type StorefrontPublishOffer = {
  offerUuid?: string;
  name: string;
  billingInterval: "" | "month";
  unitPrice: StorefrontUnitPrice;
  taxRate: string;
  taxLabel: string;
  effectiveFrom?: string;
};

export type StorefrontCartLine = {
  offerUuid: string;
  priceRevisionUuid: string;
  quantity: string;
};

export type StorefrontCart = {
  cartUuid: string;
  revision: number;
  status: "open" | "checked_out";
  currency: string;
  createdAt: string;
  lines: StorefrontCartLine[];
};

/** Set an exact decimal quantity. Use "0" to remove the line. */
export type StorefrontLineQuantity = { quantity: string };

export type StorefrontTotals = {
  netTotal: StorefrontMoney;
  taxTotal: StorefrontMoney;
  grossTotal: StorefrontMoney;
};

export type StorefrontTax = {
  label: string;
  rate: string;
  rounding: string;
  roundingPoint: string;
  amount: StorefrontMoney;
};

export type StorefrontServicePeriod = { start: string; endExclusive: string };

export type StorefrontQuoteLine = {
  lineNumber: number;
  offerUuid: string;
  priceRevisionUuid: string;
  description: string;
  quantity: string;
  unitPrice: StorefrontUnitPrice;
  extensionRounding: string;
  servicePeriod: StorefrontServicePeriod;
  netAmount: StorefrontMoney;
  tax: StorefrontTax;
  grossAmount: StorefrontMoney;
};

export type StorefrontQuote = {
  quoteUuid: string;
  cartUuid: string;
  cartRevision: number;
  issuedAt: string;
  expiresAt: string;
  lines: StorefrontQuoteLine[];
  totals: StorefrontTotals;
};

export type StorefrontInvoiceStatus = "open" | "paid";
export type StorefrontPaymentStatus = "pending" | "settled" | "failed";
export type StorefrontCheckoutState = "creating" | "ready" | "review_required";

export type StorefrontReceiptDelivery = {
  channel: string;
  notificationSourceKey: string;
  status: string;
};

export type StorefrontReceipt = {
  receiptUuid: string;
  receiptNumber: string;
  invoiceUuid: string;
  paymentUuid: string;
  issuedAt: string;
  amountReceived: StorefrontMoney;
  delivery: StorefrontReceiptDelivery;
};

export type StorefrontCreditNote = {
  creditNoteUuid: string;
  creditNoteNumber: string;
  totals: StorefrontTotals;
};

export type MerchantAccount = {
  accountUuid: string;
  sellerCompanyUuid: string;
  merchantId: string;
  mode: "test" | "live";
  revision: number;
  status: "active" | "revoked";
  refundsEnabled: boolean;
  businessTimeZone: string;
  updatedAt: string;
};

export type MerchantAccountResponse = { account?: MerchantAccount };

export type ConfigureMerchant = {
  merchantId: string;
  expectedRevision: number;
  businessTimeZone: string;
  refundsEnabled: boolean;
  checkoutSecretKey: string;
  paymentsReadToken: string;
};

export type RevokeMerchant = { expectedRevision: number };
export type VerifyMerchant = { appUuid: string; invoiceUuid: string };
export type VerifyMerchantResult = { verified: boolean };

export type StorefrontRefund = {
  refundUuid: string;
  status: "submitting" | "pending" | "succeeded" | "review_required";
  amount: StorefrontMoney;
};

export type StorefrontPurchase = {
  activationStatus?: "pending" | "applied" | "review_required";
  refund?: StorefrontRefund;
  invoiceUuid: string;
  invoiceNumber: string;
  status: StorefrontInvoiceStatus;
  totals: StorefrontTotals;
  checkoutState?: StorefrontCheckoutState;
  paymentStatus?: StorefrontPaymentStatus;
  paymentUrl?: string;
  receipt?: StorefrontReceipt;
  creditNote?: StorefrontCreditNote;
};

const merchantPath = "/billing/merchant";
const storefrontRegistryPath = "/billing/storefronts";

export type StorefrontBinding = {
  slug: string;
  sellerCompanyUuid: string;
  appUuid: string;
  createdAt: string;
};

export type OwnedStorefronts = {
  sellerCompanyUuid: string;
  storefronts: StorefrontBinding[];
};

export type RegisterStorefront = Pick<StorefrontBinding, "slug" | "appUuid">;

export type StorefrontReceiptTemplateSelection = { revision?: string; selectedAt?: string };

export type SelectStorefrontReceiptTemplate = { revision: string };

/** Browse a seller's offers and check out using the current buyer identity. */
export class StorefrontClient {
  constructor(private readonly request: StorefrontRequester) {}

  listOwnedStorefronts(options?: RequestOptions): Promise<OwnedStorefronts> {
    return this.request("GET", storefrontRegistryPath, undefined, options);
  }

  registerStorefront(input: RegisterStorefront, options?: RequestOptions): Promise<StorefrontBinding> {
    return this.request("POST", storefrontRegistryPath, input, options);
  }

  getReceiptTemplate(slug: string, options?: RequestOptions): Promise<StorefrontReceiptTemplateSelection> {
    return this.request("GET", `/billing${storefrontPath(slug, "receipt-template")}`, undefined, options);
  }

  selectReceiptTemplate(
    slug: string,
    input: SelectStorefrontReceiptTemplate,
    options?: RequestOptions,
  ): Promise<StorefrontReceiptTemplateSelection> {
    return this.request("PUT", `/billing${storefrontPath(slug, "receipt-template")}`, input, options);
  }

  getMerchant(options?: RequestOptions): Promise<MerchantAccountResponse> {
    return this.request("GET", merchantPath, undefined, options);
  }

  configureMerchant(input: ConfigureMerchant, options?: RequestOptions): Promise<MerchantAccountResponse> {
    return this.request("PUT", merchantPath, input, options);
  }

  revokeMerchant(input: RevokeMerchant, options?: RequestOptions): Promise<MerchantAccountResponse> {
    return this.request("DELETE", merchantPath, input, options);
  }

  verifyMerchant(input: VerifyMerchant, options?: RequestOptions): Promise<VerifyMerchantResult> {
    return this.request("POST", `${merchantPath}/test`, input, options);
  }

  listOffers(storefront: string, options?: RequestOptions): Promise<StorefrontCatalogue> {
    return this.request("GET", storefrontPath(storefront, "offers"), undefined, options);
  }

  publishOffer(storefront: string, offer: StorefrontPublishOffer, options?: RequestOptions): Promise<StorefrontOffer> {
    return this.request("POST", storefrontPath(storefront, "offers"), offer, options);
  }

  createCart(storefront: string, options?: RequestOptions): Promise<StorefrontCart> {
    return this.request("POST", storefrontPath(storefront, "carts"), undefined, options);
  }

  getCart(storefront: string, cartUuid: string, options?: RequestOptions): Promise<StorefrontCart> {
    return this.request("GET", storefrontPath(storefront, "carts", cartUuid), undefined, options);
  }

  updateLine(
    storefront: string,
    cartUuid: string,
    offerUuid: string,
    quantity: StorefrontLineQuantity,
    options?: RequestOptions,
  ): Promise<StorefrontCart> {
    return this.request(
      "PUT",
      storefrontPath(storefront, "carts", cartUuid, "lines", offerUuid),
      { quantity: quantity.quantity },
      options,
    );
  }

  async createQuote(storefront: string, cartUuid: string, options?: RequestOptions): Promise<StorefrontQuote> {
    return validateQuote(
      await this.request("POST", storefrontPath(storefront, "carts", cartUuid, "quotes"), undefined, options),
    );
  }

  async getQuote(storefront: string, quoteUuid: string, options?: RequestOptions): Promise<StorefrontQuote> {
    return validateQuote(
      await this.request("GET", storefrontPath(storefront, "quotes", quoteUuid), undefined, options),
    );
  }

  /** Start or resume the purchase for an accepted quote. */
  async checkout(storefront: string, quoteUuid: string, options?: RequestOptions): Promise<StorefrontPurchase> {
    return validatePurchase(
      await this.request("POST", storefrontPath(storefront, "quotes", quoteUuid, "checkout"), undefined, options),
    );
  }

  async getPurchase(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase> {
    return validatePurchase(
      await this.request("GET", storefrontPath(storefront, "purchases", invoiceUuid), undefined, options),
    );
  }

  /** Resume or retry payment for the same invoice. */
  async startPayment(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase> {
    return validatePurchase(
      await this.request("POST", storefrontPath(storefront, "purchases", invoiceUuid, "payment"), undefined, options),
    );
  }
}

function storefrontPath(...parts: string[]): string {
  const segments = parts.map((part) => {
    if (part === "" || part === "." || part === ".." || /[\\/]/.test(part)) {
      throw new Error("custd: invalid storefront path segment");
    }
    return encodeURIComponent(part);
  });
  return `/storefronts/${segments.join("/")}`;
}

function validateMoney(value: StorefrontMoney): void {
  if (
    typeof value?.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    typeof value.amountMinor !== "string" ||
    !/^(0|-?[1-9][0-9]{0,18})$/.test(value.amountMinor)
  ) {
    throw new Error("custd: invalid storefront money");
  }
  const amount = BigInt(value.amountMinor);
  if (amount < -9223372036854775808n || amount > 9223372036854775807n) {
    throw new Error("custd: storefront money overflows int64");
  }
}

function validateTotals(totals: StorefrontTotals): void {
  validateMoney(totals.netTotal);
  validateMoney(totals.taxTotal);
  validateMoney(totals.grossTotal);
}

function validateQuote(quote: StorefrontQuote): StorefrontQuote {
  validateTotals(quote.totals);
  for (const line of quote.lines) {
    validateMoney(line.netAmount);
    validateMoney(line.tax.amount);
    validateMoney(line.grossAmount);
  }
  return quote;
}

function validatePurchase(purchase: StorefrontPurchase): StorefrontPurchase {
  validateTotals(purchase.totals);
  if (purchase.receipt) {
    validateMoney(purchase.receipt.amountReceived);
  }
  if (purchase.refund) {
    validateMoney(purchase.refund.amount);
  }
  if (purchase.creditNote) {
    validateTotals(purchase.creditNote.totals);
  }
  return purchase;
}
