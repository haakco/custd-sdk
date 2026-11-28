"""Buyer and seller operations on a credential-scoped storefront."""

from __future__ import annotations

import json
import re
from typing import Literal, NotRequired, TypedDict, TypeVar
from urllib.parse import urlencode

from .client import AdminTransport, CustdClient, _decode_dto, problem_request_error, quote_path


class StorefrontMoney(TypedDict):
    currency: str
    amountMinor: str


class StorefrontUnitPrice(TypedDict):
    currency: str
    amount: str


class StorefrontPriceRevision(TypedDict):
    priceRevisionUuid: str
    revision: int
    unitPrice: StorefrontUnitPrice
    taxTreatment: str
    taxRate: str
    taxLabel: str
    effectiveFrom: str


class StorefrontDataSpaceCapacity(TypedDict):
    extraSpacesPerUnit: int
    extraProducersPerSpacePerUnit: int


class StorefrontOffer(TypedDict):
    offerUuid: str
    name: str
    billingInterval: str
    priceRevision: StorefrontPriceRevision
    dataSpaceCapacity: NotRequired[StorefrontDataSpaceCapacity]
    complementaryForOfferUuid: NotRequired[str]


class StorefrontCatalogue(TypedDict):
    offers: list[StorefrontOffer]
    canPublish: bool


class StorefrontPublishOffer(TypedDict):
    offerUuid: NotRequired[str]
    name: str
    billingInterval: str
    unitPrice: StorefrontUnitPrice
    taxRate: str
    taxLabel: str
    effectiveFrom: NotRequired[str]
    complementaryForOfferUuid: NotRequired[str]


class StorefrontCartLine(TypedDict):
    offerUuid: str
    priceRevisionUuid: str
    quantity: str


class StorefrontCart(TypedDict):
    cartUuid: str
    revision: int
    status: str
    currency: str
    createdAt: str
    lines: list[StorefrontCartLine]


class StorefrontLineQuantity(TypedDict):
    quantity: str


class StorefrontTotals(TypedDict):
    netTotal: StorefrontMoney
    taxTotal: StorefrontMoney
    grossTotal: StorefrontMoney


class StorefrontTax(TypedDict):
    label: str
    rate: str
    rounding: str
    roundingPoint: str
    amount: StorefrontMoney


class StorefrontServicePeriod(TypedDict):
    start: str
    endExclusive: str


class StorefrontQuoteLine(TypedDict):
    lineNumber: int
    offerUuid: str
    priceRevisionUuid: str
    description: str
    quantity: str
    unitPrice: StorefrontUnitPrice
    extensionRounding: str
    servicePeriod: StorefrontServicePeriod
    netAmount: StorefrontMoney
    tax: StorefrontTax
    grossAmount: StorefrontMoney


class StorefrontQuote(TypedDict):
    quoteUuid: str
    cartUuid: str
    cartRevision: int
    issuedAt: str
    expiresAt: str
    lines: list[StorefrontQuoteLine]
    totals: StorefrontTotals


class StorefrontReceiptDelivery(TypedDict):
    channel: str
    notificationSourceKey: str
    status: str


class StorefrontReceipt(TypedDict):
    receiptUuid: str
    receiptNumber: str
    invoiceUuid: str
    paymentUuid: str
    issuedAt: str
    amountReceived: StorefrontMoney
    delivery: StorefrontReceiptDelivery


class StorefrontBillingContact(TypedDict):
    companyUuid: str
    name: str
    email: str


class StorefrontCreditNote(TypedDict):
    creditNoteUuid: str
    creditNoteNumber: str
    totals: StorefrontTotals
    invoiceUuid: NotRequired[str]
    invoiceNumber: NotRequired[str]
    invoiceIssuedAt: NotRequired[str]
    issuedAt: NotRequired[str]
    status: NotRequired[str]
    billTo: NotRequired[StorefrontBillingContact]
    sellerName: NotRequired[str]
    reason: NotRequired[str]
    lines: NotRequired[list[StorefrontQuoteLine]]


class StorefrontAdjustmentRequest(TypedDict):
    reason: str


class StorefrontPurchase(TypedDict):
    invoiceUuid: str
    invoiceNumber: str
    status: Literal["open", "paid"]
    totals: StorefrontTotals
    checkoutState: NotRequired[Literal["creating", "ready", "review_required"]]
    paymentStatus: NotRequired[Literal["pending", "settled", "failed"]]
    paymentUrl: NotRequired[str]
    receipt: NotRequired[StorefrontReceipt]
    creditNote: NotRequired[StorefrontCreditNote]
    usage: NotRequired[UsageCertificate]
    invoiceNotice: NotRequired[InvoiceNotice]
    setOff: NotRequired[StorefrontSetOff]
    activationStatus: NotRequired[str]
    refund: NotRequired[StorefrontRefund]


class MerchantAccount(TypedDict):
    accountUuid: str
    sellerCompanyUuid: str
    merchantId: str
    mode: str
    revision: int
    status: str
    refundsEnabled: bool
    businessTimeZone: str
    updatedAt: str


class MerchantAccountResponse(TypedDict):
    account: NotRequired[MerchantAccount]


class RevokeMerchant(TypedDict):
    expectedRevision: int


class StorefrontAnalyticsDestination(TypedDict):
    siteUuid: NotRequired[str]
    enabled: bool


