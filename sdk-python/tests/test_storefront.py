from pathlib import Path
from unittest import TestCase

from custd import CustdClient

FIXTURE = Path(__file__).resolve().parents[2] / "contract-fixtures" / "storefront-purchase.json"


class StorefrontPurchaseTest(TestCase):
    def test_billing_purchase_keeps_exact_minor_units(self) -> None:
        body = FIXTURE.read_text(encoding="utf-8")
        client = CustdClient(
            base_url="http://localhost:8080",
            token="buyer",
            admin_transport=lambda *_: {"status": 200, "body": body},
        )
        purchase = client.storefronts.get_purchase("shop", "invoice-1")
        self.assertEqual("9007199254740993", purchase["totals"]["grossTotal"]["amountMinor"])
        self.assertEqual("pending", purchase["paymentStatus"])

    def test_billing_purchase_rejects_noncanonical_minor_units(self) -> None:
        body = FIXTURE.read_text(encoding="utf-8").replace("9007199254740993", "09007199254740993")
        client = CustdClient(
            base_url="http://localhost:8080",
            token="buyer",
            admin_transport=lambda *_: {"status": 200, "body": body},
        )
        with self.assertRaisesRegex(ValueError, "invalid storefront money"):
            client.storefronts.get_purchase("shop", "invoice-1")
