import type { RequestOptions } from "./index.js";
import type { EnrollUsageRequest, InvoiceNotice, IssueUsageResult, PublishUsageTariffRequest, StorefrontUsagePageRequest, UsageCertificate, UsageEnrollment, UsageEnrollmentPage, UsageInvoiceOptIn, UsageSchedule, UsageTariffPage, UsageTariffRevision } from "./storefront-usage.js";
export type * from "./storefront-usage.js";
type StorefrontRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
/** An exact signed minor-unit count encoded as a decimal string. */
export type StorefrontMoney = {
    currency: string;
    amountMinor: string;
};
export type StorefrontUnitPrice = {
    currency: string;
    amount: string;
};
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
    complementaryForOfferUuid?: string;
    offerUuid: string;
    name: string;
    billingInterval: string;
    priceRevision: StorefrontPriceRevision;
};
export type StorefrontCatalogue = {
    offers: StorefrontOffer[];
    canPublish: boolean;
};
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
export type StorefrontLineQuantity = {
    quantity: string;
};
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
export type StorefrontServicePeriod = {
    start: string;
    endExclusive: string;
};
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
export type MerchantAccountResponse = {
    account?: MerchantAccount;
};
export type ConfigureMerchant = {
    merchantId: string;
    expectedRevision: number;
    businessTimeZone: string;
    refundsEnabled: boolean;
    checkoutSecretKey: string;
    paymentsReadToken: string;
};
export type RevokeMerchant = {
    expectedRevision: number;
};
export type VerifyMerchant = {
    appUuid: string;
    invoiceUuid: string;
};
export type VerifyMerchantResult = {
    verified: boolean;
};
export type StorefrontRefund = {
    refundUuid: string;
    status: "submitting" | "pending" | "succeeded" | "review_required";
    amount: StorefrontMoney;
    invoiceUuid?: string;
    paymentUuid?: string;
    requestedAt?: string;
    processedAt?: string;
};
export type StorefrontAdjustmentRequest = {
    reason: string;
};
export type SellerInvoiceListRequest = {
    storefront: string;
    before?: string;
};
export type SellerInvoiceList = {
    invoices: SellerInvoiceItem[];
    nextBefore?: string;
};
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
    reversal?: {
        creditNoteUuid: string;
        reversedAt: string;
    };
};
export type StorefrontSetOffEligibility = {
    eligible: boolean;
};
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
export type BillingPartner = {
    partnerCompanyUuid: string;
    name: string;
    active: boolean;
};
export type BillingPartnerPageRequest = {
    after?: string;
};
export type BillingPartnerPage = {
    partners: BillingPartner[];
    nextAfter?: string;
};
export type BillingPartnerSeller = {
    sellerCompanyUuid: string;
    name: string;
    active: boolean;
};
export type BillingPartnerSellerPage = {
    sellers: BillingPartnerSeller[];
    nextAfter?: string;
};
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
export type PartnerPayoutPageRequest = {
    partnerCompanyUuid: string;
    before?: string;
};
export type PartnerPayoutPage = {
    payouts: PartnerPayout[];
    nextBefore?: string;
};
export type BillingPartnerInvitation = {
    code: string;
    expiresAt: string;
};
export type AcceptBillingPartnerInvitationRequest = {
    code: string;
};
export type AcceptedBillingPartnerInvitation = {
    sellerCompanyName: string;
};
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
export type PartnerProductTermsPageRequest = {
    storefront: string;
    offerUuid: string;
    before?: string;
};
export type PartnerProductTermsPage = {
    versions: PartnerProductTermsVersion[];
    nextBefore?: string;
};
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
export type StorefrontReceiptTemplateSelection = {
    revision?: string;
    selectedAt?: string;
};
export type SelectStorefrontReceiptTemplate = {
    revision: string;
};
/** Browse a seller's offers and check out using the current buyer identity. */
export declare class StorefrontClient {
    private readonly request;
    constructor(request: StorefrontRequester);
    createPurchaseHandoff(storefront: string, input: CreateStorefrontPurchaseHandoff, options?: RequestOptions): Promise<StorefrontPurchaseHandoff>;
    getPurchaseHandoff(storefront: string, handoffUuid: string, options?: RequestOptions): Promise<StorefrontPurchaseHandoff>;
    cancelPurchaseHandoff(storefront: string, handoffUuid: string, options?: RequestOptions): Promise<StorefrontPurchaseHandoff>;
    listBillingPartners(input: BillingPartnerPageRequest, options?: RequestOptions): Promise<BillingPartnerPage>;
    listBillingPartnerSellers(input: BillingPartnerPageRequest, options?: RequestOptions): Promise<BillingPartnerSellerPage>;
    getSellerSettlementPreference(sellerUuid: string, options?: RequestOptions): Promise<PartnerSettlementSelection>;
    getPartnerSettlementPreference(partnerUuid: string, options?: RequestOptions): Promise<PartnerSettlementSelection>;
    recordPartnerSettlementPreference(sellerUuid: string, input: RecordPartnerSettlementPreferenceRequest, options?: RequestOptions): Promise<PartnerSettlementPreference>;
    getSellerTaxDisclosure(sellerUuid: string, options?: RequestOptions): Promise<PartnerTaxDisclosureSelection>;
    getPartnerTaxDisclosure(partnerUuid: string, options?: RequestOptions): Promise<PartnerTaxDisclosureSelection>;
    recordPartnerTaxDisclosure(sellerUuid: string, input: RecordPartnerTaxDisclosureRequest, options?: RequestOptions): Promise<PartnerTaxDisclosure>;
    listPartnerPayouts(input: PartnerPayoutPageRequest, options?: RequestOptions): Promise<PartnerPayoutPage>;
    recordPartnerPayout(partnerUuid: string, input: RecordPartnerPayoutRequest, options?: RequestOptions): Promise<PartnerPayout>;
    createBillingPartnerInvitation(options?: RequestOptions): Promise<BillingPartnerInvitation>;
    listPartnerProductTerms(input: PartnerProductTermsPageRequest, options?: RequestOptions): Promise<PartnerProductTermsPage>;
    publishPartnerProductTerms(storefront: string, offerUuid: string, input: PublishPartnerProductTermsRequest, options?: RequestOptions): Promise<PartnerProductTermsVersion>;
    acceptBillingPartnerInvitation(input: AcceptBillingPartnerInvitationRequest, options?: RequestOptions): Promise<AcceptedBillingPartnerInvitation>;
    getUsageTariff(storefront: string, revisionUuid: string, options?: RequestOptions): Promise<UsageTariffRevision>;
    listUsageTariffs(input: StorefrontUsagePageRequest, options?: RequestOptions): Promise<UsageTariffPage>;
    listUsageEnrollments(input: StorefrontUsagePageRequest, options?: RequestOptions): Promise<UsageEnrollmentPage>;
    publishUsageTariff(storefront: string, input: PublishUsageTariffRequest, options?: RequestOptions): Promise<UsageTariffRevision>;
    enrollUsage(storefront: string, input: EnrollUsageRequest, options?: RequestOptions): Promise<UsageEnrollment>;
    issueUsageInvoice(storefront: string, enrollmentUuid: string, options?: RequestOptions): Promise<IssueUsageResult>;
    getUsageSchedule(storefront: string, enrollmentUuid: string, options?: RequestOptions): Promise<UsageSchedule>;
    scheduleUsageInvoice(storefront: string, enrollmentUuid: string, input: UsageInvoiceOptIn, options?: RequestOptions): Promise<UsageSchedule>;
    cancelUsageSchedule(storefront: string, enrollmentUuid: string, options?: RequestOptions): Promise<UsageSchedule>;
    listSellerInvoices(input: SellerInvoiceListRequest, options?: RequestOptions): Promise<SellerInvoiceList>;
    getPartnerStatement(input: StorefrontPartnerStatementRequest, options?: RequestOptions): Promise<StorefrontPartnerStatement>;
    issueCreditNote(storefront: string, invoiceUuid: string, input: StorefrontAdjustmentRequest, options?: RequestOptions): Promise<StorefrontCreditNote>;
    requestRefund(storefront: string, invoiceUuid: string, input: StorefrontAdjustmentRequest, options?: RequestOptions): Promise<StorefrontRefund>;
    reconcileRefund(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontRefund>;
    listOwnedStorefronts(options?: RequestOptions): Promise<OwnedStorefronts>;
    registerStorefront(input: RegisterStorefront, options?: RequestOptions): Promise<StorefrontBinding>;
    getReceiptTemplate(slug: string, options?: RequestOptions): Promise<StorefrontReceiptTemplateSelection>;
    selectReceiptTemplate(slug: string, input: SelectStorefrontReceiptTemplate, options?: RequestOptions): Promise<StorefrontReceiptTemplateSelection>;
    getMerchant(options?: RequestOptions): Promise<MerchantAccountResponse>;
    configureMerchant(input: ConfigureMerchant, options?: RequestOptions): Promise<MerchantAccountResponse>;
    revokeMerchant(input: RevokeMerchant, options?: RequestOptions): Promise<MerchantAccountResponse>;
    verifyMerchant(input: VerifyMerchant, options?: RequestOptions): Promise<VerifyMerchantResult>;
    listOffers(storefront: string, options?: RequestOptions): Promise<StorefrontCatalogue>;
    publishOffer(storefront: string, offer: StorefrontPublishOffer, options?: RequestOptions): Promise<StorefrontOffer>;
    createCart(storefront: string, options?: RequestOptions): Promise<StorefrontCart>;
    getCart(storefront: string, cartUuid: string, options?: RequestOptions): Promise<StorefrontCart>;
    updateLine(storefront: string, cartUuid: string, offerUuid: string, quantity: StorefrontLineQuantity, options?: RequestOptions): Promise<StorefrontCart>;
    createQuote(storefront: string, cartUuid: string, options?: RequestOptions): Promise<StorefrontQuote>;
    getQuote(storefront: string, quoteUuid: string, options?: RequestOptions): Promise<StorefrontQuote>;
    /** Start or resume the purchase for an accepted quote. */
    checkout(storefront: string, quoteUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
    issueStorefrontInvoice(storefront: string, quoteUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
    getStorefrontSetOffEligibility(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontSetOffEligibility>;
    applyStorefrontSetOff(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontSetOff>;
    getPurchase(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
    /** Resume or retry payment for the same invoice. */
    startPayment(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
}