InvoiceNoticeStatus = Literal["pending", "queued", "sent", "failed", "unknown", "seller_unavailable", "review_required"]


InvoiceNoticeReason = Literal["invalid_document", "payload_mismatch"]


class InvoiceNotice(TypedDict):
    status: InvoiceNoticeStatus
    reason: NotRequired[InvoiceNoticeReason]


UsageScheduleState = Literal["scheduled", "cancelled", "invoice_issued", "no_amount_due", "review_required"]


class UsageSchedule(TypedDict):
    invoiceNotice: NotRequired[InvoiceNotice]
    enrollmentUuid: str
    state: UsageScheduleState
    consentedAt: str
    attempts: int
    nextAttemptAt: NotRequired[str]
    completedAt: NotRequired[str]
    invoiceUuid: NotRequired[str]
    reason: NotRequired[str]


AccountingRecordKind = Literal[
    "invoice",
    "credit_note",
    "payment_allocation",
    "refund",
    "partner_movement",
    "partner_payout",
    "partner_setoff",
    "partner_setoff_reversal",
    "partner_product_projection_gap",
    "partner_referral_projection_gap",
]


class AccountingDocument(TypedDict):
    number: str
    issuedAt: str
    lines: list[StorefrontQuoteLine]
    totals: StorefrontTotals


AccountingPostingBasis = Literal["provider_received_at", "recorded_received_date", "verification_date"]


class AccountingPayment(TypedDict):
    amount: StorefrontMoney
    verifiedAt: str
    providerReceivedAt: NotRequired[str]
    provider: str
    providerReference: str
    providerAccountUuid: NotRequired[str]
    postingBasis: AccountingPostingBasis


class AccountingRefund(TypedDict):
    amount: StorefrontMoney
    paymentUuid: str
    processedAt: str
    provider: str
    providerReference: str
    providerAccountUuid: NotRequired[str]


AccountingFeeKind = Literal["product_fee", "referral_fee"]


class AccountingMovement(TypedDict):
    feeKind: AccountingFeeKind
    partnerCompanyUuid: str
    originalMovementUuid: NotRequired[str]
    paymentUuid: str
    termsUuid: str
    lineNumber: int
    availableOn: str
    partnerDelta: StorefrontMoney
    sellerCutDelta: StorefrontMoney


class AccountingEarningAllocation(TypedDict):
    earningMovementUuid: str
    amountMinor: str


class AccountingPayout(TypedDict):
    partnerCompanyUuid: str
    amount: StorefrontMoney
    externalReference: str
    paidAt: str
    preferenceUuid: str
    taxDisclosureUuid: str
    allocations: list[AccountingEarningAllocation]


class AccountingSetOff(TypedDict):
    setOffUuid: str
    partnerCompanyUuid: str
    amount: StorefrontMoney
    occurredAt: str
    creditNoteUuid: NotRequired[str]
    preferenceUuid: str
    taxDisclosureUuid: str
    allocations: list[AccountingEarningAllocation]


class AccountingProjectionGap(TypedDict):
    outcome: str
    failureCode: NotRequired[str]


class AccountingRecord(TypedDict):
    kind: AccountingRecordKind
    recordUuid: str
    appUuid: NotRequired[str]
    invoiceUuid: NotRequired[str]
    invoiceNumber: NotRequired[str]
    buyerCompanyUuid: NotRequired[str]
    postedOn: str
    document: NotRequired[AccountingDocument]
    paymentAllocation: NotRequired[AccountingPayment]
    refund: NotRequired[AccountingRefund]
    partnerMovement: NotRequired[AccountingMovement]
    partnerPayout: NotRequired[AccountingPayout]
    partnerSetOff: NotRequired[AccountingSetOff]
    partnerProjectionGap: NotRequired[AccountingProjectionGap]


AccountingGap = Literal[
    "provider_fee_evidence_missing",
    "provider_net_deposit_evidence_missing",
    "provider_settlement_batch_reference_missing",
]


class AccountingExport(TypedDict):
    sellerCompanyUuid: str
    month: str
    businessTimeZone: str
    records: list[AccountingRecord]
    sourceGaps: list[AccountingGap]
    nextAfter: NotRequired[str]


class AccountingExportRequest(TypedDict):
    month: str
    businessTimeZone: str
    after: NotRequired[str]


class BillingPartner(TypedDict):
    partnerCompanyUuid: str
    name: str
    active: bool


class BillingPartnerPage(TypedDict):
    partners: list[BillingPartner]
    nextAfter: NotRequired[str]


class BillingPartnerPageRequest(TypedDict):
    after: NotRequired[str]


ReferralReviewEventType = Literal["billing.payment.settled", "billing.payment.refunded"]


class ReferralReviewItem(TypedDict):
    attributionUuid: str
    eventUuid: str
    buyerCompanyUuid: str
    partnerCompanyUuid: str
    invoiceUuid: str
    eventType: ReferralReviewEventType
    failureCode: str
    reviewedAt: str
    firstReceivedOn: NotRequired[str]
    retryEligible: bool


class ReferralReviewPage(TypedDict):
    reviews: list[ReferralReviewItem]
    nextBefore: NotRequired[str]


class PartnerReferralPageRequest(TypedDict):
    before: NotRequired[str]


class BillingPartnerSeller(TypedDict):
    sellerCompanyUuid: str
    name: str
    active: bool


