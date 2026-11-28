const merchantPath = "/billing/merchant";
const storefrontRegistryPath = "/billing/storefronts";
const billingPartnersPath = "/billing/partners";
/** Browse a seller's offers and check out using the current buyer identity. */
export class StorefrontClient {
    constructor(request) {
        this.request = request;
    }
    listBillingPartners(input, options) {
        const query = input.after ? `?${new URLSearchParams({ after: input.after })}` : "";
        return this.request("GET", billingPartnersPath + query, undefined, options);
    }
    listBillingPartnerSellers(input, options) {
        const query = input.after ? `?${new URLSearchParams({ after: input.after })}` : "";
        return this.request("GET", `${billingPartnersPath}/sellers${query}`, undefined, options);
    }
    getSellerSettlementPreference(sellerUuid, options) {
        return this.request("GET", `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/settlement-preference`, undefined, options);
    }
    getPartnerSettlementPreference(partnerUuid, options) {
        return this.request("GET", `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/settlement-preference`, undefined, options);
    }
    recordPartnerSettlementPreference(sellerUuid, input, options) {
        return this.request("POST", `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/settlement-preference`, input, options);
    }
    getSellerTaxDisclosure(sellerUuid, options) {
        return this.request("GET", `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/tax-disclosure`, undefined, options);
    }
    getPartnerTaxDisclosure(partnerUuid, options) {
        return this.request("GET", `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/tax-disclosure`, undefined, options);
    }
    recordPartnerTaxDisclosure(sellerUuid, input, options) {
        return this.request("POST", `${billingPartnersPath}/sellers/${encodeURIComponent(sellerUuid)}/tax-disclosure`, input, options);
    }
    async listPartnerPayouts(input, options) {
        const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
        const page = await this.request("GET", `${billingPartnersPath}/${encodeURIComponent(input.partnerCompanyUuid)}/payouts${query}`, undefined, options);
        for (const payout of page.payouts)
            validateMoney(payout.amount);
        return page;
    }
    async recordPartnerPayout(partnerUuid, input, options) {
        validateMoney(input.amount);
        const payout = await this.request("POST", `${billingPartnersPath}/${encodeURIComponent(partnerUuid)}/payouts`, input, options);
        validateMoney(payout.amount);
        return payout;
    }
    createBillingPartnerInvitation(options) {
        return this.request("POST", `${billingPartnersPath}/invitations`, undefined, options);
    }
    listPartnerProductTerms(input, options) {
        const path = storefrontPath(input.storefront, "offers", input.offerUuid, "partner-terms");
        const query = input.before ? `?${new URLSearchParams({ before: input.before })}` : "";
        return this.request("GET", `/billing${path}${query}`, undefined, options);
    }
    publishPartnerProductTerms(storefront, offerUuid, input, options) {
        const path = storefrontPath(storefront, "offers", offerUuid, "partner-terms");
        return this.request("POST", `/billing${path}`, input, options);
    }
    acceptBillingPartnerInvitation(input, options) {
        return this.request("POST", `${billingPartnersPath}/invitations/accept`, input, options);
    }
    getUsageTariff(storefront, revisionUuid, options) {
        return this.request("GET", storefrontPath(storefront, "usage-tariffs", revisionUuid), undefined, options);
    }
    listUsageTariffs(input, options) {
        return this.request("GET", usagePagePath(input, "usage-tariffs"), undefined, options);
    }
    listUsageEnrollments(input, options) {
        return this.request("GET", usagePagePath(input, "usage-enrollments"), undefined, options);
    }
    publishUsageTariff(storefront, input, options) {
        return this.request("POST", storefrontPath(storefront, "usage-tariffs"), input, options);
    }
    enrollUsage(storefront, input, options) {
        return this.request("POST", storefrontPath(storefront, "usage-enrollments"), input, options);
    }
    async issueUsageInvoice(storefront, enrollmentUuid, options) {
        const result = await this.request("POST", storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "issue"), undefined, options);
        validateUsageCertificate(result.usage);
        if (result.status === "invoice_issued")
            validateTotals(result.invoice.totals);
        return result;
    }
    getUsageSchedule(storefront, enrollmentUuid, options) {
        return this.request("GET", storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"), undefined, options);
    }
    scheduleUsageInvoice(storefront, enrollmentUuid, input, options) {
        return this.request("POST", storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"), input, options);
    }
    cancelUsageSchedule(storefront, enrollmentUuid, options) {
        return this.request("DELETE", storefrontPath(storefront, "usage-enrollments", enrollmentUuid, "scheduled-issuance"), undefined, options);
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
    async issueStorefrontInvoice(storefront, quoteUuid, options) {
        return validatePurchase(await this.request("POST", storefrontPath(storefront, "quotes", quoteUuid, "invoice"), undefined, options));
    }
    getStorefrontSetOffEligibility(storefront, invoiceUuid, options) {
        return this.request("GET", storefrontPath(storefront, "purchases", invoiceUuid, "set-off"), undefined, options);
    }
    async applyStorefrontSetOff(storefront, invoiceUuid, options) {
        const setOff = await this.request("POST", storefrontPath(storefront, "purchases", invoiceUuid, "set-off"), undefined, options);
        validateMoney(setOff.amount);
        return setOff;
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
function usagePagePath(input, resource) {
    const path = storefrontPath(input.storefront, resource);
    return input.before ? `${path}?${new URLSearchParams({ before: input.before })}` : path;
}
function validateUsageCertificate(usage) {
    const line = usage.line;
    const isCount = (value) => typeof value === "string" && /^(0|[1-9][0-9]{0,18})$/.test(value);
    if (!isCount(line.quantity) || line.windows.some((day) => !isCount(day.quantity) || !isCount(day.sourceWatermark))) {
        throw new Error("custd: invalid certified usage quantity");
    }
    validateMoney(line.netAmount);
    validateMoney(line.taxAmount);
    validateMoney(line.grossAmount);
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
    if (purchase.setOff)
        validateMoney(purchase.setOff.amount);
    if (purchase.usage)
        validateUsageCertificate(purchase.usage);
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
