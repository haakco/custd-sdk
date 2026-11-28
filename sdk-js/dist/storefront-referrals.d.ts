export type PartnerReferralPageRequest = {
    before?: string;
};
export type PublishReferralTerms = {
    code: string;
    effectiveFrom: string;
    agreementDate: string;
    agreementReference: string;
    signedAgreementAttested: boolean;
    share: string;
    months: number;
    holdDays: number;
};
export type ReferralTermsVersion = {
    termsUuid: string;
    effectiveFrom: string;
    agreementDate: string;
    agreementReference: string;
    recordedByUserUuid: string;
    share: string;
    months: number;
    holdDays: number;
};
export type ReferralCodeTerms = {
    code?: string;
    businessTimeZone?: string;
    versions: ReferralTermsVersion[] | null;
    nextBefore?: string;
};
export type ReferralReviewItem = {
    attributionUuid: string;
    eventUuid: string;
    buyerCompanyUuid: string;
    partnerCompanyUuid: string;
    invoiceUuid: string;
    eventType: ReferralReviewEventType;
    failureCode: string;
    reviewedAt: string;
    firstReceivedOn?: string;
    retryEligible: boolean;
};
export type ReferralReviewPage = {
    reviews: ReferralReviewItem[] | null;
    nextBefore?: string;
};
export type ReferralReviewRetry = {
    attributionUuid: string;
    status: ReferralRetryStatus;
    failureCode?: string;
    requeuedCount: number;
    hasMore: boolean;
};
export type ReferralReviewEventType = "billing.payment.settled" | "billing.payment.refunded";
export type ReferralRetryStatus = "blocked" | "requeued" | "no_review_to_retry";
