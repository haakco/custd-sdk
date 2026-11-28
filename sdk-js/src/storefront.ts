import type { RequestOptions } from "./index.js";
import type {
  EnrollUsageRequest,
  InvoiceNotice,
  IssueUsageResult,
  PublishUsageTariffRequest,
  StorefrontUsagePageRequest,
  UsageCertificate,
  UsageEnrollment,
  UsageEnrollmentPage,
  UsageInvoiceOptIn,
  UsageSchedule,
  UsageTariffPage,
  UsageTariffRevision,
} from "./storefront-usage.js";

export type * from "./storefront-usage.js";

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

/** Platforms may configure per-unit capacity that buyers can read on an offer. */
export type StorefrontDataSpaceCapacity = {
  extraSpacesPerUnit: number;
  extraProducersPerSpacePerUnit: number;
};

export type StorefrontOffer = {
  dataSpaceCapacity?: StorefrontDataSpaceCapacity;
  complementaryForOfferUuid?: string;
  offerUuid: string;
  name: string;
  billingInterval: string;
  priceRevision: StorefrontPriceRevision;
};

export type StorefrontCatalogue = { offers: StorefrontOffer[]; canPublish: boolean };

export type StorefrontPublishOffer = {
  /** Omit to preserve the relationship, or pass an empty string to clear it. */
  complementaryForOfferUuid?: string;
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
  invoiceUuid?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  issuedAt?: string;
  status?: string;
  billTo?: StorefrontBillingContact;
  sellerName?: string;
  reason?: string;
  lines?: StorefrontQuoteLine[];
  totals: StorefrontTotals;
};

export type StorefrontBillingContact = {
  companyUuid: string;
  name: string;
  email: string;
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
  invoiceUuid?: string;
  paymentUuid?: string;
  requestedAt?: string;
  processedAt?: string;
};

export type StorefrontAdjustmentRequest = { reason: string };

export type SellerInvoiceListRequest = { storefront: string; before?: string };

export type SellerInvoiceList = { invoices: SellerInvoiceItem[]; nextBefore?: string };

export type SellerInvoiceItem = {
  invoiceUuid: string;
  invoiceNumber: string;
  issuedAt: string;
  totals: StorefrontTotals;
  status: StorefrontInvoiceStatus;
  paymentStatus?: StorefrontPaymentStatus;
  checkoutState?: StorefrontCheckoutState;
  refundStatus?: StorefrontRefund["status"];
  creditNoteUuid?: string;
};

export type StorefrontPartnerStatementRequest = {
  storefront: string;
  partnerCompanyUuid: string;
  month: string;
  cursor?: string;
};

export type StorefrontPartnerStatement = {
  sellerCompanyUuid: string;
  appUuid: string;
  partnerCompanyUuid: string;
  month: string;
  movements: StorefrontPartnerMovement[];
  nextCursor?: string;
};

export type StorefrontPartnerMovement = {
  movementUuid: string;
  kind: "accrual" | "reversal";
  originalMovementUuid?: string;
  termsUuid: string;
  buyerCompanyUuid: string;
  invoiceUuid: string;
  paymentUuid: string;
  lineNumber: number;
  postedOn: string;
  availableOn: string;
  partnerDelta: StorefrontMoney;
  sellerCutDelta: StorefrontMoney;
  earning?: StorefrontPartnerEarning;
};

export type StorefrontPartnerEarning = {
  gross: StorefrontMoney;
  tax: StorefrontMoney;
  net: StorefrontMoney;
  costToProvide: StorefrontMoney;
  remainder: StorefrontMoney;
};

export type StorefrontSetOff = {
  setOffUuid: string;
  invoiceUuid: string;
  amount: StorefrontMoney;
  appliedAt: string;
  appliedOn: string;
  preferenceUuid: string;
  taxDisclosureUuid: string;
  reversal?: { creditNoteUuid: string; reversedAt: string };
};

export type StorefrontSetOffEligibility = { eligible: boolean };

