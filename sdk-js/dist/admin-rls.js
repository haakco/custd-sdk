/**
 * Row-level security status and reconciliation plans. A plan records the policy state the catalogue
 * expects; executing it converges the live database and returns a diff plus the SQL that undoes it.
 * Creating and executing a plan both require an idempotency key.
 */
const plansPath = "/rls/reconciliation-plans";
export class RlsAdminClient {
    constructor(request) {
        this.request = request;
    }
    async status(options) {
        const status = await this.request("GET", "/rls/status", undefined, options);
        return { ...status, tables: status.tables ?? [] };
    }
    async createPlan(body, options) {
        const plan = await this.request("POST", plansPath, body, options);
        return { ...plan, target_tables: plan.target_tables ?? [] };
    }
    async executePlan(planUuid, body, options) {
        const result = await this.request("POST", `${planPath(planUuid)}/execute`, body, options);
        return { ...result, diff: normalizeDiffs(result.diff) };
    }
    async getPlanProof(planUuid, options) {
        const proof = await this.request("GET", `${planPath(planUuid)}/proof`, undefined, options);
        return { ...proof, diff: normalizeDiffs(proof.diff) };
    }
}
function planPath(planUuid) {
    return `${plansPath}/${encodeURIComponent(planUuid)}`;
}
function normalizeDiffs(diffs) {
    return (diffs ?? []).map((diff) => ({ ...diff, drift: diff.drift ?? [] }));
}