class BillingPartnerSellerPage(TypedDict):
    sellers: list[BillingPartnerSeller]
    nextAfter: NotRequired[str]


PartnerSettlementMode = Literal["payout", "set_off"]


class PartnerSettlementPreference(TypedDict):
    preferenceUuid: str
    mode: PartnerSettlementMode
    effectiveFrom: str
    recordedAt: str


class PartnerSettlementSelection(TypedDict):
    sellerCompanyUuid: str
    partnerCompanyUuid: str
    current: NotRequired[PartnerSettlementPreference]
    next: NotRequired[PartnerSettlementPreference]


PartnerTaxStatus = Literal["registered", "not_registered"]


class PartnerTaxDisclosure(TypedDict):
    disclosureUuid: str
    status: PartnerTaxStatus
    jurisdiction: str
    registrationNumber: NotRequired[str]
    effectiveFrom: str
    recordedAt: str


class PartnerTaxDisclosureSelection(TypedDict):
    sellerCompanyUuid: str
    partnerCompanyUuid: str
    current: NotRequired[PartnerTaxDisclosure]
    next: NotRequired[PartnerTaxDisclosure]


class PartnerFeeBalanceCurrency(TypedDict):
    held: StorefrontMoney
    available: StorefrontMoney
    negative: StorefrontMoney


class PartnerFeeBalance(TypedDict):
    sellerCompanyUuid: str
    partnerCompanyUuid: str
    asOf: str
    currencies: list[PartnerFeeBalanceCurrency]


class PartnerFeeBalanceRequest(TypedDict):
    asOf: str


class PartnerPayout(TypedDict):
    externalReference: str
    amount: StorefrontMoney
    paidAt: str
    payoutUuid: str
    partnerCompanyUuid: str
    paidOn: str
    recordedAt: str
    preferenceUuid: str
    taxDisclosureUuid: str


class PartnerPayoutPage(TypedDict):
    payouts: list[PartnerPayout]
    nextBefore: NotRequired[str]


class PartnerPayoutPageRequest(TypedDict):
    partnerCompanyUuid: str
    before: NotRequired[str]


class ReferralTermsVersion(TypedDict):
    termsUuid: str
    effectiveFrom: str
    agreementDate: str
    agreementReference: str
    recordedByUserUuid: str
    share: str
    months: int
    holdDays: int


class ReferralCodeTerms(TypedDict):
    code: NotRequired[str]
    businessTimeZone: NotRequired[str]
    versions: list[ReferralTermsVersion]
    nextBefore: NotRequired[str]


class StorefrontBinding(TypedDict):
    slug: str
    sellerCompanyUuid: str
    appUuid: str
    createdAt: str


class OwnedStorefronts(TypedDict):
    sellerCompanyUuid: str
    storefronts: list[StorefrontBinding]


StorefrontInvoiceStatus = Literal["open", "paid"]


StorefrontPaymentStatus = Literal["pending", "settled", "failed"]


StorefrontCheckoutState = Literal["creating", "ready", "review_required"]


class SellerInvoiceItem(TypedDict):
    invoiceUuid: str
    invoiceNumber: str
    issuedAt: str
    totals: StorefrontTotals
    status: StorefrontInvoiceStatus
    paymentStatus: NotRequired[StorefrontPaymentStatus]
    checkoutState: NotRequired[StorefrontCheckoutState]
    refundStatus: NotRequired[str]
    creditNoteUuid: NotRequired[str]


class SellerInvoiceList(TypedDict):
    invoices: list[SellerInvoiceItem]
    nextBefore: NotRequired[str]


class SellerInvoiceListRequest(TypedDict):
    storefront: str
    before: NotRequired[str]


class PartnerProductTermsVersion(TypedDict):
    partnerCompanyUuid: str
    effectiveFrom: str
    agreementDate: str
    agreementReference: str
    signedAgreementAttested: bool
    unitCost: str
    sellerCut: str
    termsUuid: str
    recordedByUserUuid: str
    currency: str
    holdDays: int


class PartnerProductTermsPage(TypedDict):
    versions: list[PartnerProductTermsVersion]
    nextBefore: NotRequired[str]


class PartnerProductTermsPageRequest(TypedDict):
    storefront: str
    offerUuid: str
    before: NotRequired[str]


class StorefrontPartnerEarning(TypedDict):
    gross: StorefrontMoney
    tax: StorefrontMoney
    net: StorefrontMoney
    costToProvide: StorefrontMoney
    remainder: StorefrontMoney


class StorefrontPartnerMovement(TypedDict):
    movementUuid: str
    kind: str
    originalMovementUuid: NotRequired[str]
    termsUuid: str
    buyerCompanyUuid: str
    invoiceUuid: str
    paymentUuid: str
    lineNumber: int
    postedOn: str
    availableOn: str
    partnerDelta: StorefrontMoney
    sellerCutDelta: StorefrontMoney
    earning: NotRequired[StorefrontPartnerEarning]


class StorefrontPartnerStatement(TypedDict):
    sellerCompanyUuid: str
    appUuid: str
    partnerCompanyUuid: str
    month: str
    movements: list[StorefrontPartnerMovement]
    nextCursor: NotRequired[str]


class StorefrontPartnerStatementRequest(TypedDict):
    storefront: str
    partnerCompanyUuid: str
    month: str
    cursor: NotRequired[str]


