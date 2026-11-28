import type { StorefrontInvoiceStatus, StorefrontMoney, StorefrontQuoteLine, StorefrontTotals } from "./storefront.js";
export type UsageMeter = {
    slug: string;
    version: number;
    unit: string;
};
export type PublishUsageTariffRequest = {
    tariffRevisionUuid: string;
    productUuid: string;
    description: string;
    meter: UsageMeter;
    effectiveFrom: string;
    effectiveTo?: string;
    rate: {
        currency: string;
        majorAmount: string;
        perUnits: string;
    };
    tax: {
        label: string;
        rate: string;
    };
};
export type UsageTariffRevision = PublishUsageTariffRequest & {
    sellerCompanyUuid: string;
    appUuid: string;
};
export type EnrollUsageRequest = {
    tariffRevisionUuid: string;
    dataSpaceCompanyUuid?: string;
    periodStart: string;
    closeNotBefore: string;
};
export type UsageEnrollment = {
    enrollmentUuid: string;
};
export type StorefrontUsagePageRequest = {
    storefront: string;
    before?: string;
};
export type UsageTariffPage = {
    tariffs: UsageTariffRevision[];
    nextBefore?: string;
};
export type UsageEnrollmentItem = EnrollUsageRequest & UsageEnrollment & {
    status: "awaiting_cutoff" | "awaiting_closure" | "certified" | "invoice_issued";
    closedAt?: string;
    invoiceUuid?: string;
};
export type UsageEnrollmentPage = {
    enrollments: UsageEnrollmentItem[];
    nextBefore?: string;
};
export type UsagePeriod = {
    start: string;
    endExclusive: string;
};
export type UsageWindowEvidence = {
    period: UsagePeriod;
    quantity: string;
    state: "final" | "corrected" | "certified";
    sourceWatermark: string;
    correctionGeneration: number;
    calculationVersion: number;
};
export type UsagePricedLine = {
    scope: {
        sellerCompanyUuid: string;
        appUuid: string;
        buyerCompanyUuid: string;
    };
    period: UsagePeriod;
    source: {
        accountCompanyUuid: string;
        dataSpaceCompanyUuid?: string;
        meter: UsageMeter;
    };
    tariff: UsageTariffRevision;
    quantity: string;
    rounding: string;
    windows: UsageWindowEvidence[];
    netAmount: StorefrontMoney;
    taxAmount: StorefrontMoney;
    grossAmount: StorefrontMoney;
};
export type UsageCertificate = {
    enrollmentUuid: string;
    closedAt: string;
    line: UsagePricedLine;
};
export type UsageIssuedInvoice = {
    invoiceUuid: string;
    invoiceNumber: string;
    status: StorefrontInvoiceStatus;
    issuedAt: string;
    totals: StorefrontTotals;
    lines: StorefrontQuoteLine[];
};
export type IssueUsageResult = {
    status: "invoice_issued";
    invoice: UsageIssuedInvoice;
    usage: UsageCertificate;
} | {
    status: "no_amount_due";
    usage: UsageCertificate;
};
