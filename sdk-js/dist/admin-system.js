/**
 * Platform operations: system status, background jobs, scheduled tasks and client bootstrap.
 * Everything here except the bootstrap is for system administrators.
 */
const scheduledTasksPath = "/scheduled-tasks";
export class SystemAdminClient {
    constructor(request) {
        this.request = request;
    }
    async status(options) {
        const status = await this.request("GET", "/system/status", undefined, options);
        return { ...status, stages: status.stages ?? [], topTenants: status.topTenants ?? [] };
    }
    async listJobs(options) {
        const jobs = await this.request("GET", "/jobs", undefined, options);
        return {
            ...jobs,
            queueCounts: jobs.queueCounts ?? [],
            outboxes: jobs.outboxes ?? [],
            recentFailures: jobs.recentFailures ?? [],
        };
    }
    /** Re-queues one failed job. */
    retryJob(jobId, options) {
        return this.request("POST", `/jobs/${encodeURIComponent(String(jobId))}/retry`, undefined, options);
    }
    async listScheduledTasks(options) {
        const list = await this.request("GET", scheduledTasksPath, undefined, options);
        return { tasks: list.tasks ?? [] };
    }
    async getScheduledTask(taskName, options) {
        const detail = await this.request("GET", taskPath(taskName), undefined, options);
        return { ...detail, runs: detail.runs ?? [] };
    }
    /** Triggers a run now. The server decides whether the task's overlap and force policy permits it. */
    runScheduledTask(taskName, body = { force: false }, options) {
        return this.request("POST", `${taskPath(taskName)}/run`, body, options);
    }
    /** Stops future runs. */
    pauseScheduledTask(taskName, options) {
        return this.request("POST", `${taskPath(taskName)}/pause`, undefined, options);
    }
    /** Re-enables future runs. */
    resumeScheduledTask(taskName, options) {
        return this.request("POST", `${taskPath(taskName)}/resume`, undefined, options);
    }
    /** Re-queues one failed run. */
    retryScheduledTaskRun(runUuid, options) {
        return this.request("POST", `/scheduled-task-runs/${encodeURIComponent(runUuid)}/retry`, undefined, options);
    }
    /** Reads the tenant's bootstrap state. */
    async getBootstrap(options) {
        return withWarnings(await this.request("GET", "/bootstrap", undefined, options));
    }
    /** Submits bootstrap proofs and contact details. */
    async submitBootstrap(body, options) {
        return withWarnings(await this.request("POST", "/bootstrap", body, options));
    }
}
function taskPath(taskName) {
    return `${scheduledTasksPath}/${encodeURIComponent(taskName)}`;
}
function withWarnings(status) {
    return { ...status, warnings: status.warnings ?? [] };
}