class StorefrontPurchaseHandoff(TypedDict):
    handoffUuid: str
    orderReference: str
    offerUuid: str
    amount: StorefrontMoney
    checkoutPath: str
    expiresAt: str
    invoiceUuid: NotRequired[str]
    settled: bool
    cancelled: bool


class StorefrontReceiptTemplateSelection(TypedDict):
    revision: NotRequired[str]
    selectedAt: NotRequired[str]


class StorefrontSetOffEligibility(TypedDict):
    eligible: bool


class UsageEnrollmentItem(TypedDict):
    tariffDescription: str
    enrollmentUuid: str
    tariffRevisionUuid: str
    dataSpaceCompanyUuid: NotRequired[str]
    periodStart: str
    closeNotBefore: str
    closedAt: NotRequired[str]
    status: str
    invoiceUuid: NotRequired[str]


class UsageEnrollmentPage(TypedDict):
    canSchedule: bool
    enrollments: list[UsageEnrollmentItem]
    nextBefore: NotRequired[str]


class StorefrontUsagePageRequest(TypedDict):
    storefront: str
    before: NotRequired[str]


class UsageMeter(TypedDict):
    slug: str
    version: int
    unit: str


class UsageRate(TypedDict):
    currency: str
    majorAmount: str
    perUnits: str


class UsageTax(TypedDict):
    label: str
    rate: str


class UsageTariffRevision(TypedDict):
    tariffRevisionUuid: str
    productUuid: str
    description: str
    meter: UsageMeter
    effectiveFrom: str
    effectiveTo: NotRequired[str]
    rate: UsageRate
    tax: UsageTax
    sellerCompanyUuid: str
    appUuid: str


class UsageTariffPage(TypedDict):
    tariffs: list[UsageTariffRevision]
    nextBefore: NotRequired[str]


class VerifyMerchantResult(TypedDict):
    verified: bool


class VerifyMerchant(TypedDict):
    appUuid: str
    invoiceUuid: str


class BillingPartnerInvitation(TypedDict):
    code: str
    expiresAt: str


class AcceptedBillingPartnerInvitation(TypedDict):
    sellerCompanyName: str


class AcceptBillingPartnerInvitationRequest(TypedDict):
    code: str


ReferralRetryStatus = Literal["blocked", "requeued", "no_review_to_retry"]


class ReferralReviewRetry(TypedDict):
    attributionUuid: str
    status: ReferralRetryStatus
    failureCode: NotRequired[str]
    requeuedCount: int
    hasMore: bool


class RecordPartnerSettlementPreferenceRequest(TypedDict):
    preferenceUuid: str
    mode: PartnerSettlementMode
    effectiveFrom: NotRequired[str]


class RecordPartnerTaxDisclosureRequest(TypedDict):
    disclosureUuid: str
    status: PartnerTaxStatus
    jurisdiction: str
    registrationNumber: NotRequired[str]
    effectiveFrom: NotRequired[str]


class RecordPartnerPayoutRequest(TypedDict):
    externalReference: str
    amount: StorefrontMoney
    paidAt: str


class PublishReferralTerms(TypedDict):
    code: str
    effectiveFrom: str
    agreementDate: str
    agreementReference: str
    signedAgreementAttested: bool
    share: str
    months: int
    holdDays: int


class RegisterStorefront(TypedDict):
    slug: str
    appUuid: str


class PublishStorefrontCapacityOffer(TypedDict):
    offerUuid: str
    name: str
    billingInterval: str
    unitPrice: StorefrontUnitPrice
    taxRate: str
    taxLabel: str
    effectiveFrom: NotRequired[str]
    dataSpaceCapacity: StorefrontDataSpaceCapacity


class PublishPartnerProductTermsRequest(TypedDict):
    partnerCompanyUuid: str
    effectiveFrom: str
    agreementDate: str
    agreementReference: str
    signedAgreementAttested: bool
    unitCost: str
    sellerCut: str


class CreateStorefrontPurchaseHandoff(TypedDict):
    orderReference: str
    offerUuid: str
    amount: StorefrontMoney


class StorefrontRefund(TypedDict):
    refundUuid: str
    status: str
    amount: StorefrontMoney
    invoiceUuid: NotRequired[str]
    paymentUuid: NotRequired[str]
    requestedAt: NotRequired[str]
    processedAt: NotRequired[str]


class StorefrontSetOffReversal(TypedDict):
    creditNoteUuid: str
    reversedAt: str


class StorefrontSetOff(TypedDict):
    setOffUuid: str
    invoiceUuid: str
    amount: StorefrontMoney
    appliedAt: str
    appliedOn: str
    preferenceUuid: str
    taxDisclosureUuid: str
    reversal: NotRequired[StorefrontSetOffReversal]


class UsageEnrollment(TypedDict):
    enrollmentUuid: str


class EnrollUsageRequest(TypedDict):
    tariffRevisionUuid: str
    dataSpaceCompanyUuid: NotRequired[str]
    periodStart: str
    closeNotBefore: str


UsageIssuanceStatus = Literal["invoice_issued", "no_amount_due"]


class UsageIssuedInvoice(TypedDict):
    invoiceUuid: str
    invoiceNumber: str
    status: StorefrontInvoiceStatus
    issuedAt: str
    totals: StorefrontTotals
    lines: list[StorefrontQuoteLine]


