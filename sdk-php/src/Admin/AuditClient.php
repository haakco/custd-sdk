<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Audit\AuditEvent;
use HaakCo\Custd\Admin\Audit\AuditEventQuery;
use HaakCo\Custd\Admin\Audit\AuditExport;
use HaakCo\Custd\Admin\Audit\AuditListResponse;
use HaakCo\Custd\Admin\Audit\ReportingPackAuditListResponse;
use HaakCo\Custd\Admin\Audit\AuditExportFormat;

/**
 * AuditClient reads the tenant or global audit trail, exports it, and reads a reporting pack's audit events. The
 * DTOs carry only the fields the server documents, so a field the server adds later is never passed on
 * unreviewed. Every event's eventId must be a UUID.
 */
final class AuditClient
{
    private const FORMATS = [AuditExportFormat::CSV, AuditExportFormat::JSON];

    private readonly ApiHttp $http;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport = null,
    ) {
        $this->token = $token;
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List audit events, newest first. Follow nextCursor while it is set.
     */
    public function listEvents(AuditEventQuery $query = new AuditEventQuery()): AuditListResponse
    {
        $response = AuditListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/audit/events', $query->page(), null));
        array_map(self::checkEventId(...), $response->events);

        return $response;
    }

    /**
     * Get one audit event. Scope is tenant or global; a system administrator names the tenant with companySlug.
     */
    public function getEvent(string $eventId, ?string $scope = null, ?string $companySlug = null): AuditEvent
    {
        $event = AuditEvent::fromPayload($this->http->object('GET', '/api/v1/admin/audit/events/' . rawurlencode($eventId), ['scope' => $scope, 'companySlug' => $companySlug], null));
        self::checkEventId($event);

        return $event;
    }

    /**
     * Export the filtered audit trail as csv or json without decoding it. The query's limit and cursor are not
     * sent: an export is bounded by the server.
     *
     * @param AuditExportFormat::* $format
     */
    public function exportEvents(AuditEventQuery $query = new AuditEventQuery(), string $format = AuditExportFormat::JSON): AuditExport
    {
        if (!in_array($format, self::FORMATS, true)) {
            throw new \InvalidArgumentException('custd: audit export format must be csv or json');
        }
        $export = Http::binaryRequest(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'GET',
            ApiHttp::withQuery('/audit/events/export', $query->filters() + ['format' => $format]),
        );

        return new AuditExport($export['body'], $export['headers']);
    }

    /**
     * List a reporting pack's audit events.
     */
    public function listReportingPackEvents(string $packKey): ReportingPackAuditListResponse
    {
        return ReportingPackAuditListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/reporting-packs/audit-events', ['packKey' => $packKey], null));
    }

    private static function checkEventId(AuditEvent $event): void
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $event->eventId) !== 1) {
            throw new \UnexpectedValueException('custd: audit event response eventId must be a UUID');
        }
    }
}
