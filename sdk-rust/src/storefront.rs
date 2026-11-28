//! Authenticated buyer and seller operations on a storefront.
use serde::{Deserialize, Serialize};

use crate::api_path::{NO_BODY, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};
use crate::{Error, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(try_from = "StorefrontMoneyRecord")]
pub struct StorefrontMoney {
    pub currency: String,
    pub amount_minor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontUnitPrice {
    pub currency: String,
    pub amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPriceRevision {
    pub price_revision_uuid: String,
    pub revision: i64,
    pub unit_price: StorefrontUnitPrice,
    pub tax_treatment: String,
    pub tax_rate: String,
    pub tax_label: String,
    pub effective_from: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontDataSpaceCapacity {
    pub extra_spaces_per_unit: i64,
    pub extra_producers_per_space_per_unit: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontOffer {
    pub offer_uuid: String,
    pub name: String,
    pub billing_interval: String,
    pub price_revision: StorefrontPriceRevision,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub data_space_capacity: Option<StorefrontDataSpaceCapacity>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub complementary_for_offer_uuid: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontCatalogue {
    #[serde(deserialize_with = "null_as_empty")]
    pub offers: Vec<StorefrontOffer>,
    pub can_publish: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPublishOffer {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub offer_uuid: Option<String>,
    pub name: String,
    pub billing_interval: String,
    pub unit_price: StorefrontUnitPrice,
    pub tax_rate: String,
    pub tax_label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effective_from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub complementary_for_offer_uuid: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontCartLine {
    pub offer_uuid: String,
    pub price_revision_uuid: String,
    pub quantity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontCart {
    pub cart_uuid: String,
    pub revision: i64,
    pub status: String,
    pub currency: String,
    pub created_at: String,
    #[serde(deserialize_with = "null_as_empty")]
    pub lines: Vec<StorefrontCartLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontLineQuantity {
    pub quantity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontTotals {
    pub net_total: StorefrontMoney,
    pub tax_total: StorefrontMoney,
    pub gross_total: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontTax {
    pub label: String,
    pub rate: String,
    pub rounding: String,
    pub rounding_point: String,
    pub amount: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontServicePeriod {
    pub start: String,
    pub end_exclusive: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontQuoteLine {
    pub line_number: i64,
    pub offer_uuid: String,
    pub price_revision_uuid: String,
    pub description: String,
    pub quantity: String,
    pub unit_price: StorefrontUnitPrice,
    pub extension_rounding: String,
    pub service_period: StorefrontServicePeriod,
    pub net_amount: StorefrontMoney,
    pub tax: StorefrontTax,
    pub gross_amount: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontQuote {
    pub quote_uuid: String,
    pub cart_uuid: String,
    pub cart_revision: i64,
    pub issued_at: String,
    pub expires_at: String,
    #[serde(deserialize_with = "null_as_empty")]
    pub lines: Vec<StorefrontQuoteLine>,
    pub totals: StorefrontTotals,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontReceiptDelivery {
    pub channel: String,
    pub notification_source_key: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontReceipt {
    pub receipt_uuid: String,
    pub receipt_number: String,
    pub invoice_uuid: String,
    pub payment_uuid: String,
    pub issued_at: String,
    pub amount_received: StorefrontMoney,
    pub delivery: StorefrontReceiptDelivery,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontBillingContact {
    pub company_uuid: String,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontCreditNote {
    pub credit_note_uuid: String,
    pub credit_note_number: String,
    pub totals: StorefrontTotals,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub invoice_number: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub invoice_issued_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issued_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bill_to: Option<StorefrontBillingContact>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seller_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lines: Option<Vec<StorefrontQuoteLine>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontAdjustmentRequest {
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPurchase {
    pub invoice_uuid: String,
    pub invoice_number: String,
    pub status: String,
    pub totals: StorefrontTotals,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checkout_state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub receipt: Option<StorefrontReceipt>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub credit_note: Option<StorefrontCreditNote>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_notice: Option<InvoiceNotice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub set_off: Option<StorefrontSetOff>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<UsageCertificate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refund: Option<StorefrontRefund>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MerchantAccount {
    pub account_uuid: String,
    pub seller_company_uuid: String,
    pub merchant_id: String,
    pub mode: String,
    pub revision: i64,
    pub status: String,
    pub refunds_enabled: bool,
    pub business_time_zone: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MerchantAccountResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account: Option<MerchantAccount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevokeMerchant {
    pub expected_revision: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontAnalyticsDestination {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub site_uuid: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InvoiceNoticeStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "sent")]
    Sent,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "unknown")]
    Unknown,
    #[serde(rename = "seller_unavailable")]
    SellerUnavailable,
    #[serde(rename = "review_required")]
    ReviewRequired,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InvoiceNoticeReason {
    #[serde(rename = "invalid_document")]
    InvalidDocument,
    #[serde(rename = "payload_mismatch")]
    PayloadMismatch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceNotice {
    pub status: InvoiceNoticeStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<InvoiceNoticeReason>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum UsageScheduleState {
    #[serde(rename = "scheduled")]
    Scheduled,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "invoice_issued")]
    InvoiceIssued,
    #[serde(rename = "no_amount_due")]
    NoAmountDue,
    #[serde(rename = "review_required")]
    ReviewRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSchedule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_notice: Option<InvoiceNotice>,
    pub enrollment_uuid: String,
    pub state: UsageScheduleState,
    pub consented_at: String,
    pub attempts: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_attempt_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountingRecordKind {
    #[serde(rename = "invoice")]
    Invoice,
    #[serde(rename = "credit_note")]
    CreditNote,
    #[serde(rename = "payment_allocation")]
    PaymentAllocation,
    #[serde(rename = "refund")]
    Refund,
    #[serde(rename = "partner_movement")]
    PartnerMovement,
    #[serde(rename = "partner_payout")]
    PartnerPayout,
    #[serde(rename = "partner_setoff")]
    PartnerSetoff,
    #[serde(rename = "partner_setoff_reversal")]
    PartnerSetoffReversal,
    #[serde(rename = "partner_product_projection_gap")]
    PartnerProductProjectionGap,
    #[serde(rename = "partner_referral_projection_gap")]
    PartnerReferralProjectionGap,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingDocument {
    pub number: String,
    pub issued_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub lines: Vec<StorefrontQuoteLine>,
    pub totals: StorefrontTotals,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountingPostingBasis {
    #[serde(rename = "provider_received_at")]
    ProviderReceivedAt,
    #[serde(rename = "recorded_received_date")]
    RecordedReceivedDate,
    #[serde(rename = "verification_date")]
    VerificationDate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingPayment {
    pub amount: StorefrontMoney,
    pub verified_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_received_at: Option<String>,
    pub provider: String,
    pub provider_reference: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_account_uuid: Option<String>,
    pub posting_basis: AccountingPostingBasis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingRefund {
    pub amount: StorefrontMoney,
    pub payment_uuid: String,
    pub processed_at: String,
    pub provider: String,
    pub provider_reference: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_account_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountingFeeKind {
    #[serde(rename = "product_fee")]
    ProductFee,
    #[serde(rename = "referral_fee")]
    ReferralFee,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingMovement {
    pub fee_kind: AccountingFeeKind,
    pub partner_company_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_movement_uuid: Option<String>,
    pub payment_uuid: String,
    pub terms_uuid: String,
    pub line_number: i64,
    pub available_on: String,
    pub partner_delta: StorefrontMoney,
    pub seller_cut_delta: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingEarningAllocation {
    pub earning_movement_uuid: String,
    pub amount_minor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingPayout {
    pub partner_company_uuid: String,
    pub amount: StorefrontMoney,
    pub external_reference: String,
    pub paid_at: String,
    pub preference_uuid: String,
    pub tax_disclosure_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<AccountingEarningAllocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingSetOff {
    pub set_off_uuid: String,
    pub partner_company_uuid: String,
    pub amount: StorefrontMoney,
    pub occurred_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credit_note_uuid: Option<String>,
    pub preference_uuid: String,
    pub tax_disclosure_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub allocations: Vec<AccountingEarningAllocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingProjectionGap {
    pub outcome: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingRecord {
    pub kind: AccountingRecordKind,
    pub record_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buyer_company_uuid: Option<String>,
    pub posted_on: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document: Option<AccountingDocument>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_allocation: Option<AccountingPayment>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refund: Option<AccountingRefund>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partner_movement: Option<AccountingMovement>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partner_payout: Option<AccountingPayout>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partner_set_off: Option<AccountingSetOff>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partner_projection_gap: Option<AccountingProjectionGap>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountingGap {
    #[serde(rename = "provider_fee_evidence_missing")]
    ProviderFeeEvidenceMissing,
    #[serde(rename = "provider_net_deposit_evidence_missing")]
    ProviderNetDepositEvidenceMissing,
    #[serde(rename = "provider_settlement_batch_reference_missing")]
    ProviderSettlementBatchReferenceMissing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingExport {
    pub seller_company_uuid: String,
    pub month: String,
    pub business_time_zone: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub records: Vec<AccountingRecord>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub source_gaps: Vec<AccountingGap>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_after: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingExportRequest {
    pub month: String,
    pub business_time_zone: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub after: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartner {
    pub partner_company_uuid: String,
    pub name: String,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartnerPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub partners: Vec<BillingPartner>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_after: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartnerPageRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub after: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReferralReviewEventType {
    #[serde(rename = "billing.payment.settled")]
    BillingPaymentSettled,
    #[serde(rename = "billing.payment.refunded")]
    BillingPaymentRefunded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferralReviewItem {
    pub attribution_uuid: String,
    pub event_uuid: String,
    pub buyer_company_uuid: String,
    pub partner_company_uuid: String,
    pub invoice_uuid: String,
    pub event_type: ReferralReviewEventType,
    pub failure_code: String,
    pub reviewed_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_received_on: Option<String>,
    pub retry_eligible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferralReviewPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reviews: Vec<ReferralReviewItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerReferralPageRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartnerSeller {
    pub seller_company_uuid: String,
    pub name: String,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartnerSellerPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sellers: Vec<BillingPartnerSeller>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_after: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PartnerSettlementMode {
    #[serde(rename = "payout")]
    Payout,
    #[serde(rename = "set_off")]
    SetOff,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerSettlementPreference {
    pub preference_uuid: String,
    pub mode: PartnerSettlementMode,
    pub effective_from: String,
    pub recorded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerSettlementSelection {
    pub seller_company_uuid: String,
    pub partner_company_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current: Option<PartnerSettlementPreference>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<PartnerSettlementPreference>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PartnerTaxStatus {
    #[serde(rename = "registered")]
    Registered,
    #[serde(rename = "not_registered")]
    NotRegistered,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerTaxDisclosure {
    pub disclosure_uuid: String,
    pub status: PartnerTaxStatus,
    pub jurisdiction: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registration_number: Option<String>,
    pub effective_from: String,
    pub recorded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerTaxDisclosureSelection {
    pub seller_company_uuid: String,
    pub partner_company_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current: Option<PartnerTaxDisclosure>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<PartnerTaxDisclosure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerFeeBalanceCurrency {
    pub held: StorefrontMoney,
    pub available: StorefrontMoney,
    pub negative: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerFeeBalance {
    pub seller_company_uuid: String,
    pub partner_company_uuid: String,
    pub as_of: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub currencies: Vec<PartnerFeeBalanceCurrency>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerFeeBalanceRequest {
    pub as_of: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerPayout {
    pub external_reference: String,
    pub amount: StorefrontMoney,
    pub paid_at: String,
    pub payout_uuid: String,
    pub partner_company_uuid: String,
    pub paid_on: String,
    pub recorded_at: String,
    pub preference_uuid: String,
    pub tax_disclosure_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerPayoutPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub payouts: Vec<PartnerPayout>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerPayoutPageRequest {
    pub partner_company_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferralTermsVersion {
    pub terms_uuid: String,
    pub effective_from: String,
    pub agreement_date: String,
    pub agreement_reference: String,
    pub recorded_by_user_uuid: String,
    pub share: String,
    pub months: i64,
    pub hold_days: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferralCodeTerms {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub business_time_zone: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub versions: Vec<ReferralTermsVersion>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontBinding {
    pub slug: String,
    pub seller_company_uuid: String,
    pub app_uuid: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnedStorefronts {
    pub seller_company_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub storefronts: Vec<StorefrontBinding>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StorefrontInvoiceStatus {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "paid")]
    Paid,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StorefrontPaymentStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "settled")]
    Settled,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StorefrontCheckoutState {
    #[serde(rename = "creating")]
    Creating,
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "review_required")]
    ReviewRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SellerInvoiceItem {
    pub invoice_uuid: String,
    pub invoice_number: String,
    pub issued_at: String,
    pub totals: StorefrontTotals,
    pub status: StorefrontInvoiceStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_status: Option<StorefrontPaymentStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checkout_state: Option<StorefrontCheckoutState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refund_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credit_note_uuid: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SellerInvoiceList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub invoices: Vec<SellerInvoiceItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SellerInvoiceListRequest {
    pub storefront: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerProductTermsVersion {
    pub partner_company_uuid: String,
    pub effective_from: String,
    pub agreement_date: String,
    pub agreement_reference: String,
    pub signed_agreement_attested: bool,
    pub unit_cost: String,
    pub seller_cut: String,
    pub terms_uuid: String,
    pub recorded_by_user_uuid: String,
    pub currency: String,
    pub hold_days: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerProductTermsPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub versions: Vec<PartnerProductTermsVersion>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartnerProductTermsPageRequest {
    pub storefront: String,
    pub offer_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPartnerEarning {
    pub gross: StorefrontMoney,
    pub tax: StorefrontMoney,
    pub net: StorefrontMoney,
    pub cost_to_provide: StorefrontMoney,
    pub remainder: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPartnerMovement {
    pub movement_uuid: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_movement_uuid: Option<String>,
    pub terms_uuid: String,
    pub buyer_company_uuid: String,
    pub invoice_uuid: String,
    pub payment_uuid: String,
    pub line_number: i64,
    pub posted_on: String,
    pub available_on: String,
    pub partner_delta: StorefrontMoney,
    pub seller_cut_delta: StorefrontMoney,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub earning: Option<StorefrontPartnerEarning>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPartnerStatement {
    pub seller_company_uuid: String,
    pub app_uuid: String,
    pub partner_company_uuid: String,
    pub month: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub movements: Vec<StorefrontPartnerMovement>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPartnerStatementRequest {
    pub storefront: String,
    pub partner_company_uuid: String,
    pub month: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontPurchaseHandoff {
    pub handoff_uuid: String,
    pub order_reference: String,
    pub offer_uuid: String,
    pub amount: StorefrontMoney,
    pub checkout_path: String,
    pub expires_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
    pub settled: bool,
    pub cancelled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontReceiptTemplateSelection {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontSetOffEligibility {
    pub eligible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageEnrollmentItem {
    pub tariff_description: String,
    pub enrollment_uuid: String,
    pub tariff_revision_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_space_company_uuid: Option<String>,
    pub period_start: String,
    pub close_not_before: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub closed_at: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageEnrollmentPage {
    pub can_schedule: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub enrollments: Vec<UsageEnrollmentItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontUsagePageRequest {
    pub storefront: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageMeter {
    pub slug: String,
    pub version: i64,
    pub unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageRate {
    pub currency: String,
    pub major_amount: String,
    pub per_units: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageTax {
    pub label: String,
    pub rate: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageTariffRevision {
    pub tariff_revision_uuid: String,
    pub product_uuid: String,
    pub description: String,
    pub meter: UsageMeter,
    pub effective_from: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_to: Option<String>,
    pub rate: UsageRate,
    pub tax: UsageTax,
    pub seller_company_uuid: String,
    pub app_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageTariffPage {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub tariffs: Vec<UsageTariffRevision>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_before: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyMerchantResult {
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyMerchant {
    pub app_uuid: String,
    pub invoice_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingPartnerInvitation {
    pub code: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AcceptedBillingPartnerInvitation {
    pub seller_company_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AcceptBillingPartnerInvitationRequest {
    pub code: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReferralRetryStatus {
    #[serde(rename = "blocked")]
    Blocked,
    #[serde(rename = "requeued")]
    Requeued,
    #[serde(rename = "no_review_to_retry")]
    NoReviewToRetry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReferralReviewRetry {
    pub attribution_uuid: String,
    pub status: ReferralRetryStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_code: Option<String>,
    pub requeued_count: i64,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPartnerSettlementPreferenceRequest {
    pub preference_uuid: String,
    pub mode: PartnerSettlementMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_from: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPartnerTaxDisclosureRequest {
    pub disclosure_uuid: String,
    pub status: PartnerTaxStatus,
    pub jurisdiction: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registration_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_from: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPartnerPayoutRequest {
    pub external_reference: String,
    pub amount: StorefrontMoney,
    pub paid_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishReferralTerms {
    pub code: String,
    pub effective_from: String,
    pub agreement_date: String,
    pub agreement_reference: String,
    pub signed_agreement_attested: bool,
    pub share: String,
    pub months: i64,
    pub hold_days: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterStorefront {
    pub slug: String,
    pub app_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishStorefrontCapacityOffer {
    pub offer_uuid: String,
    pub name: String,
    pub billing_interval: String,
    pub unit_price: StorefrontUnitPrice,
    pub tax_rate: String,
    pub tax_label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_from: Option<String>,
    pub data_space_capacity: StorefrontDataSpaceCapacity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPartnerProductTermsRequest {
    pub partner_company_uuid: String,
    pub effective_from: String,
    pub agreement_date: String,
    pub agreement_reference: String,
    pub signed_agreement_attested: bool,
    pub unit_cost: String,
    pub seller_cut: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStorefrontPurchaseHandoff {
    pub order_reference: String,
    pub offer_uuid: String,
    pub amount: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontRefund {
    pub refund_uuid: String,
    pub status: String,
    pub amount: StorefrontMoney,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requested_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontSetOffReversal {
    pub credit_note_uuid: String,
    pub reversed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorefrontSetOff {
    pub set_off_uuid: String,
    pub invoice_uuid: String,
    pub amount: StorefrontMoney,
    pub applied_at: String,
    pub applied_on: String,
    pub preference_uuid: String,
    pub tax_disclosure_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reversal: Option<StorefrontSetOffReversal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageEnrollment {
    pub enrollment_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnrollUsageRequest {
    pub tariff_revision_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_space_company_uuid: Option<String>,
    pub period_start: String,
    pub close_not_before: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum UsageIssuanceStatus {
    #[serde(rename = "invoice_issued")]
    InvoiceIssued,
    #[serde(rename = "no_amount_due")]
    NoAmountDue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageIssuedInvoice {
    pub invoice_uuid: String,
    pub invoice_number: String,
    pub status: StorefrontInvoiceStatus,
    pub issued_at: String,
    pub totals: StorefrontTotals,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub lines: Vec<StorefrontQuoteLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageInvoiceScope {
    pub seller_company_uuid: String,
    pub app_uuid: String,
    pub buyer_company_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsagePeriod {
    pub start: String,
    pub end_exclusive: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSource {
    pub account_company_uuid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_space_company_uuid: Option<String>,
    pub meter: UsageMeter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageWindowEvidence {
    pub period: UsagePeriod,
    pub quantity: String,
    pub state: String,
    pub source_watermark: String,
    pub correction_generation: i64,
    pub calculation_version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsagePricedLine {
    pub scope: UsageInvoiceScope,
    pub period: UsagePeriod,
    pub source: UsageSource,
    pub tariff: UsageTariffRevision,
    pub quantity: String,
    pub rounding: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub windows: Vec<UsageWindowEvidence>,
    pub net_amount: StorefrontMoney,
    pub tax_amount: StorefrontMoney,
    pub gross_amount: StorefrontMoney,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageCertificate {
    pub enrollment_uuid: String,
    pub closed_at: String,
    pub line: UsagePricedLine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueUsageResult {
    pub status: UsageIssuanceStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoice: Option<UsageIssuedInvoice>,
    pub usage: UsageCertificate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageInvoiceOptIn {
    pub invoice_only_attested: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishUsageTariffRequest {
    pub tariff_revision_uuid: String,
    pub product_uuid: String,
    pub description: String,
    pub meter: UsageMeter,
    pub effective_from: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_to: Option<String>,
    pub rate: UsageRate,
    pub tax: UsageTax,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigureMerchant {
    pub merchant_id: String,
    pub expected_revision: i64,
    pub business_time_zone: String,
    pub refunds_enabled: bool,
    pub checkout_secret_key: String,
    pub payments_read_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectStorefrontAnalyticsDestination {
    pub site_uuid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectStorefrontReceiptTemplate {
    pub revision: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StorefrontMoneyRecord {
    currency: String,
    amount_minor: String,
}

impl TryFrom<StorefrontMoneyRecord> for StorefrontMoney {
    type Error = &'static str;

    fn try_from(value: StorefrontMoneyRecord) -> std::result::Result<Self, Self::Error> {
        if value.currency.len() != 3 || !value.currency.bytes().all(|c| c.is_ascii_uppercase()) {
            return Err("invalid storefront money currency");
        }
        let amount = value
            .amount_minor
            .parse::<i64>()
            .map_err(|_| "invalid storefront minor-unit count")?;
        if amount.to_string() != value.amount_minor {
            return Err("invalid storefront minor-unit count");
        }
        Ok(Self {
            currency: value.currency,
            amount_minor: value.amount_minor,
        })
    }
}

fn storefront_path(parts: &[&str]) -> Result<String> {
    billing_path("/api/v1/storefronts", parts)
}

fn billing_path(prefix: &str, parts: &[&str]) -> Result<String> {
    let mut path = prefix.to_owned();
    for part in parts {
        if matches!(*part, "" | "." | "..") || part.contains(['/', '\\']) {
            return Err(Error::InvalidInput(
                "invalid storefront path segment".into(),
            ));
        }
        path.push('/');
        path.push_str(&percent_encode(part));
    }
    Ok(path)
}

impl CustdClient {
    pub fn list_storefront_offers(&self, storefront: &str) -> Result<StorefrontCatalogue> {
        self.call(
            Method::Get,
            &storefront_path(&[storefront, "offers"])?,
            NO_BODY,
        )
    }

    pub fn publish_storefront_offer(
        &self,
        storefront: &str,
        request: &StorefrontPublishOffer,
    ) -> Result<StorefrontOffer> {
        self.call(
            Method::Post,
            &storefront_path(&[storefront, "offers"])?,
            Some(request),
        )
    }

    pub fn create_storefront_cart(&self, storefront: &str) -> Result<StorefrontCart> {
        self.call(
            Method::Post,
            &storefront_path(&[storefront, "carts"])?,
            NO_BODY,
        )
    }

    pub fn get_storefront_cart(&self, storefront: &str, cart_uuid: &str) -> Result<StorefrontCart> {
        self.call(
            Method::Get,
            &storefront_path(&[storefront, "carts", cart_uuid])?,
            NO_BODY,
        )
    }

    pub fn update_storefront_line(
        &self,
        storefront: &str,
        cart_uuid: &str,
        offer_uuid: &str,
        request: &StorefrontLineQuantity,
    ) -> Result<StorefrontCart> {
        let path = storefront_path(&[storefront, "carts", cart_uuid, "lines", offer_uuid])?;
        self.call(Method::Put, &path, Some(request))
    }

    pub fn create_storefront_quote(
        &self,
        storefront: &str,
        cart_uuid: &str,
    ) -> Result<StorefrontQuote> {
        self.call(
            Method::Post,
            &storefront_path(&[storefront, "carts", cart_uuid, "quotes"])?,
            NO_BODY,
        )
    }

    pub fn get_storefront_quote(
        &self,
        storefront: &str,
        quote_uuid: &str,
    ) -> Result<StorefrontQuote> {
        self.call(
            Method::Get,
            &storefront_path(&[storefront, "quotes", quote_uuid])?,
            NO_BODY,
        )
    }

    pub fn checkout_storefront_quote(
        &self,
        storefront: &str,
        quote_uuid: &str,
    ) -> Result<StorefrontPurchase> {
        self.call(
            Method::Post,
            &storefront_path(&[storefront, "quotes", quote_uuid, "checkout"])?,
            NO_BODY,
        )
    }

    pub fn get_storefront_purchase(
        &self,
        storefront: &str,
        invoice_uuid: &str,
    ) -> Result<StorefrontPurchase> {
        self.call(
            Method::Get,
            &storefront_path(&[storefront, "purchases", invoice_uuid])?,
            NO_BODY,
        )
    }

    pub fn start_storefront_payment(
        &self,
        storefront: &str,
        invoice_uuid: &str,
    ) -> Result<StorefrontPurchase> {
        self.call(
            Method::Post,
            &storefront_path(&[storefront, "purchases", invoice_uuid, "payment"])?,
            NO_BODY,
        )
    }

    pub fn issue_storefront_credit_note(
        &self,
        storefront: &str,
        invoice_uuid: &str,
        request: &StorefrontAdjustmentRequest,
    ) -> Result<StorefrontCreditNote> {
        let path = storefront_path(&[storefront, "invoices", invoice_uuid, "credit-note"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn revoke_merchant(&self, request: &RevokeMerchant) -> Result<MerchantAccountResponse> {
        let path = billing_path("/api/v1/billing", &["merchant"])?;
        self.call(Method::Delete, &path, Some(request))
    }

    pub fn disable_analytics_destination(
        &self,
        slug: &str,
    ) -> Result<StorefrontAnalyticsDestination> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[slug, "analytics-destination"],
        )?;
        self.call(Method::Delete, &path, NO_BODY)
    }

    pub fn cancel_usage_schedule(
        &self,
        storefront: &str,
        enrollment_uuid: &str,
    ) -> Result<UsageSchedule> {
        let path = storefront_path(&[
            storefront,
            "usage-enrollments",
            enrollment_uuid,
            "scheduled-issuance",
        ])?;
        self.call(Method::Delete, &path, NO_BODY)
    }

    pub fn read_accounting_export(
        &self,
        request: &AccountingExportRequest,
    ) -> Result<AccountingExport> {
        let path = billing_path("/api/v1/billing", &["accounting-export"])?;
        let path = api_path(
            path,
            &[
                ("month", Some(request.month.clone())),
                ("businessTimeZone", Some(request.business_time_zone.clone())),
                ("after", request.after.clone()),
            ],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_merchant(&self) -> Result<MerchantAccountResponse> {
        let path = billing_path("/api/v1/billing", &["merchant"])?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_billing_partners(
        &self,
        request: &BillingPartnerPageRequest,
    ) -> Result<BillingPartnerPage> {
        let path = billing_path("/api/v1/billing", &["partners"])?;
        let path = api_path(path, &[("after", request.after.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_referral_reviews(
        &self,
        request: &PartnerReferralPageRequest,
    ) -> Result<ReferralReviewPage> {
        let path = billing_path("/api/v1/billing", &["partners", "referral-reviews"])?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_billing_partner_sellers(
        &self,
        request: &BillingPartnerPageRequest,
    ) -> Result<BillingPartnerSellerPage> {
        let path = billing_path("/api/v1/billing", &["partners", "sellers"])?;
        let path = api_path(path, &[("after", request.after.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_seller_settlement_preference(
        &self,
        seller_uuid: &str,
    ) -> Result<PartnerSettlementSelection> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", "sellers", seller_uuid, "settlement-preference"],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_seller_tax_disclosure(
        &self,
        seller_uuid: &str,
    ) -> Result<PartnerTaxDisclosureSelection> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", "sellers", seller_uuid, "tax-disclosure"],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_partner_fee_balance(
        &self,
        partner_uuid: &str,
        request: &PartnerFeeBalanceRequest,
    ) -> Result<PartnerFeeBalance> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", partner_uuid, "fee-balance"],
        )?;
        let path = api_path(path, &[("asOf", Some(request.as_of.clone()))], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_partner_payouts(
        &self,
        request: &PartnerPayoutPageRequest,
    ) -> Result<PartnerPayoutPage> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", &request.partner_company_uuid, "payouts"],
        )?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_partner_referral_terms(
        &self,
        partner_uuid: &str,
        request: &PartnerReferralPageRequest,
    ) -> Result<ReferralCodeTerms> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", partner_uuid, "referral-terms"],
        )?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_partner_settlement_preference(
        &self,
        partner_uuid: &str,
    ) -> Result<PartnerSettlementSelection> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", partner_uuid, "settlement-preference"],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_partner_tax_disclosure(
        &self,
        partner_uuid: &str,
    ) -> Result<PartnerTaxDisclosureSelection> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", partner_uuid, "tax-disclosure"],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_owned_storefronts(&self) -> Result<OwnedStorefronts> {
        let path = "/api/v1/billing/storefronts".to_owned();
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_analytics_destination(&self, slug: &str) -> Result<StorefrontAnalyticsDestination> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[slug, "analytics-destination"],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_seller_invoices(
        &self,
        request: &SellerInvoiceListRequest,
    ) -> Result<SellerInvoiceList> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[&request.storefront, "invoices"],
        )?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_partner_product_terms(
        &self,
        request: &PartnerProductTermsPageRequest,
    ) -> Result<PartnerProductTermsPage> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[
                &request.storefront,
                "offers",
                &request.offer_uuid,
                "partner-terms",
            ],
        )?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_partner_statement(
        &self,
        request: &StorefrontPartnerStatementRequest,
    ) -> Result<StorefrontPartnerStatement> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[
                &request.storefront,
                "partners",
                &request.partner_company_uuid,
                "statement",
            ],
        )?;
        let path = api_path(
            path,
            &[
                ("month", Some(request.month.clone())),
                ("cursor", request.cursor.clone()),
            ],
            None,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_purchase_handoff(
        &self,
        storefront: &str,
        handoff_uuid: &str,
    ) -> Result<StorefrontPurchaseHandoff> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[storefront, "purchase-handoffs", handoff_uuid],
        )?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_receipt_template(&self, slug: &str) -> Result<StorefrontReceiptTemplateSelection> {
        let path = billing_path("/api/v1/billing/storefronts", &[slug, "receipt-template"])?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_storefront_set_off_eligibility(
        &self,
        storefront: &str,
        invoice_uuid: &str,
    ) -> Result<StorefrontSetOffEligibility> {
        let path = storefront_path(&[storefront, "purchases", invoice_uuid, "set-off"])?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_usage_enrollments(
        &self,
        request: &StorefrontUsagePageRequest,
    ) -> Result<UsageEnrollmentPage> {
        let path = storefront_path(&[&request.storefront, "usage-enrollments"])?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_usage_schedule(
        &self,
        storefront: &str,
        enrollment_uuid: &str,
    ) -> Result<UsageSchedule> {
        let path = storefront_path(&[
            storefront,
            "usage-enrollments",
            enrollment_uuid,
            "scheduled-issuance",
        ])?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn list_usage_tariffs(
        &self,
        request: &StorefrontUsagePageRequest,
    ) -> Result<UsageTariffPage> {
        let path = storefront_path(&[&request.storefront, "usage-tariffs"])?;
        let path = api_path(path, &[("before", request.before.clone())], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn get_usage_tariff(
        &self,
        storefront: &str,
        revision_uuid: &str,
    ) -> Result<UsageTariffRevision> {
        let path = storefront_path(&[storefront, "usage-tariffs", revision_uuid])?;
        self.call(Method::Get, &path, NO_BODY)
    }

    pub fn verify_merchant(&self, request: &VerifyMerchant) -> Result<VerifyMerchantResult> {
        let path = billing_path("/api/v1/billing", &["merchant", "test"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn create_billing_partner_invitation(&self) -> Result<BillingPartnerInvitation> {
        let path = billing_path("/api/v1/billing", &["partners", "invitations"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn accept_billing_partner_invitation(
        &self,
        request: &AcceptBillingPartnerInvitationRequest,
    ) -> Result<AcceptedBillingPartnerInvitation> {
        let path = billing_path("/api/v1/billing", &["partners", "invitations", "accept"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn retry_referral_review(&self, attribution_uuid: &str) -> Result<ReferralReviewRetry> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", "referral-reviews", attribution_uuid, "retry"],
        )?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn record_partner_settlement_preference(
        &self,
        seller_uuid: &str,
        request: &RecordPartnerSettlementPreferenceRequest,
    ) -> Result<PartnerSettlementPreference> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", "sellers", seller_uuid, "settlement-preference"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn record_partner_tax_disclosure(
        &self,
        seller_uuid: &str,
        request: &RecordPartnerTaxDisclosureRequest,
    ) -> Result<PartnerTaxDisclosure> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", "sellers", seller_uuid, "tax-disclosure"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn record_partner_payout(
        &self,
        partner_uuid: &str,
        request: &RecordPartnerPayoutRequest,
    ) -> Result<PartnerPayout> {
        let path = billing_path("/api/v1/billing", &["partners", partner_uuid, "payouts"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn publish_partner_referral_terms(
        &self,
        partner_uuid: &str,
        request: &PublishReferralTerms,
    ) -> Result<ReferralCodeTerms> {
        let path = billing_path(
            "/api/v1/billing",
            &["partners", partner_uuid, "referral-terms"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn register_storefront(&self, request: &RegisterStorefront) -> Result<StorefrontBinding> {
        let path = "/api/v1/billing/storefronts".to_owned();
        self.call(Method::Post, &path, Some(request))
    }

    pub fn publish_capacity_offer(
        &self,
        storefront: &str,
        request: &PublishStorefrontCapacityOffer,
    ) -> Result<StorefrontOffer> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[storefront, "capacity-offers"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn publish_partner_product_terms(
        &self,
        storefront: &str,
        offer_uuid: &str,
        request: &PublishPartnerProductTermsRequest,
    ) -> Result<PartnerProductTermsVersion> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[storefront, "offers", offer_uuid, "partner-terms"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn create_purchase_handoff(
        &self,
        storefront: &str,
        request: &CreateStorefrontPurchaseHandoff,
    ) -> Result<StorefrontPurchaseHandoff> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[storefront, "purchase-handoffs"],
        )?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn cancel_purchase_handoff(
        &self,
        storefront: &str,
        handoff_uuid: &str,
    ) -> Result<StorefrontPurchaseHandoff> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[storefront, "purchase-handoffs", handoff_uuid, "cancel"],
        )?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn request_refund(
        &self,
        storefront: &str,
        invoice_uuid: &str,
        request: &StorefrontAdjustmentRequest,
    ) -> Result<StorefrontRefund> {
        let path = storefront_path(&[storefront, "invoices", invoice_uuid, "refund"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn reconcile_refund(
        &self,
        storefront: &str,
        invoice_uuid: &str,
    ) -> Result<StorefrontRefund> {
        let path = storefront_path(&[storefront, "invoices", invoice_uuid, "refund", "reconcile"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn redeem_purchase_handoff(
        &self,
        storefront: &str,
        handoff_uuid: &str,
    ) -> Result<StorefrontQuote> {
        let path = storefront_path(&[storefront, "purchase-handoffs", handoff_uuid, "redeem"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn apply_storefront_set_off(
        &self,
        storefront: &str,
        invoice_uuid: &str,
    ) -> Result<StorefrontSetOff> {
        let path = storefront_path(&[storefront, "purchases", invoice_uuid, "set-off"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn issue_storefront_invoice(
        &self,
        storefront: &str,
        quote_uuid: &str,
    ) -> Result<StorefrontPurchase> {
        let path = storefront_path(&[storefront, "quotes", quote_uuid, "invoice"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn enroll_usage(
        &self,
        storefront: &str,
        request: &EnrollUsageRequest,
    ) -> Result<UsageEnrollment> {
        let path = storefront_path(&[storefront, "usage-enrollments"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn issue_usage_invoice(
        &self,
        storefront: &str,
        enrollment_uuid: &str,
    ) -> Result<IssueUsageResult> {
        let path = storefront_path(&[storefront, "usage-enrollments", enrollment_uuid, "issue"])?;
        self.call(Method::Post, &path, NO_BODY)
    }

    pub fn schedule_usage_invoice(
        &self,
        storefront: &str,
        enrollment_uuid: &str,
        request: &UsageInvoiceOptIn,
    ) -> Result<UsageSchedule> {
        let path = storefront_path(&[
            storefront,
            "usage-enrollments",
            enrollment_uuid,
            "scheduled-issuance",
        ])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn publish_usage_tariff(
        &self,
        storefront: &str,
        request: &PublishUsageTariffRequest,
    ) -> Result<UsageTariffRevision> {
        let path = storefront_path(&[storefront, "usage-tariffs"])?;
        self.call(Method::Post, &path, Some(request))
    }

    pub fn configure_merchant(
        &self,
        request: &ConfigureMerchant,
    ) -> Result<MerchantAccountResponse> {
        let path = billing_path("/api/v1/billing", &["merchant"])?;
        self.call(Method::Put, &path, Some(request))
    }

    pub fn select_analytics_destination(
        &self,
        slug: &str,
        request: &SelectStorefrontAnalyticsDestination,
    ) -> Result<StorefrontAnalyticsDestination> {
        let path = billing_path(
            "/api/v1/billing/storefronts",
            &[slug, "analytics-destination"],
        )?;
        self.call(Method::Put, &path, Some(request))
    }

    pub fn select_receipt_template(
        &self,
        slug: &str,
        request: &SelectStorefrontReceiptTemplate,
    ) -> Result<StorefrontReceiptTemplateSelection> {
        let path = billing_path("/api/v1/billing/storefronts", &[slug, "receipt-template"])?;
        self.call(Method::Put, &path, Some(request))
    }
}

#[cfg(test)]
mod tests {
    use super::StorefrontPurchase;

    #[test]
    fn purchase_keeps_exact_minor_units() {
        let fixture = include_str!("../../contract-fixtures/storefront-purchase.json");
        let purchase: StorefrontPurchase = serde_json::from_str(fixture).unwrap();
        assert_eq!(purchase.totals.gross_total.amount_minor, "9007199254740993");
        assert_eq!(purchase.payment_status.as_deref(), Some("pending"));

        let invalid = fixture.replace("9007199254740993", "09007199254740993");
        assert!(serde_json::from_str::<StorefrontPurchase>(&invalid).is_err());
    }
}