export type StorefrontPurchase = {
  invoiceNotice?: InvoiceNotice;
  setOff?: StorefrontSetOff;
  usage?: UsageCertificate;
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

export type CreateStorefrontPurchaseHandoff = {
  orderReference: string;
  offerUuid: string;
  amount: StorefrontMoney;
};

export type StorefrontPurchaseHandoff = {
  handoffUuid: string;
  orderReference: string;
  offerUuid: string;
  amount: StorefrontMoney;
  checkoutPath: string;
  expiresAt: string;
  invoiceUuid?: string;
  settled: boolean;
  cancelled?: boolean;
};

const merchantPath = "/billing/merchant";
const storefrontRegistryPath = "/billing/storefronts";
const billingPartnersPath = "/billing/partners";

export type BillingPartner = { partnerCompanyUuid: string; name: string; active: boolean };
export type BillingPartnerPageRequest = { after?: string };
export type BillingPartnerPage = { partners: BillingPartner[]; nextAfter?: string };
export type BillingPartnerSeller = { sellerCompanyUuid: string; name: string; active: boolean };
export type BillingPartnerSellerPage = { sellers: BillingPartnerSeller[]; nextAfter?: string };
export type PartnerSettlementMode = "payout" | "set_off";
export type PartnerSettlementPreference = {
  preferenceUuid: string;
  mode: PartnerSettlementMode;
  effectiveFrom: string;
  recordedAt: string;
};
export type PartnerSettlementSelection = {
  sellerCompanyUuid: string;
  partnerCompanyUuid: string;
  current?: PartnerSettlementPreference;
  next?: PartnerSettlementPreference;
};
export type RecordPartnerSettlementPreferenceRequest = {
  preferenceUuid: string;
  mode: PartnerSettlementMode;
  effectiveFrom?: string;
};
export type RecordPartnerTaxDisclosureRequest = {
  disclosureUuid: string;
  status: "registered" | "not_registered";
  jurisdiction: string;
  registrationNumber?: string;
  effectiveFrom?: string;
};
export type PartnerTaxDisclosure = RecordPartnerTaxDisclosureRequest & {
  effectiveFrom: string;
  recordedAt: string;
};
export type PartnerTaxDisclosureSelection = {
  sellerCompanyUuid: string;
  partnerCompanyUuid: string;
  current?: PartnerTaxDisclosure;
  next?: PartnerTaxDisclosure;
};
export type RecordPartnerPayoutRequest = {
  externalReference: string;
  amount: StorefrontMoney;
  paidAt: string;
};
export type PartnerPayout = RecordPartnerPayoutRequest & {
  payoutUuid: string;
  partnerCompanyUuid: string;
  paidOn: string;
  recordedAt: string;
  preferenceUuid: string;
  taxDisclosureUuid: string;
};
export type PartnerPayoutPageRequest = { partnerCompanyUuid: string; before?: string };
export type PartnerPayoutPage = { payouts: PartnerPayout[]; nextBefore?: string };
export type BillingPartnerInvitation = { code: string; expiresAt: string };
export type AcceptBillingPartnerInvitationRequest = { code: string };
export type AcceptedBillingPartnerInvitation = { sellerCompanyName: string };

export type PublishPartnerProductTermsRequest = {
  partnerCompanyUuid: string;
  effectiveFrom: string;
  agreementDate: string;
  agreementReference: string;
  signedAgreementAttested: boolean;
  unitCost: string;
  sellerCut: string;
};

export type PartnerProductTermsVersion = PublishPartnerProductTermsRequest & {
  termsUuid: string;
  recordedByUserUuid: string;
  currency: string;
  holdDays: number;
};

export type PartnerProductTermsPageRequest = { storefront: string; offerUuid: string; before?: string };
export type PartnerProductTermsPage = { versions: PartnerProductTermsVersion[]; nextBefore?: string };

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

/** The seller's analytics site selection and delivery state. */
export type StorefrontAnalyticsDestination = { siteUuid?: string; enabled: boolean };

export type SelectStorefrontAnalyticsDestination = { siteUuid: string };

/** Browse a seller's offers and check out using the current buyer identity. */
export class StorefrontClient {
  constructor(private readonly request: StorefrontRequester) {}

  async createPurchaseHandoff(
    storefront: string,
    input: CreateStorefrontPurchaseHandoff,
    options?: RequestOptions,
  ): Promise<StorefrontPurchaseHandoff> {
    validateMoney(input.amount);
    const handoff = await this.request<StorefrontPurchaseHandoff>(
      "POST",
      `/billing${storefrontPath(storefront, "purchase-handoffs")}`,
      input,
      options,
    );
    validateMoney(handoff.amount);
    return handoff;
  }

  async getPurchaseHandoff(
    storefront: string,
    handoffUuid: string,
    options?: RequestOptions,
  ): Promise<StorefrontPurchaseHandoff> {
    const handoff = await this.request<StorefrontPurchaseHandoff>(
      "GET",
      `/billing${storefrontPath(storefront, "purchase-handoffs", handoffUuid)}`,
      undefined,
      options,
    );
    validateMoney(handoff.amount);
    return handoff;
  }

  async cancelPurchaseHandoff(
    storefront: string,
    handoffUuid: string,
    options?: RequestOptions,
  ): Promise<StorefrontPurchaseHandoff> {
    const handoff = await this.request<StorefrontPurchaseHandoff>(
      "POST",
      `/billing${storefrontPath(storefront, "purchase-handoffs", handoffUuid, "cancel")}`,
      undefined,
      options,
    );
    validateMoney(handoff.amount);
    return handoff;
  }

  listBillingPartners(input: BillingPartnerPageRequest, options?: RequestOptions): Promise<BillingPartnerPage> {
    const query = input.after ? `?${new URLSearchParams({ after: input.after })}` : "";
    return this.request("GET", billingPartnersPath + query, undefined, options);
  }

  listBillingPartnerSellers(
    input: BillingPartnerPageRequest,
    options?: RequestOptions,
  ): Promise<BillingPartnerSellerPage> {
    const query = input.after ? `?${new URLSearchParams({ after: input.after })}` : "";
    return this.request("GET", `${billingPartnersPath}/sellers${query}`, undefined, options);
  }

  getSellerSettlementPreference(sellerUuid: string, options?: RequestOptions): Promise<PartnerSettlementSelection> {
    return this.request(
      "GET",
      `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/settlement-preference`,
      undefined,
      options,
    );
  }

  getPartnerSettlementPreference(partnerUuid: string, options?: RequestOptions): Promise<PartnerSettlementSelection> {
    return this.request(
      "GET",
      `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/settlement-preference`,
      undefined,
      options,
    );
  }

  recordPartnerSettlementPreference(
    sellerUuid: string,
    input: RecordPartnerSettlementPreferenceRequest,
    options?: RequestOptions,
  ): Promise<PartnerSettlementPreference> {
    return this.request(
      "POST",
      `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/settlement-preference`,
      input,
      options,
    );
  }

  getSellerTaxDisclosure(sellerUuid: string, options?: RequestOptions): Promise<PartnerTaxDisclosureSelection> {
    return this.request(
      "GET",
      `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/tax-disclosure`,
      undefined,
      options,
    );
  }

  getPartnerTaxDisclosure(partnerUuid: string, options?: RequestOptions): Promise<PartnerTaxDisclosureSelection> {
    return this.request(
      "GET",
      `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/tax-disclosure`,
      undefined,
      options,
    );
  }

  recordPartnerTaxDisclosure(
    sellerUuid: string,
    input: RecordPartnerTaxDisclosureRequest,
    options?: RequestOptions,
  ): Promise<PartnerTaxDisclosure> {
    return this.request(
      "POST",
      `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/tax-disclosure`,
      input,
      options,
    );
  }

  async listPartnerPayouts(input: PartnerPayoutPageRequest, options?: RequestOptions): Promise<PartnerPayoutPage> {
    const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
    const page = await this.request<PartnerPayoutPage>(
      "GET",
      `${billingPartnersPath}/${encodeURIComponent(input.partnerCompanyUuid)}/payouts${query}`,
      undefined,
      options,
    );
    for (const payout of page.payouts) validateMoney(payout.amount);
    return page;
  }

  async recordPartnerPayout(
    partnerUuid: string,
    input: RecordPartnerPayoutRequest,
    options?: RequestOptions,
  ): Promise<PartnerPayout> {
    validateMoney(input.amount);
    const payout = await this.request<PartnerPayout>(
      "POST",
      `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/payouts`,
      input,
      options,
    );
    validateMoney(payout.amount);
    return payout;
  }

  createBillingPartnerInvitation(options?: RequestOptions): Promise<BillingPartnerInvitation> {
    return this.request("POST", `${billingPartnersPath}/invitations`, undefined, options);
  }

  listPartnerProductTerms(
    input: PartnerProductTermsPageRequest,
    options?: RequestOptions,
  ): Promise<PartnerProductTermsPage> {
    const path = storefrontPath(input.storefront, "offers", input.offerUuid, "partner-terms");
    const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
    return this.request("GET", `/billing${path}${query}`, undefined, options);
  }

  publishPartnerProductTerms(
    storefront: string,
    offerUuid: string,
    input: PublishPartnerProductTermsRequest,
    options?: RequestOptions,
  ): Promise<PartnerProductTermsVersion> {
    const path = storefrontPath(storefront, "offers", offerUuid, "partner-terms");
    return this.request("POST", `/billing${path}`, input, options);
  }

  acceptBillingPartnerInvitation(
    input: AcceptBillingPartnerInvitationRequest,
    options?: RequestOptions,
  ): Promise<AcceptedBillingPartnerInvitation> {
    return this.request("POST", `${billingPartnersPath}/invitations/accept`, input, options);
  }

  getUsageTariff(storefront: string, revisionUuid: string, options?: RequestOptions): Promise<UsageTariffRevision> {
    return this.request("GET", storefrontPath(storefront, "usage-tariffs", revisionUuid), undefined, options);
  }

  listUsageTariffs(input: StorefrontUsagePageRequest, options?: RequestOptions): Promise<UsageTariffPage> {
    return this.request("GET", usagePagePath(input, "usage-tariffs"), undefined, options);
  }

  listUsageEnrollments(input: StorefrontUsagePageRequest, options?: RequestOptions): Promise<UsageEnrollmentPage> {
    return this.request("GET", usagePagePath(input, "usage-enrollments"), undefined, options);
  }

  publishUsageTariff(
    storefront: string,
    input: PublishUsageTariffRequest,
    options?: RequestOptions,
  ): Promise<UsageTariffRevision> {
    return this.request("POST", storefrontPath(storefront, "usage-tariffs"), input, options);
  }

  enrollUsage(storefront: string, input: EnrollUsageRequest, options?: RequestOptions): Promise<UsageEnrollment> {
    return this.request("POST", storefrontPath(storefront, "usage-enrollments"), input, options);
  }

  async issueUsageInvoice(
    storefront: string,
    enrollmentUuid: string,
    options?: RequestOptions,
  ): Promise<IssueUsageResult> {
    const result = await this.request<IssueUsageResult>(
      "POST",
      storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "issue"),
      undefined,
      options,
    );
    validateUsageCertificate(result.usage);
    if (result.status === "invoice_issued") validateTotals(result.invoice.totals);
    return result;
  }

  getUsageSchedule(storefront: string, enrollmentUuid: string, options?: RequestOptions): Promise<UsageSchedule> {
    return this.request(
      "GET",
      storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"),
      undefined,
      options,
    );
  }

  scheduleUsageInvoice(
    storefront: string,
    enrollmentUuid: string,
    input: UsageInvoiceOptIn,
    options?: RequestOptions,
  ): Promise<UsageSchedule> {
    return this.request(
      "POST",
      storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"),
      input,
      options,
    );
  }

  cancelUsageSchedule(storefront: string, enrollmentUuid: string, options?: RequestOptions): Promise<UsageSchedule> {
    return this.request(
      "DELETE",
      storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"),
      undefined,
      options,
    );
  }

  async listSellerInvoices(input: SellerInvoiceListRequest, options?: RequestOptions): Promise<SellerInvoiceList> {
    const path = `/billing${storefrontPath(input.storefront, "invoices")}`;
    const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
    const page = await this.request<SellerInvoiceList>("GET", path + query, undefined, options);
    for (const invoice of page.invoices) validateTotals(invoice.totals);
    return page;
  }

  async getPartnerStatement(
    input: StorefrontPartnerStatementRequest,
    options?: RequestOptions,
  ): Promise<StorefrontPartnerStatement> {
    const query = new URLSearchParams({ month: input.month });
    if (input.cursor) query.set("cursor", input.cursor);
    const path = storefrontPath(input.storefront, "partners", input.partnerCompanyUuid, "statement");
    const statement = await this.request<StorefrontPartnerStatement>(
      "GET",
      `/billing${path}?${query}`,
      undefined,
      options,
    );
    for (const movement of statement.movements) {
      validateMoney(movement.partnerDelta);
      validateMoney(movement.sellerCutDelta);
      if (movement.earning) {
        for (const amount of Object.values(movement.earning)) validateMoney(amount);
      }
    }
    return statement;
  }

  async issueCreditNote(
    storefront: string,
    invoiceUuid: string,
    input: StorefrontAdjustmentRequest,
    options?: RequestOptions,
  ): Promise<StorefrontCreditNote> {
    const note = await this.request<StorefrontCreditNote>(
      "POST",
      storefrontPath(storefront, "invoices", invoiceUuid, "credit-note"),
      input,
      options,
    );
    validateTotals(note.totals);
    return note;
  }

  async requestRefund(
    storefront: string,
    invoiceUuid: string,
    input: StorefrontAdjustmentRequest,
    options?: RequestOptions,
  ): Promise<StorefrontRefund> {
    const refund = await this.request<StorefrontRefund>(
      "POST",
      storefrontPath(storefront, "invoices", invoiceUuid, "refund"),
      input,
      options,
    );
    validateMoney(refund.amount);
    return refund;
  }

  async reconcileRefund(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontRefund> {
    const refund = await this.request<StorefrontRefund>(
      "POST",
      storefrontPath(storefront, "invoices", invoiceUuid, "refund", "reconcile"),
      undefined,
      options,
    );
    validateMoney(refund.amount);
    return refund;
  }

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

  getAnalyticsDestination(slug: string, options?: RequestOptions): Promise<StorefrontAnalyticsDestination> {
    return this.request("GET", `/billing${storefrontPath(slug, "analytics-destination")}`, undefined, options);
  }

  selectAnalyticsDestination(
    slug: string,
    input: SelectStorefrontAnalyticsDestination,
    options?: RequestOptions,
  ): Promise<StorefrontAnalyticsDestination> {
    return this.request("PUT", `/billing${storefrontPath(slug, "analytics-destination")}`, input, options);
  }

  disableAnalyticsDestination(slug: string, options?: RequestOptions): Promise<StorefrontAnalyticsDestination> {
    return this.request("DELETE", `/billing${storefrontPath(slug, "analytics-destination")}`, undefined, options);
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

  async issueStorefrontInvoice(
    storefront: string,
    quoteUuid: string,
    options?: RequestOptions,
  ): Promise<StorefrontPurchase> {
    return validatePurchase(
      await this.request("POST", storefrontPath(storefront, "quotes", quoteUuid, "invoice"), undefined, options),
    );
  }

  getStorefrontSetOffEligibility(
    storefront: string,
    invoiceUuid: string,
    options?: RequestOptions,
  ): Promise<StorefrontSetOffEligibility> {
    return this.request("GET", storefrontPath(storefront, "purchases", invoiceUuid, "set-off"), undefined, options);
  }

  async applyStorefrontSetOff(
    storefront: string,
    invoiceUuid: string,
    options?: RequestOptions,
  ): Promise<StorefrontSetOff> {
    const setOff = await this.request<StorefrontSetOff>(
      "POST",
      storefrontPath(storefront, "purchases", invoiceUuid, "set-off"),
      undefined,
      options,
    );
    validateMoney(setOff.amount);
    return setOff;
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

function usagePagePath(input: StorefrontUsagePageRequest, resource: string): string {
  const path = storefrontPath(input.storefront, resource);
  return input.before ? `${path}?${new URLSearchParams({ before: input.before })}` : path;
}

function validateUsageCertificate(usage: UsageCertificate): void {
  const line = usage.line;
  const isCount = (value: unknown): boolean => typeof value === "string" && /^(0|[1-9][0-9]{0,18})$/.test(value);
  if (!isCount(line.quantity) || line.windows.some((day) => !isCount(day.quantity) || !isCount(day.sourceWatermark))) {
    throw new Error("custd: invalid certified usage quantity");
  }
  validateMoney(line.netAmount);
  validateMoney(line.taxAmount);
  validateMoney(line.grossAmount);
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
  if (purchase.setOff) validateMoney(purchase.setOff.amount);
  if (purchase.usage) validateUsageCertificate(purchase.usage);
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
