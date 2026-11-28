use crate::{Row, bodiless};

use super::body;

pub fn rows() -> Vec<Row> {
    vec![
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/offers",
            "/api/v1/storefronts/shop/offers",
            |c| drop(c.custd.list_storefront_offers("shop")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/offers",
            "/api/v1/storefronts/shop/offers",
            |c| {
                drop(c.custd.publish_storefront_offer("shop", &body(r#"{"name":"Starter","billingInterval":"month","unitPrice":{"currency":"ZAR","amount":"15.25"},"taxRate":"0.15","taxLabel":"VAT"}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/carts",
            "/api/v1/storefronts/shop/carts",
            |c| drop(c.custd.create_storefront_cart("shop")),
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/carts/{cart}",
            "/api/v1/storefronts/shop/carts/cart-1",
            |c| drop(c.custd.get_storefront_cart("shop", "cart-1")),
        ),
        bodiless(
            "billing PUT /api/v1/storefronts/{storefront}/carts/{cart}/lines/{offer}",
            "/api/v1/storefronts/shop/carts/cart-1/lines/offer-1",
            |c| {
                drop(c.custd.update_storefront_line(
                    "shop",
                    "cart-1",
                    "offer-1",
                    &body(r#"{"quantity":"2.50"}"#),
                ))
            },
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/carts/{cart}/quotes",
            "/api/v1/storefronts/shop/carts/cart-1/quotes",
            |c| drop(c.custd.create_storefront_quote("shop", "cart-1")),
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/quotes/{quote}",
            "/api/v1/storefronts/shop/quotes/quote-1",
            |c| drop(c.custd.get_storefront_quote("shop", "quote-1")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/quotes/{quote}/checkout",
            "/api/v1/storefronts/shop/quotes/quote-1/checkout",
            |c| drop(c.custd.checkout_storefront_quote("shop", "quote-1")),
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/purchases/{invoice}",
            "/api/v1/storefronts/shop/purchases/invoice-1",
            |c| drop(c.custd.get_storefront_purchase("shop", "invoice-1")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/purchases/{invoice}/payment",
            "/api/v1/storefronts/shop/purchases/invoice-1/payment",
            |c| drop(c.custd.start_storefront_payment("shop", "invoice-1")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/credit-note",
            "/api/v1/storefronts/shop/invoices/invoice-1/credit-note",
            |c| {
                drop(c.custd.issue_storefront_credit_note(
                    "shop",
                    "invoice-1",
                    &body(r#"{"reason":"Duplicate sale"}"#),
                ))
            },
        ),
        bodiless(
            "billing DELETE /api/v1/billing/merchant",
            "/api/v1/billing/merchant",
            |c| drop(c.custd.revoke_merchant(&body(r#"{"expectedRevision":1}"#))),
        ),
        bodiless(
            "billing DELETE /api/v1/billing/storefronts/{storefront}/analytics-destination",
            "/api/v1/billing/storefronts/shop/analytics-destination",
            |c| drop(c.custd.disable_analytics_destination("shop")),
        ),
        bodiless(
            "billing DELETE /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
            "/api/v1/storefronts/shop/usage-enrollments/enrollment/scheduled-issuance",
            |c| drop(c.custd.cancel_usage_schedule("shop", "enrollment")),
        ),
        bodiless(
            "billing GET /api/v1/billing/accounting-export",
            "/api/v1/billing/accounting-export?month=2026-11&businessTimeZone=UTC&after=sample-after",
            |c| {
                drop(c.custd.read_accounting_export(&body(
                    r#"{"month":"2026-11","businessTimeZone":"UTC","after":"sample-after"}"#,
                )))
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/merchant",
            "/api/v1/billing/merchant",
            |c| drop(c.custd.get_merchant()),
        ),
        bodiless(
            "billing GET /api/v1/billing/partners",
            "/api/v1/billing/partners?after=sample-after",
            |c| {
                drop(
                    c.custd
                        .list_billing_partners(&body(r#"{"after":"sample-after"}"#)),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/referral-reviews",
            "/api/v1/billing/partners/referral-reviews?before=sample-before",
            |c| {
                drop(
                    c.custd
                        .list_referral_reviews(&body(r#"{"before":"sample-before"}"#)),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/sellers",
            "/api/v1/billing/partners/sellers?after=sample-after",
            |c| {
                drop(
                    c.custd
                        .list_billing_partner_sellers(&body(r#"{"after":"sample-after"}"#)),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/sellers/{seller}/settlement-preference",
            "/api/v1/billing/partners/sellers/seller/settlement-preference",
            |c| drop(c.custd.get_seller_settlement_preference("seller")),
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/sellers/{seller}/tax-disclosure",
            "/api/v1/billing/partners/sellers/seller/tax-disclosure",
            |c| drop(c.custd.get_seller_tax_disclosure("seller")),
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/{partner}/fee-balance",
            "/api/v1/billing/partners/partner/fee-balance?asOf=2026-11-01",
            |c| {
                drop(
                    c.custd
                        .get_partner_fee_balance("partner", &body(r#"{"asOf":"2026-11-01"}"#)),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/{partner}/payouts",
            "/api/v1/billing/partners/partner/payouts?before=sample-before",
            |c| {
                drop(c.custd.list_partner_payouts(&body(
                    r#"{"partnerCompanyUuid":"partner","before":"sample-before"}"#,
                )))
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/{partner}/referral-terms",
            "/api/v1/billing/partners/partner/referral-terms?before=sample-before",
            |c| {
                drop(
                    c.custd.list_partner_referral_terms(
                        "partner",
                        &body(r#"{"before":"sample-before"}"#),
                    ),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/{partner}/settlement-preference",
            "/api/v1/billing/partners/partner/settlement-preference",
            |c| drop(c.custd.get_partner_settlement_preference("partner")),
        ),
        bodiless(
            "billing GET /api/v1/billing/partners/{partner}/tax-disclosure",
            "/api/v1/billing/partners/partner/tax-disclosure",
            |c| drop(c.custd.get_partner_tax_disclosure("partner")),
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts",
            "/api/v1/billing/storefronts",
            |c| drop(c.custd.list_owned_storefronts()),
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/analytics-destination",
            "/api/v1/billing/storefronts/shop/analytics-destination",
            |c| drop(c.custd.get_analytics_destination("shop")),
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/invoices",
            "/api/v1/billing/storefronts/shop/invoices?before=sample-before",
            |c| {
                drop(c.custd.list_seller_invoices(&body(
                    r#"{"storefront":"shop","before":"sample-before"}"#,
                )))
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms",
            "/api/v1/billing/storefronts/shop/offers/offer/partner-terms?before=sample-before",
            |c| {
                drop(c.custd.list_partner_product_terms(&body(
                    r#"{"storefront":"shop","offerUuid":"offer","before":"sample-before"}"#,
                )))
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/partners/{partner}/statement",
            "/api/v1/billing/storefronts/shop/partners/partner/statement?month=2026-11&cursor=sample-cursor",
            |c| {
                drop(c.custd.get_partner_statement(&body(r#"{"storefront":"shop","partnerCompanyUuid":"partner","month":"2026-11","cursor":"sample-cursor"}"#)))
            },
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}",
            "/api/v1/billing/storefronts/shop/purchase-handoffs/handoff",
            |c| drop(c.custd.get_purchase_handoff("shop", "handoff")),
        ),
        bodiless(
            "billing GET /api/v1/billing/storefronts/{storefront}/receipt-template",
            "/api/v1/billing/storefronts/shop/receipt-template",
            |c| drop(c.custd.get_receipt_template("shop")),
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off",
            "/api/v1/storefronts/shop/purchases/invoice/set-off",
            |c| {
                drop(
                    c.custd
                        .get_storefront_set_off_eligibility("shop", "invoice"),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/usage-enrollments",
            "/api/v1/storefronts/shop/usage-enrollments?before=sample-before",
            |c| {
                drop(c.custd.list_usage_enrollments(&body(
                    r#"{"storefront":"shop","before":"sample-before"}"#,
                )))
            },
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
            "/api/v1/storefronts/shop/usage-enrollments/enrollment/scheduled-issuance",
            |c| drop(c.custd.get_usage_schedule("shop", "enrollment")),
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/usage-tariffs",
            "/api/v1/storefronts/shop/usage-tariffs?before=sample-before",
            |c| {
                drop(
                    c.custd.list_usage_tariffs(&body(
                        r#"{"storefront":"shop","before":"sample-before"}"#,
                    )),
                )
            },
        ),
        bodiless(
            "billing GET /api/v1/storefronts/{storefront}/usage-tariffs/{revision}",
            "/api/v1/storefronts/shop/usage-tariffs/revision",
            |c| drop(c.custd.get_usage_tariff("shop", "revision")),
        ),
        bodiless(
            "billing POST /api/v1/billing/merchant/test",
            "/api/v1/billing/merchant/test",
            |c| {
                drop(
                    c.custd
                        .verify_merchant(&body(r#"{"appUuid":"example","invoiceUuid":"example"}"#)),
                )
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/invitations",
            "/api/v1/billing/partners/invitations",
            |c| drop(c.custd.create_billing_partner_invitation()),
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/invitations/accept",
            "/api/v1/billing/partners/invitations/accept",
            |c| {
                drop(
                    c.custd
                        .accept_billing_partner_invitation(&body(r#"{"code":"example"}"#)),
                )
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/referral-reviews/{attribution}/retry",
            "/api/v1/billing/partners/referral-reviews/attribution/retry",
            |c| drop(c.custd.retry_referral_review("attribution")),
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/sellers/{seller}/settlement-preference",
            "/api/v1/billing/partners/sellers/seller/settlement-preference",
            |c| {
                drop(c.custd.record_partner_settlement_preference(
                    "seller",
                    &body(r#"{"preferenceUuid":"example","mode":"payout"}"#),
                ))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/sellers/{seller}/tax-disclosure",
            "/api/v1/billing/partners/sellers/seller/tax-disclosure",
            |c| {
                drop(c.custd.record_partner_tax_disclosure("seller", &body(r#"{"disclosureUuid":"example","status":"registered","jurisdiction":"example"}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/{partner}/payouts",
            "/api/v1/billing/partners/partner/payouts",
            |c| {
                drop(c.custd.record_partner_payout("partner", &body(r#"{"externalReference":"example","amount":{"currency":"ZAR","amountMinor":"9007199254740993"},"paidAt":"2026-11-01T00:00:00Z"}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/partners/{partner}/referral-terms",
            "/api/v1/billing/partners/partner/referral-terms",
            |c| {
                drop(c.custd.publish_partner_referral_terms("partner", &body(r#"{"code":"example","effectiveFrom":"example","agreementDate":"example","agreementReference":"example","signedAgreementAttested":true,"share":"example","months":1,"holdDays":1}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/storefronts",
            "/api/v1/billing/storefronts",
            |c| {
                drop(
                    c.custd
                        .register_storefront(&body(r#"{"slug":"example","appUuid":"example"}"#)),
                )
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/storefronts/{storefront}/capacity-offers",
            "/api/v1/billing/storefronts/shop/capacity-offers",
            |c| {
                drop(c.custd.publish_capacity_offer("shop", &body(r#"{"offerUuid":"example","name":"example","billingInterval":"example","unitPrice":{"currency":"ZAR","amount":"25.50"},"taxRate":"example","taxLabel":"example","dataSpaceCapacity":{"extraSpacesPerUnit":1,"extraProducersPerSpacePerUnit":1}}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms",
            "/api/v1/billing/storefronts/shop/offers/offer/partner-terms",
            |c| {
                drop(c.custd.publish_partner_product_terms("shop", "offer", &body(r#"{"partnerCompanyUuid":"example","effectiveFrom":"example","agreementDate":"example","agreementReference":"example","signedAgreementAttested":true,"unitCost":"example","sellerCut":"example"}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs",
            "/api/v1/billing/storefronts/shop/purchase-handoffs",
            |c| {
                drop(c.custd.create_purchase_handoff("shop", &body(r#"{"orderReference":"example","offerUuid":"example","amount":{"currency":"ZAR","amountMinor":"9007199254740993"}}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}/cancel",
            "/api/v1/billing/storefronts/shop/purchase-handoffs/handoff/cancel",
            |c| drop(c.custd.cancel_purchase_handoff("shop", "handoff")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund",
            "/api/v1/storefronts/shop/invoices/invoice/refund",
            |c| {
                drop(
                    c.custd
                        .request_refund("shop", "invoice", &body(r#"{"reason":"example"}"#)),
                )
            },
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund/reconcile",
            "/api/v1/storefronts/shop/invoices/invoice/refund/reconcile",
            |c| drop(c.custd.reconcile_refund("shop", "invoice")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/purchase-handoffs/{handoff}/redeem",
            "/api/v1/storefronts/shop/purchase-handoffs/handoff/redeem",
            |c| drop(c.custd.redeem_purchase_handoff("shop", "handoff")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off",
            "/api/v1/storefronts/shop/purchases/invoice/set-off",
            |c| drop(c.custd.apply_storefront_set_off("shop", "invoice")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/quotes/{quote}/invoice",
            "/api/v1/storefronts/shop/quotes/quote/invoice",
            |c| drop(c.custd.issue_storefront_invoice("shop", "quote")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/usage-enrollments",
            "/api/v1/storefronts/shop/usage-enrollments",
            |c| {
                drop(c.custd.enroll_usage("shop", &body(r#"{"tariffRevisionUuid":"example","periodStart":"2026-11-01T00:00:00Z","closeNotBefore":"2026-11-01T00:00:00Z"}"#)))
            },
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/issue",
            "/api/v1/storefronts/shop/usage-enrollments/enrollment/issue",
            |c| drop(c.custd.issue_usage_invoice("shop", "enrollment")),
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance",
            "/api/v1/storefronts/shop/usage-enrollments/enrollment/scheduled-issuance",
            |c| {
                drop(c.custd.schedule_usage_invoice(
                    "shop",
                    "enrollment",
                    &body(r#"{"invoiceOnlyAttested":true}"#),
                ))
            },
        ),
        bodiless(
            "billing POST /api/v1/storefronts/{storefront}/usage-tariffs",
            "/api/v1/storefronts/shop/usage-tariffs",
            |c| {
                drop(c.custd.publish_usage_tariff("shop", &body(r#"{"tariffRevisionUuid":"example","productUuid":"example","description":"example","meter":{"slug":"example","version":1,"unit":"example"},"effectiveFrom":"2026-11-01T00:00:00Z","rate":{"currency":"example","majorAmount":"example","perUnits":"example"},"tax":{"label":"example","rate":"example"}}"#)))
            },
        ),
        bodiless(
            "billing PUT /api/v1/billing/merchant",
            "/api/v1/billing/merchant",
            |c| {
                drop(c.custd.configure_merchant(&body(r#"{"merchantId":"example","expectedRevision":1,"businessTimeZone":"example","refundsEnabled":true,"checkoutSecretKey":"example","paymentsReadToken":"example"}"#)))
            },
        ),
        bodiless(
            "billing PUT /api/v1/billing/storefronts/{storefront}/analytics-destination",
            "/api/v1/billing/storefronts/shop/analytics-destination",
            |c| {
                drop(
                    c.custd
                        .select_analytics_destination("shop", &body(r#"{"siteUuid":"example"}"#)),
                )
            },
        ),
        bodiless(
            "billing PUT /api/v1/billing/storefronts/{storefront}/receipt-template",
            "/api/v1/billing/storefronts/shop/receipt-template",
            |c| {
                drop(
                    c.custd
                        .select_receipt_template("shop", &body(r#"{"revision":"example"}"#)),
                )
            },
        ),
    ]
}
