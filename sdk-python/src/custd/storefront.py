"""Buyer and seller operations on a credential-scoped storefront."""

from __future__ import annotations

import json
import re
from typing import Literal, NotRequired, TypedDict, TypeVar

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

    def _call(
        self, dto: type[_DTO], method: str, parts: tuple[str, ...], payload: dict[str, object] | None = None
    ) -> _DTO:
        if any(part in ("", ".", "..") or "/" in part or "\\" in part for part in parts):
            raise ValueError("custd: invalid storefront path segment")
        path = "/api/v1/storefronts/" + "/".join(quote_path(part) for part in parts)
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