class UsageInvoiceScope(TypedDict):
    sellerCompanyUuid: str
    appUuid: str
    buyerCompanyUuid: str


class UsagePeriod(TypedDict):
    start: str
    endExclusive: str


class UsageSource(TypedDict):
    accountCompanyUuid: str
    dataSpaceCompanyUuid: NotRequired[str]
    meter: UsageMeter


class UsageWindowEvidence(TypedDict):
    period: UsagePeriod
    quantity: str
    state: str
    sourceWatermark: str
    correctionGeneration: int
    calculationVersion: int


class UsagePricedLine(TypedDict):
    scope: UsageInvoiceScope
    period: UsagePeriod
    source: UsageSource
    tariff: UsageTariffRevision
    quantity: str
    rounding: str
    windows: list[UsageWindowEvidence]
    netAmount: StorefrontMoney
    taxAmount: StorefrontMoney
    grossAmount: StorefrontMoney


class UsageCertificate(TypedDict):
    enrollmentUuid: str
    closedAt: str
    line: UsagePricedLine


class IssueUsageResult(TypedDict):
    status: UsageIssuanceStatus
    invoice: NotRequired[UsageIssuedInvoice]
    usage: UsageCertificate


class UsageInvoiceOptIn(TypedDict):
    invoiceOnlyAttested: bool


class PublishUsageTariffRequest(TypedDict):
    tariffRevisionUuid: str
    productUuid: str
    description: str
    meter: UsageMeter
    effectiveFrom: str
    effectiveTo: NotRequired[str]
    rate: UsageRate
    tax: UsageTax


class ConfigureMerchant(TypedDict):
    merchantId: str
    expectedRevision: int
    businessTimeZone: str
    refundsEnabled: bool
    checkoutSecretKey: str
    paymentsReadToken: str


class SelectStorefrontAnalyticsDestination(TypedDict):
    siteUuid: str


class SelectStorefrontReceiptTemplate(TypedDict):
    revision: str


_DTO = TypeVar("_DTO")


