import type { StorefrontMoney, StorefrontQuoteLine, StorefrontTotals } from "./storefront.js";
export type AccountingExportRequest = {
    month: string;
    businessTimeZone: string;
    after?: string;
};
export type AccountingExport = {
    sellerCompanyUuid: string;
    month: string;
    businessTimeZone: string;
    records: AccountingRecord[] | null;
    sourceGaps: AccountingGap[] | null;
    nextAfter?: string;
};
export type AccountingRecord = {
    kind: AccountingRecordKind;
    recordUuid: string;
    appUuid?: string;
    invoiceUuid?: string;
    invoiceNumber?: string;
    buyerCompanyUuid?: string;
    postedOn: string;
    document?: AccountingDocument;
    paymentAllocation?: AccountingPayment;
    refund?: AccountingRefund;
    partnerMovement?: AccountingMovement;
    partnerPayout?: AccountingPayout;
    partnerSetOff?: AccountingSetOff;
    partnerProjectionGap?: AccountingProjectionGap;
};
export type AccountingDocument = {
    number: string;
    issuedAt: string;
    lines: StorefrontQuoteLine[] | null;
    totals: StorefrontTotals;
};
export type AccountingPayment = {
    amount: StorefrontMoney;
    verifiedAt: string;
    providerReceivedAt?: string;
    provider: string;
    providerReference: string;
    providerAccountUuid?: string;
    postingBasis: AccountingPostingBasis;
};
export type AccountingRefund = {
    amount: StorefrontMoney;
    paymentUuid: string;
    processedAt: string;
    provider: string;
    providerReference: string;
    providerAccountUuid?: string;
};
export type AccountingMovement = {
    feeKind: AccountingFeeKind;
    partnerCompanyUuid: string;
    originalMovementUuid?: string;
    paymentUuid: string;
    termsUuid: string;
    lineNumber: number;
    availableOn: string;
    partnerDelta: StorefrontMoney;
    sellerCutDelta: StorefrontMoney;
};
export type AccountingPayout = {
    partnerCompanyUuid: string;
    amount: StorefrontMoney;
    externalReference: string;
    paidAt: string;
    preferenceUuid: string;
    taxDisclosureUuid: string;
    allocations: AccountingEarningAllocation[] | null;
};
export type AccountingEarningAllocation = {
    earningMovementUuid: string;
    amountMinor: string;
};
export type AccountingSetOff = {
    setOffUuid: string;
    partnerCompanyUuid: string;
    amount: StorefrontMoney;
    occurredAt: string;
    creditNoteUuid?: string;
    preferenceUuid: string;
    taxDisclosureUuid: string;
    allocations: AccountingEarningAllocation[] | null;
};
export type AccountingProjectionGap = {
    outcome: string;
    failureCode?: string;
};
export type AccountingGap = "provider_fee_evidence_missing" | "provider_net_deposit_evidence_missing" | "provider_settlement_batch_reference_missing";
export type AccountingRecordKind = "invoice" | "credit_note" | "payment_allocation" | "refund" | "partner_movement" | "partner_payout" | "partner_setoff" | "partner_setoff_reversal" | "partner_product_projection_gap" | "partner_referral_projection_gap";
export type AccountingPostingBasis = "provider_received_at" | "recorded_received_date" | "verification_date";
export type AccountingFeeKind = "product_fee" | "referral_fee";
