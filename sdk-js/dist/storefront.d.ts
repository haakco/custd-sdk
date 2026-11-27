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
export type StorefrontPurchase = {
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
/** Browse a seller's offers and check out using the current buyer identity. */
export declare class StorefrontClient {
    private readonly request;
    constructor(request: StorefrontRequester);
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