class StorefrontClient:
    """The token selects the buyer or seller. Requests never override that identity."""

    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport

    def list_offers(self, storefront: str) -> StorefrontCatalogue:
        return self._call(StorefrontCatalogue, "GET", (storefront, "offers"))

    def publish_offer(self, storefront: str, request: StorefrontPublishOffer) -> StorefrontOffer:
        return self._call(StorefrontOffer, "POST", (storefront, "offers"), dict(request))

    def create_cart(self, storefront: str) -> StorefrontCart:
        return self._call(StorefrontCart, "POST", (storefront, "carts"))

    def get_cart(self, storefront: str, cart_uuid: str) -> StorefrontCart:
        return self._call(StorefrontCart, "GET", (storefront, "carts", cart_uuid))

    def update_line(
        self, storefront: str, cart_uuid: str, offer_uuid: str, request: StorefrontLineQuantity
    ) -> StorefrontCart:
        return self._call(StorefrontCart, "PUT", (storefront, "carts", cart_uuid, "lines", offer_uuid), dict(request))

    def create_quote(self, storefront: str, cart_uuid: str) -> StorefrontQuote:
        return _quote(self._call(StorefrontQuote, "POST", (storefront, "carts", cart_uuid, "quotes")))

    def get_quote(self, storefront: str, quote_uuid: str) -> StorefrontQuote:
        return _quote(self._call(StorefrontQuote, "GET", (storefront, "quotes", quote_uuid)))

    def checkout(self, storefront: str, quote_uuid: str) -> StorefrontPurchase:
        return _purchase(self._call(StorefrontPurchase, "POST", (storefront, "quotes", quote_uuid, "checkout")))

    def get_purchase(self, storefront: str, invoice_uuid: str) -> StorefrontPurchase:
        return _purchase(self._call(StorefrontPurchase, "GET", (storefront, "purchases", invoice_uuid)))

    def start_payment(self, storefront: str, invoice_uuid: str) -> StorefrontPurchase:
        return _purchase(self._call(StorefrontPurchase, "POST", (storefront, "purchases", invoice_uuid, "payment")))

    def issue_credit_note(
        self, storefront: str, invoice_uuid: str, request: StorefrontAdjustmentRequest
    ) -> StorefrontCreditNote:
        return _credit_note(
            self._call(
                StorefrontCreditNote, "POST", (storefront, "invoices", invoice_uuid, "credit-note"), dict(request)
            )
        )

    def revoke_merchant(self, request: RevokeMerchant) -> MerchantAccountResponse:
        return self._call(MerchantAccountResponse, "DELETE", ("merchant",), dict(request), prefix=("billing",))

    def disable_analytics_destination(self, slug: str) -> StorefrontAnalyticsDestination:
        return self._call(
            StorefrontAnalyticsDestination, "DELETE", (slug, "analytics-destination"), prefix=("billing", "storefronts")
        )

    def cancel_usage_schedule(self, storefront: str, enrollment_uuid: str) -> UsageSchedule:
        return self._call(
            UsageSchedule, "DELETE", (storefront, "usage-enrollments", enrollment_uuid, "scheduled-issuance")
        )

    def read_accounting_export(self, request: AccountingExportRequest) -> AccountingExport:
        return self._call(
            AccountingExport,
            "GET",
            ("accounting-export",),
            prefix=("billing",),
            query={
                "month": request["month"],
                "businessTimeZone": request["businessTimeZone"],
                "after": request.get("after"),
            },
        )

    def get_merchant(self) -> MerchantAccountResponse:
        return self._call(MerchantAccountResponse, "GET", ("merchant",), prefix=("billing",))

    def list_billing_partners(self, request: BillingPartnerPageRequest) -> BillingPartnerPage:
        return self._call(
            BillingPartnerPage, "GET", ("partners",), prefix=("billing",), query={"after": request.get("after")}
        )

    def list_referral_reviews(self, request: PartnerReferralPageRequest) -> ReferralReviewPage:
        return self._call(
            ReferralReviewPage,
            "GET",
            ("partners", "referral-reviews"),
            prefix=("billing",),
            query={"before": request.get("before")},
        )

    def list_billing_partner_sellers(self, request: BillingPartnerPageRequest) -> BillingPartnerSellerPage:
        return self._call(
            BillingPartnerSellerPage,
            "GET",
            ("partners", "sellers"),
            prefix=("billing",),
            query={"after": request.get("after")},
        )

    def get_seller_settlement_preference(self, seller_uuid: str) -> PartnerSettlementSelection:
        return self._call(
            PartnerSettlementSelection,
            "GET",
            ("partners", "sellers", seller_uuid, "settlement-preference"),
            prefix=("billing",),
        )

    def get_seller_tax_disclosure(self, seller_uuid: str) -> PartnerTaxDisclosureSelection:
        return self._call(
            PartnerTaxDisclosureSelection,
            "GET",
            ("partners", "sellers", seller_uuid, "tax-disclosure"),
            prefix=("billing",),
        )

    def get_partner_fee_balance(self, partner_uuid: str, request: PartnerFeeBalanceRequest) -> PartnerFeeBalance:
        return self._call(
            PartnerFeeBalance,
            "GET",
            ("partners", partner_uuid, "fee-balance"),
            prefix=("billing",),
            query={"asOf": request["asOf"]},
        )

    def list_partner_payouts(self, request: PartnerPayoutPageRequest) -> PartnerPayoutPage:
        return self._call(
            PartnerPayoutPage,
            "GET",
            ("partners", request["partnerCompanyUuid"], "payouts"),
            prefix=("billing",),
            query={"before": request.get("before")},
        )

    def list_partner_referral_terms(self, partner_uuid: str, request: PartnerReferralPageRequest) -> ReferralCodeTerms:
        return self._call(
            ReferralCodeTerms,
            "GET",
            ("partners", partner_uuid, "referral-terms"),
            prefix=("billing",),
            query={"before": request.get("before")},
        )

    def get_partner_settlement_preference(self, partner_uuid: str) -> PartnerSettlementSelection:
        return self._call(
            PartnerSettlementSelection, "GET", ("partners", partner_uuid, "settlement-preference"), prefix=("billing",)
        )

    def get_partner_tax_disclosure(self, partner_uuid: str) -> PartnerTaxDisclosureSelection:
        return self._call(
            PartnerTaxDisclosureSelection, "GET", ("partners", partner_uuid, "tax-disclosure"), prefix=("billing",)
        )

    def list_owned_storefronts(self) -> OwnedStorefronts:
        return self._call(OwnedStorefronts, "GET", (), prefix=("billing", "storefronts"))

    def get_analytics_destination(self, slug: str) -> StorefrontAnalyticsDestination:
        return self._call(
            StorefrontAnalyticsDestination, "GET", (slug, "analytics-destination"), prefix=("billing", "storefronts")
        )

    def list_seller_invoices(self, request: SellerInvoiceListRequest) -> SellerInvoiceList:
        return self._call(
            SellerInvoiceList,
            "GET",
            (request["storefront"], "invoices"),
            prefix=("billing", "storefronts"),
            query={"before": request.get("before")},
        )

    def list_partner_product_terms(self, request: PartnerProductTermsPageRequest) -> PartnerProductTermsPage:
        return self._call(
            PartnerProductTermsPage,
            "GET",
            (request["storefront"], "offers", request["offerUuid"], "partner-terms"),
            prefix=("billing", "storefronts"),
            query={"before": request.get("before")},
        )

    def get_partner_statement(self, request: StorefrontPartnerStatementRequest) -> StorefrontPartnerStatement:
        return self._call(
            StorefrontPartnerStatement,
            "GET",
            (request["storefront"], "partners", request["partnerCompanyUuid"], "statement"),
            prefix=("billing", "storefronts"),
            query={"month": request["month"], "cursor": request.get("cursor")},
        )

    def get_purchase_handoff(self, storefront: str, handoff_uuid: str) -> StorefrontPurchaseHandoff:
        value = self._call(
            StorefrontPurchaseHandoff,
            "GET",
            (storefront, "purchase-handoffs", handoff_uuid),
            prefix=("billing", "storefronts"),
        )
        _validate_money(value["amount"])
        return value

    def get_receipt_template(self, slug: str) -> StorefrontReceiptTemplateSelection:
        return self._call(
            StorefrontReceiptTemplateSelection, "GET", (slug, "receipt-template"), prefix=("billing", "storefronts")
        )

    def get_storefront_set_off_eligibility(self, storefront: str, invoice_uuid: str) -> StorefrontSetOffEligibility:
        return self._call(StorefrontSetOffEligibility, "GET", (storefront, "purchases", invoice_uuid, "set-off"))

    def list_usage_enrollments(self, request: StorefrontUsagePageRequest) -> UsageEnrollmentPage:
        return self._call(
            UsageEnrollmentPage,
            "GET",
            (request["storefront"], "usage-enrollments"),
            query={"before": request.get("before")},
        )

    def get_usage_schedule(self, storefront: str, enrollment_uuid: str) -> UsageSchedule:
        return self._call(
            UsageSchedule, "GET", (storefront, "usage-enrollments", enrollment_uuid, "scheduled-issuance")
        )

    def list_usage_tariffs(self, request: StorefrontUsagePageRequest) -> UsageTariffPage:
        return self._call(
            UsageTariffPage, "GET", (request["storefront"], "usage-tariffs"), query={"before": request.get("before")}
        )

    def get_usage_tariff(self, storefront: str, revision_uuid: str) -> UsageTariffRevision:
        return self._call(UsageTariffRevision, "GET", (storefront, "usage-tariffs", revision_uuid))

    def verify_merchant(self, request: VerifyMerchant) -> VerifyMerchantResult:
        return self._call(VerifyMerchantResult, "POST", ("merchant", "test"), dict(request), prefix=("billing",))

    def create_billing_partner_invitation(self) -> BillingPartnerInvitation:
        return self._call(BillingPartnerInvitation, "POST", ("partners", "invitations"), prefix=("billing",))

    def accept_billing_partner_invitation(
        self, request: AcceptBillingPartnerInvitationRequest
    ) -> AcceptedBillingPartnerInvitation:
        return self._call(
            AcceptedBillingPartnerInvitation,
            "POST",
            ("partners", "invitations", "accept"),
            dict(request),
            prefix=("billing",),
        )

    def retry_referral_review(self, attribution_uuid: str) -> ReferralReviewRetry:
        return self._call(
            ReferralReviewRetry,
            "POST",
            ("partners", "referral-reviews", attribution_uuid, "retry"),
            prefix=("billing",),
        )

    def record_partner_settlement_preference(
        self, seller_uuid: str, request: RecordPartnerSettlementPreferenceRequest
    ) -> PartnerSettlementPreference:
        return self._call(
            PartnerSettlementPreference,
            "POST",
            ("partners", "sellers", seller_uuid, "settlement-preference"),
            dict(request),
            prefix=("billing",),
        )

    def record_partner_tax_disclosure(
        self, seller_uuid: str, request: RecordPartnerTaxDisclosureRequest
    ) -> PartnerTaxDisclosure:
        return self._call(
            PartnerTaxDisclosure,
            "POST",
            ("partners", "sellers", seller_uuid, "tax-disclosure"),
            dict(request),
            prefix=("billing",),
        )

    def record_partner_payout(self, partner_uuid: str, request: RecordPartnerPayoutRequest) -> PartnerPayout:
        _validate_money(request["amount"])
        value = self._call(
            PartnerPayout, "POST", ("partners", partner_uuid, "payouts"), dict(request), prefix=("billing",)
        )
        _validate_money(value["amount"])
        return value

    def publish_partner_referral_terms(self, partner_uuid: str, request: PublishReferralTerms) -> ReferralCodeTerms:
        return self._call(
            ReferralCodeTerms, "POST", ("partners", partner_uuid, "referral-terms"), dict(request), prefix=("billing",)
        )

    def register_storefront(self, request: RegisterStorefront) -> StorefrontBinding:
        return self._call(StorefrontBinding, "POST", (), dict(request), prefix=("billing", "storefronts"))

    def publish_capacity_offer(self, storefront: str, request: PublishStorefrontCapacityOffer) -> StorefrontOffer:
        return self._call(
            StorefrontOffer, "POST", (storefront, "capacity-offers"), dict(request), prefix=("billing", "storefronts")
        )

    def publish_partner_product_terms(
        self, storefront: str, offer_uuid: str, request: PublishPartnerProductTermsRequest
    ) -> PartnerProductTermsVersion:
        return self._call(
            PartnerProductTermsVersion,
            "POST",
            (storefront, "offers", offer_uuid, "partner-terms"),
            dict(request),
            prefix=("billing", "storefronts"),
        )

    def create_purchase_handoff(
        self, storefront: str, request: CreateStorefrontPurchaseHandoff
    ) -> StorefrontPurchaseHandoff:
        _validate_money(request["amount"])
        value = self._call(
            StorefrontPurchaseHandoff,
            "POST",
            (storefront, "purchase-handoffs"),
            dict(request),
            prefix=("billing", "storefronts"),
        )
        _validate_money(value["amount"])
        return value

    def cancel_purchase_handoff(self, storefront: str, handoff_uuid: str) -> StorefrontPurchaseHandoff:
        value = self._call(
            StorefrontPurchaseHandoff,
            "POST",
            (storefront, "purchase-handoffs", handoff_uuid, "cancel"),
            prefix=("billing", "storefronts"),
        )
        _validate_money(value["amount"])
        return value

    def request_refund(
        self, storefront: str, invoice_uuid: str, request: StorefrontAdjustmentRequest
    ) -> StorefrontRefund:
        value = self._call(StorefrontRefund, "POST", (storefront, "invoices", invoice_uuid, "refund"), dict(request))
        _validate_money(value["amount"])
        return value

    def reconcile_refund(self, storefront: str, invoice_uuid: str) -> StorefrontRefund:
        value = self._call(StorefrontRefund, "POST", (storefront, "invoices", invoice_uuid, "refund", "reconcile"))
        _validate_money(value["amount"])
        return value

    def redeem_purchase_handoff(self, storefront: str, handoff_uuid: str) -> StorefrontQuote:
        return _quote(self._call(StorefrontQuote, "POST", (storefront, "purchase-handoffs", handoff_uuid, "redeem")))

    def apply_storefront_set_off(self, storefront: str, invoice_uuid: str) -> StorefrontSetOff:
        value = self._call(StorefrontSetOff, "POST", (storefront, "purchases", invoice_uuid, "set-off"))
        _validate_money(value["amount"])
        return value

    def issue_storefront_invoice(self, storefront: str, quote_uuid: str) -> StorefrontPurchase:
        return _purchase(self._call(StorefrontPurchase, "POST", (storefront, "quotes", quote_uuid, "invoice")))

    def enroll_usage(self, storefront: str, request: EnrollUsageRequest) -> UsageEnrollment:
        return self._call(UsageEnrollment, "POST", (storefront, "usage-enrollments"), dict(request))

    def issue_usage_invoice(self, storefront: str, enrollment_uuid: str) -> IssueUsageResult:
        return self._call(IssueUsageResult, "POST", (storefront, "usage-enrollments", enrollment_uuid, "issue"))

    def schedule_usage_invoice(
        self, storefront: str, enrollment_uuid: str, request: UsageInvoiceOptIn
    ) -> UsageSchedule:
        return self._call(
            UsageSchedule,
            "POST",
            (storefront, "usage-enrollments", enrollment_uuid, "scheduled-issuance"),
            dict(request),
        )

    def publish_usage_tariff(self, storefront: str, request: PublishUsageTariffRequest) -> UsageTariffRevision:
        return self._call(UsageTariffRevision, "POST", (storefront, "usage-tariffs"), dict(request))

    def configure_merchant(self, request: ConfigureMerchant) -> MerchantAccountResponse:
        return self._call(MerchantAccountResponse, "PUT", ("merchant",), dict(request), prefix=("billing",))

    def select_analytics_destination(
        self, slug: str, request: SelectStorefrontAnalyticsDestination
    ) -> StorefrontAnalyticsDestination:
        return self._call(
            StorefrontAnalyticsDestination,
            "PUT",
            (slug, "analytics-destination"),
            dict(request),
            prefix=("billing", "storefronts"),
        )

    def select_receipt_template(
        self, slug: str, request: SelectStorefrontReceiptTemplate
    ) -> StorefrontReceiptTemplateSelection:
        return self._call(
            StorefrontReceiptTemplateSelection,
            "PUT",
            (slug, "receipt-template"),
            dict(request),
            prefix=("billing", "storefronts"),
        )

    def _call(
        self,
        dto: type[_DTO],
        method: str,
        parts: tuple[str, ...],
        payload: dict[str, object] | None = None,
        *,
        prefix: tuple[str, ...] = ("storefronts",),
        query: dict[str, str | None] | None = None,
    ) -> _DTO:
        if any(part in ("", ".", "..") or "/" in part or "\\" in part for part in parts):
            raise ValueError("custd: invalid storefront path segment")
        path = "/api/v1/" + "/".join((*prefix, *(quote_path(part) for part in parts)))
        encoded = urlencode({key: value for key, value in (query or {}).items() if value})
        if encoded:
            path += "?" + encoded
        result = self._transport(
            method, self._client.base_url + path, payload, self._client._headers(), self._client.timeout
        )
        status = int(result["status"])
        if not 200 <= status < 300:
            raise problem_request_error(status, result.get("body"), "billing")
        body = result.get("body")
        return _decode_dto(dto, json.loads(body) if isinstance(body, str) else body)


