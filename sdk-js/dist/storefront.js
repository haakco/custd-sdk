const merchantPath = "/billing/merchant";
const storefrontRegistryPath = "/billing/storefronts";
/** Browse a seller's offers and check out using the current buyer identity. */
export class StorefrontClient {
    constructor(request) {
        this.request = request;
    }
    async listSellerInvoices(input, options) {
        const path = `/billing${storefrontPath(input.storefront, "invoices")}`;
        const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
        const page = await this.request("GET", path + query, undefined, options);
        for (const invoice of page.invoices)
            validateTotals(invoice.totals);
        return page;
    }
    async getPartnerStatement(input, options) {
        const query = new URLSearchParams({ month: input.month });
        if (input.cursor)
            query.set("cursor", input.cursor);
        const path = storefrontPath(input.storefront, "partners", input.partnerCompanyUuid, "statement");
        const statement = await this.request("GET", `/billing${path}?${query}`, undefined, options);
        for (const movement of statement.movements) {
            validateMoney(movement.partnerDelta);
            validateMoney(movement.sellerCutDelta);
            if (movement.earning) {
                for (const amount of Object.values(movement.earning))
                    validateMoney(amount);
            }
        }
        return statement;
    }
    async issueCreditNote(storefront, invoiceUuid, input, options) {
        const note = await this.request("POST", storefrontPath(storefront, "invoices", invoiceUuid, "credit-note"), input, options);
        validateTotals(note.totals);
        return note;
    }
    async requestRefund(storefront, invoiceUuid, input, options) {
        const refund = await this.request("POST", storefrontPath(storefront, "invoices", invoiceUuid, "refund"), input, options);
        validateMoney(refund.amount);
        return refund;
    }
    async reconcileRefund(storefront, invoiceUuid, options) {
        const refund = await this.request("POST", storefrontPath(storefront, "invoices", invoiceUuid, "refund", "reconcile"), undefined, options);
        validateMoney(refund.amount);
        return refund;
    }
    listOwnedStorefronts(options) {
        return this.request("GET", storefrontRegistryPath, undefined, options);
    }
    registerStorefront(input, options) {
        return this.request("POST", storefrontRegistryPath, input, options);
    }
    getReceiptTemplate(slug, options) {
        return this.request("GET", `/billing${storefrontPath(slug, "receipt-template")}`, undefined, options);
    }
    selectReceiptTemplate(slug, input, options) {
        return this.request("PUT", `/billing${storefrontPath(slug, "receipt-template")}`, input, options);
    }
    getMerchant(options) {
        return this.request("GET", merchantPath, undefined, options);
    }
    configureMerchant(input, options) {
        return this.request("PUT", merchantPath, input, options);
    }
    revokeMerchant(input, options) {
        return this.request("DELETE", merchantPath, input, options);
    }
    verifyMerchant(input, options) {
        return this.request("POST", `${merchantPath}/test`, input, options);
    }
    listOffers(storefront, options) {
        return this.request("GET", storefrontPath(storefront, "offers"), undefined, options);
    }
    publishOffer(storefront, offer, options) {
        return this.request("POST", storefrontPath(storefront, "offers"), offer, options);
    }
    createCart(storefront, options) {
        return this.request("POST", storefrontPath(storefront, "carts"), undefined, options);
    }
    getCart(storefront, cartUuid, options) {
        return this.request("GET", storefrontPath(storefront, "carts", cartUuid), undefined, options);
    }
    updateLine(storefront, cartUuid, offerUuid, quantity, options) {
        return this.request("PUT", storefrontPath(storefront, "carts", cartUuid, "lines", offerUuid), { quantity: quantity.quantity }, options);
    }
    async createQuote(storefront, cartUuid, options) {
        return validateQuote(await this.request("POST", storefrontPath(storefront, "carts", cartUuid, "quotes"), undefined, options));
    }
    async getQuote(storefront, quoteUuid, options) {
        return validateQuote(await this.request("GET", storefrontPath(storefront, "quotes", quoteUuid), undefined, options));
    }
    /** Start or resume the purchase for an accepted quote. */
    async checkout(storefront, quoteUuid, options) {
        return validatePurchase(await this.request("POST", storefrontPath(storefront, "quotes", quoteUuid, "checkout"), undefined, options));
    }
    async getPurchase(storefront, invoiceUuid, options) {
        return validatePurchase(await this.request("GET", storefrontPath(storefront, "purchases", invoiceUuid), undefined, options));
    }
    /** Resume or retry payment for the same invoice. */
    async startPayment(storefront, invoiceUuid, options) {
        return validatePurchase(await this.request("POST", storefrontPath(storefront, "purchases", invoiceUuid, "payment"), undefined, options));
    }
}
function storefrontPath(...parts) {
    const segments = parts.map((part) => {
        if (part === "" || part === "." || part === ".." || /[\\/]/.test(part)) {
            throw new Error("custd: invalid storefront path segment");
        }
        return encodeURIComponent(part);
    });
    return `/storefronts/${segments.join("/")}`;
}
function validateMoney(value) {
    if (typeof value?.currency !== "string" ||
        !/^[A-Z]{3}$/.test(value.currency) ||
        typeof value.amountMinor !== "string" ||
        !/^(0|-?[1-9][0-9]{0,18})$/.test(value.amountMinor)) {
        throw new Error("custd: invalid storefront money");
    }
    const amount = BigInt(value.amountMinor);
    if (amount < -9223372036854775808n || amount > 9223372036854775807n) {
        throw new Error("custd: storefront money overflows int64");
    }
}
function validateTotals(totals) {
    validateMoney(totals.netTotal);
    validateMoney(totals.taxTotal);
    validateMoney(totals.grossTotal);
}
function validateQuote(quote) {
    validateTotals(quote.totals);
    for (const line of quote.lines) {
        validateMoney(line.netAmount);
        validateMoney(line.tax.amount);
        validateMoney(line.grossAmount);
    }
    return quote;
}
function validatePurchase(purchase) {
    validateTotals(purchase.totals);
    if (purchase.receipt) {
        validateMoney(purchase.receipt.amountReceived);
    }
    if (purchase.refund) {
        validateMoney(purchase.refund.amount);
    }
    if (purchase.creditNote) {
        validateTotals(purchase.creditNote.totals);
    }
    return purchase;
}
