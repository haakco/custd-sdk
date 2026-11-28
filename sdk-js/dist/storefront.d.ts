import type { RequestOptions } from "./index.js";
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
    getPurchase(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
    /** Resume or retry payment for the same invoice. */
    startPayment(storefront: string, invoiceUuid: string, options?: RequestOptions): Promise<StorefrontPurchase>;
}
export {};