def _validate_money(value: StorefrontMoney) -> None:
    amount = value["amountMinor"]
    if (
        not re.fullmatch(r"[A-Z]{3}", value["currency"])
        or not re.fullmatch(r"0|-?[1-9][0-9]{0,18}", amount)
        or not -(1 << 63) <= int(amount) < (1 << 63)
    ):
        raise ValueError("custd: invalid storefront money")


def _validate_totals(totals: StorefrontTotals) -> None:
    _validate_money(totals["netTotal"])
    _validate_money(totals["taxTotal"])
    _validate_money(totals["grossTotal"])


def _validate_lines(lines: list[StorefrontQuoteLine]) -> None:
    for line in lines:
        _validate_money(line["netAmount"])
        _validate_money(line["tax"]["amount"])
        _validate_money(line["grossAmount"])


def _quote(quote: StorefrontQuote) -> StorefrontQuote:
    _validate_totals(quote["totals"])
    _validate_lines(quote["lines"])
    return quote


def _credit_note(note: StorefrontCreditNote) -> StorefrontCreditNote:
    _validate_totals(note["totals"])
    _validate_lines(note.get("lines", []))
    return note


def _purchase(purchase: StorefrontPurchase) -> StorefrontPurchase:
    _validate_totals(purchase["totals"])
    if (receipt := purchase.get("receipt")) is not None:
        _validate_money(receipt["amountReceived"])
    if (note := purchase.get("creditNote")) is not None:
        _credit_note(note)
    return purchase
