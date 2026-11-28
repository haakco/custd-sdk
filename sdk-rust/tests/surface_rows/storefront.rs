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
    ]
}
