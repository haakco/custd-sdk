//! Authenticated buyer and seller operations on a storefront.
use serde::{Deserialize, Serialize};

use crate::api_path::NO_BODY;
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
    let mut path = "/api/v1/storefronts".to_owned();
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
