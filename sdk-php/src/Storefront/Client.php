<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Admin\ApiHttp;

/** Buyer and seller operations on a credential-scoped storefront. */
final class Client
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Storefront bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    public function createPurchaseHandoff(string $storefront, CreatePurchaseHandoffRequest $request): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('POST', self::handoffPath($storefront), [], $request->serialise()));
    }

    public function getPurchaseHandoff(string $storefront, string $handoffUuid): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('GET', self::handoffPath($storefront).'/'.rawurlencode($handoffUuid)));
    }

    public function cancelPurchaseHandoff(string $storefront, string $handoffUuid): PurchaseHandoff
    {
        return PurchaseHandoff::fromPayload($this->http->object('POST', self::handoffPath($storefront).'/'.rawurlencode($handoffUuid).'/cancel'));
    }

    public function listOffers(string $storefront): Catalogue
    {
        return Catalogue::fromPayload($this->http->object('GET', self::path($storefront, 'offers')));
    }

    public function publishOffer(string $storefront, PublishOffer $request): Offer
    {
        return Offer::fromPayload($this->http->object('POST', self::path($storefront, 'offers'), [], $request->serialise()));
    }

    public function createCart(string $storefront): Cart
    {
        return Cart::fromPayload($this->http->object('POST', self::path($storefront, 'carts')));
    }

    public function getCart(string $storefront, string $cartUuid): Cart
    {
        return Cart::fromPayload($this->http->object('GET', self::path($storefront, 'carts', $cartUuid)));
    }

    public function updateLine(string $storefront, string $cartUuid, string $offerUuid, LineQuantity $request): Cart
    {
        $path = self::path($storefront, 'carts', $cartUuid, 'lines', $offerUuid);

        return Cart::fromPayload($this->http->object('PUT', $path, [], $request->serialise()));
    }

    public function createQuote(string $storefront, string $cartUuid): Quote
    {
        return Quote::fromPayload($this->http->object('POST', self::path($storefront, 'carts', $cartUuid, 'quotes')));
    }

    public function getQuote(string $storefront, string $quoteUuid): Quote
    {
        return Quote::fromPayload($this->http->object('GET', self::path($storefront, 'quotes', $quoteUuid)));
    }

    public function checkout(string $storefront, string $quoteUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('POST', self::path($storefront, 'quotes', $quoteUuid, 'checkout')));
    }

    public function getPurchase(string $storefront, string $invoiceUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('GET', self::path($storefront, 'purchases', $invoiceUuid)));
    }

    public function startPayment(string $storefront, string $invoiceUuid): Purchase
    {
        return Purchase::fromPayload($this->http->object('POST', self::path($storefront, 'purchases', $invoiceUuid, 'payment')));
    }

    public function issueCreditNote(string $storefront, string $invoiceUuid, AdjustmentRequest $request): CreditNote
    {
        $path = self::path($storefront, 'invoices', $invoiceUuid, 'credit-note');

        return CreditNote::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function revokeMerchant(RevokeMerchant $request): MerchantAccountResponse
    {
        $path = self::billingPath('/api/v1/billing', 'merchant');

        return MerchantAccountResponse::fromPayload($this->http->object('DELETE', $path, [], $request->serialise()));
    }

    public function disableAnalyticsDestination(string $slug): AnalyticsDestination
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $slug, 'analytics-destination');

        return AnalyticsDestination::fromPayload($this->http->object('DELETE', $path, []));
    }

    public function cancelUsageSchedule(string $storefront, string $enrollmentUuid): UsageSchedule
    {
        $path = self::path($storefront, 'usage-enrollments', $enrollmentUuid, 'scheduled-issuance');

        return UsageSchedule::fromPayload($this->http->object('DELETE', $path, []));
    }

    public function readAccountingExport(AccountingExportRequest $request): AccountingExport
    {
        $path = self::billingPath('/api/v1/billing', 'accounting-export');

        return AccountingExport::fromPayload($this->http->object('GET', $path, ['month' => $request->month, 'businessTimeZone' => $request->businessTimeZone, 'after' => $request->after]));
    }

    public function getMerchant(): MerchantAccountResponse
    {
        $path = self::billingPath('/api/v1/billing', 'merchant');

        return MerchantAccountResponse::fromPayload($this->http->object('GET', $path, []));
    }

    public function listBillingPartners(BillingPartnerPageRequest $request): BillingPartnerPage
    {
        $path = self::billingPath('/api/v1/billing', 'partners');

        return BillingPartnerPage::fromPayload($this->http->object('GET', $path, ['after' => $request->after]));
    }

    public function listReferralReviews(PartnerReferralPageRequest $request): ReferralReviewPage
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'referral-reviews');

        return ReferralReviewPage::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function listBillingPartnerSellers(BillingPartnerPageRequest $request): BillingPartnerSellerPage
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'sellers');

        return BillingPartnerSellerPage::fromPayload($this->http->object('GET', $path, ['after' => $request->after]));
    }

    public function getSellerSettlementPreference(string $sellerUuid): PartnerSettlementSelection
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'sellers', $sellerUuid, 'settlement-preference');

        return PartnerSettlementSelection::fromPayload($this->http->object('GET', $path, []));
    }

    public function getSellerTaxDisclosure(string $sellerUuid): PartnerTaxDisclosureSelection
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'sellers', $sellerUuid, 'tax-disclosure');

        return PartnerTaxDisclosureSelection::fromPayload($this->http->object('GET', $path, []));
    }

    public function getPartnerFeeBalance(string $partnerUuid, PartnerFeeBalanceRequest $request): PartnerFeeBalance
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'fee-balance');

        return PartnerFeeBalance::fromPayload($this->http->object('GET', $path, ['asOf' => $request->asOf]));
    }

    public function listPartnerPayouts(PartnerPayoutPageRequest $request): PartnerPayoutPage
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $request->partnerCompanyUuid, 'payouts');

        return PartnerPayoutPage::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function listPartnerReferralTerms(string $partnerUuid, PartnerReferralPageRequest $request): ReferralCodeTerms
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'referral-terms');

        return ReferralCodeTerms::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function getPartnerSettlementPreference(string $partnerUuid): PartnerSettlementSelection
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'settlement-preference');

        return PartnerSettlementSelection::fromPayload($this->http->object('GET', $path, []));
    }

    public function getPartnerTaxDisclosure(string $partnerUuid): PartnerTaxDisclosureSelection
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'tax-disclosure');

        return PartnerTaxDisclosureSelection::fromPayload($this->http->object('GET', $path, []));
    }

    public function listOwnedStorefronts(): OwnedStorefronts
    {
        $path = '/api/v1/billing/storefronts';

        return OwnedStorefronts::fromPayload($this->http->object('GET', $path, []));
    }

    public function getAnalyticsDestination(string $slug): AnalyticsDestination
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $slug, 'analytics-destination');

        return AnalyticsDestination::fromPayload($this->http->object('GET', $path, []));
    }

    public function listSellerInvoices(SellerInvoiceListRequest $request): SellerInvoiceList
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $request->storefront, 'invoices');

        return SellerInvoiceList::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function listPartnerProductTerms(PartnerProductTermsPageRequest $request): PartnerProductTermsPage
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $request->storefront, 'offers', $request->offerUuid, 'partner-terms');

        return PartnerProductTermsPage::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function getPartnerStatement(PartnerStatementRequest $request): PartnerStatement
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $request->storefront, 'partners', $request->partnerCompanyUuid, 'statement');

        return PartnerStatement::fromPayload($this->http->object('GET', $path, ['month' => $request->month, 'cursor' => $request->cursor]));
    }

    public function getReceiptTemplate(string $slug): ReceiptTemplateSelection
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $slug, 'receipt-template');

        return ReceiptTemplateSelection::fromPayload($this->http->object('GET', $path, []));
    }

    public function getStorefrontSetOffEligibility(string $storefront, string $invoiceUuid): SetOffEligibility
    {
        $path = self::path($storefront, 'purchases', $invoiceUuid, 'set-off');

        return SetOffEligibility::fromPayload($this->http->object('GET', $path, []));
    }

    public function listUsageEnrollments(UsagePageRequest $request): UsageEnrollmentPage
    {
        $path = self::path($request->storefront, 'usage-enrollments');

        return UsageEnrollmentPage::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function getUsageSchedule(string $storefront, string $enrollmentUuid): UsageSchedule
    {
        $path = self::path($storefront, 'usage-enrollments', $enrollmentUuid, 'scheduled-issuance');

        return UsageSchedule::fromPayload($this->http->object('GET', $path, []));
    }

    public function listUsageTariffs(UsagePageRequest $request): UsageTariffPage
    {
        $path = self::path($request->storefront, 'usage-tariffs');

        return UsageTariffPage::fromPayload($this->http->object('GET', $path, ['before' => $request->before]));
    }

    public function getUsageTariff(string $storefront, string $revisionUuid): UsageTariffRevision
    {
        $path = self::path($storefront, 'usage-tariffs', $revisionUuid);

        return UsageTariffRevision::fromPayload($this->http->object('GET', $path, []));
    }

    public function verifyMerchant(VerifyMerchant $request): VerifyMerchantResult
    {
        $path = self::billingPath('/api/v1/billing', 'merchant', 'test');

        return VerifyMerchantResult::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function createBillingPartnerInvitation(): BillingPartnerInvitation
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'invitations');

        return BillingPartnerInvitation::fromPayload($this->http->object('POST', $path, []));
    }

    public function acceptBillingPartnerInvitation(AcceptBillingPartnerInvitationRequest $request): AcceptedBillingPartnerInvitation
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'invitations', 'accept');

        return AcceptedBillingPartnerInvitation::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function retryReferralReview(string $attributionUuid): ReferralReviewRetry
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'referral-reviews', $attributionUuid, 'retry');

        return ReferralReviewRetry::fromPayload($this->http->object('POST', $path, []));
    }

    public function recordPartnerSettlementPreference(string $sellerUuid, RecordPartnerSettlementPreferenceRequest $request): PartnerSettlementPreference
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'sellers', $sellerUuid, 'settlement-preference');

        return PartnerSettlementPreference::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function recordPartnerTaxDisclosure(string $sellerUuid, RecordPartnerTaxDisclosureRequest $request): PartnerTaxDisclosure
    {
        $path = self::billingPath('/api/v1/billing', 'partners', 'sellers', $sellerUuid, 'tax-disclosure');

        return PartnerTaxDisclosure::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function recordPartnerPayout(string $partnerUuid, RecordPartnerPayoutRequest $request): PartnerPayout
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'payouts');

        return PartnerPayout::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function publishPartnerReferralTerms(string $partnerUuid, PublishReferralTerms $request): ReferralCodeTerms
    {
        $path = self::billingPath('/api/v1/billing', 'partners', $partnerUuid, 'referral-terms');

        return ReferralCodeTerms::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function registerStorefront(RegisterStorefront $request): Binding
    {
        $path = '/api/v1/billing/storefronts';

        return Binding::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function publishCapacityOffer(string $storefront, PublishStorefrontCapacityOffer $request): Offer
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $storefront, 'capacity-offers');

        return Offer::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function publishPartnerProductTerms(string $storefront, string $offerUuid, PublishPartnerProductTermsRequest $request): PartnerProductTermsVersion
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $storefront, 'offers', $offerUuid, 'partner-terms');

        return PartnerProductTermsVersion::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function requestRefund(string $storefront, string $invoiceUuid, AdjustmentRequest $request): Refund
    {
        $path = self::path($storefront, 'invoices', $invoiceUuid, 'refund');

        return Refund::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function reconcileRefund(string $storefront, string $invoiceUuid): Refund
    {
        $path = self::path($storefront, 'invoices', $invoiceUuid, 'refund', 'reconcile');

        return Refund::fromPayload($this->http->object('POST', $path, []));
    }

    public function redeemPurchaseHandoff(string $storefront, string $handoffUuid): Quote
    {
        $path = self::path($storefront, 'purchase-handoffs', $handoffUuid, 'redeem');

        return Quote::fromPayload($this->http->object('POST', $path, []));
    }

    public function applyStorefrontSetOff(string $storefront, string $invoiceUuid): SetOff
    {
        $path = self::path($storefront, 'purchases', $invoiceUuid, 'set-off');

        return SetOff::fromPayload($this->http->object('POST', $path, []));
    }

    public function issueStorefrontInvoice(string $storefront, string $quoteUuid): Purchase
    {
        $path = self::path($storefront, 'quotes', $quoteUuid, 'invoice');

        return Purchase::fromPayload($this->http->object('POST', $path, []));
    }

    public function enrollUsage(string $storefront, EnrollUsageRequest $request): UsageEnrollment
    {
        $path = self::path($storefront, 'usage-enrollments');

        return UsageEnrollment::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function issueUsageInvoice(string $storefront, string $enrollmentUuid): IssueUsageResult
    {
        $path = self::path($storefront, 'usage-enrollments', $enrollmentUuid, 'issue');

        return IssueUsageResult::fromPayload($this->http->object('POST', $path, []));
    }

    public function scheduleUsageInvoice(string $storefront, string $enrollmentUuid, UsageInvoiceOptIn $request): UsageSchedule
    {
        $path = self::path($storefront, 'usage-enrollments', $enrollmentUuid, 'scheduled-issuance');

        return UsageSchedule::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function publishUsageTariff(string $storefront, PublishUsageTariffRequest $request): UsageTariffRevision
    {
        $path = self::path($storefront, 'usage-tariffs');

        return UsageTariffRevision::fromPayload($this->http->object('POST', $path, [], $request->serialise()));
    }

    public function configureMerchant(ConfigureMerchant $request): MerchantAccountResponse
    {
        $path = self::billingPath('/api/v1/billing', 'merchant');

        return MerchantAccountResponse::fromPayload($this->http->object('PUT', $path, [], $request->serialise()));
    }

    public function selectAnalyticsDestination(string $slug, SelectStorefrontAnalyticsDestination $request): AnalyticsDestination
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $slug, 'analytics-destination');

        return AnalyticsDestination::fromPayload($this->http->object('PUT', $path, [], $request->serialise()));
    }

    public function selectReceiptTemplate(string $slug, SelectStorefrontReceiptTemplate $request): ReceiptTemplateSelection
    {
        $path = self::billingPath('/api/v1/billing/storefronts', $slug, 'receipt-template');

        return ReceiptTemplateSelection::fromPayload($this->http->object('PUT', $path, [], $request->serialise()));
    }

    private static function path(string ...$segments): string
    {
        return self::billingPath('/api/v1/storefronts', ...$segments);
    }

    private static function billingPath(string $prefix, string ...$segments): string
    {
        foreach ($segments as $segment) {
            if (in_array($segment, ['', '.', '..'], true) || str_contains($segment, '/') || str_contains($segment, '\\')) {
                throw new \InvalidArgumentException('Invalid storefront path segment');
            }
        }

        return $prefix.'/'.implode('/', array_map(rawurlencode(...), $segments));
    }

    private static function handoffPath(string $storefront): string
    {
        return '/api/v1/billing/storefronts/'.rawurlencode($storefront).'/purchase-handoffs';
    }
}
