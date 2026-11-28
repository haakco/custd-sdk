<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject as AP;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinitionCreateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinitionUpdateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelValueCreateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelValueUpdateRequest;
use HaakCo\Custd\Admin\DataLabel\EventTypeDataLabelDefaultRequest;
use HaakCo\Custd\Admin\DataLabel\SchemaFieldDataLabelAssignmentRequest;
use HaakCo\Custd\Admin\DataScope as DS;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationRow;
use HaakCo\Custd\Admin\Measurement\MeasurementProjectCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementTargetCreateRequest;
use HaakCo\Custd\Admin\Prediction\DurationEvaluationRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionActivateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinitionCreateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinitionUpdateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionVersionPublishRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementSignalSourceCreateRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureCreateRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureSelector;
use HaakCo\Custd\Admin\ReportingPack as RP;
use HaakCo\Custd\Admin\Retention\RetentionPolicyUpsertRequest;
use HaakCo\Custd\Admin\SiteDomain as SD;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportCreateRequest;
use HaakCo\Custd\Admin\TimePlan as TP;
use HaakCo\Custd\Admin\WorkflowTiming as WT;
use HaakCo\Custd\Analytics\AnalyticsEventsQueryRequest;
use HaakCo\Custd\Analytics\RangeQueryRequest;
use HaakCo\Custd\App;
use HaakCo\Custd\App\AppProfilePhoto;
use HaakCo\Custd\Awthy\AwthyAuditRedactionRequest;
use HaakCo\Custd\CustdClient;
use HaakCo\Custd\ErrorTracking as ET;
use HaakCo\Custd\ErrorTracking\DeliveryRequest;
use HaakCo\Custd\Parsers\ParserPreviewRequest;
use HaakCo\Custd\Parsers\SaveParserRequest;
use HaakCo\Custd\Provisioning as PV;
use HaakCo\Custd\RawIngest\RawIngestRequest;
use HaakCo\Custd\Reporting\Data\ExportQueryParameters;
use HaakCo\Custd\Reporting\Data\ReportExportCreateRequest;
use HaakCo\Custd\Reporting\Data\ReportingQueryRequest;
use HaakCo\Custd\Reporting\Data\SubjectInsightRequest;
use HaakCo\Custd\Schemas as SC;
use HaakCo\Custd\Storefront as SF;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * SurfaceConformanceTest proves the Custd routes this SDK calls. Each row calls one public method through the
 * admin_http_client or http_client transport (or, for the error envelope, the error-capture delivery callback) and
 * asserts the HTTP method and path of one contract-fixtures/api/operations.json
 * operation. contract-fixtures/api/coverage/php.json must list exactly the table's operation IDs, so the coverage
 * report never claims more than this test proves. Every row whose operation has a generated example also decodes
 * its minimal and maximal response.
 */
final class SurfaceConformanceTest extends TestCase
{
    private const API = __DIR__.'/../../contract-fixtures/api/';

    private const BASE_URL = 'http://localhost:8080';

    private const A = '00000000-0000-4000-8000-000000000001';

    private const B = '00000000-0000-4000-8000-000000000002';

    private const C = '00000000-0000-4000-8000-000000000003';

    private const D = '00000000-0000-4000-8000-000000000004';

    private const DIGEST = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    /**
     * FIXTURE_LIMITS are the decode cases the generated examples cannot satisfy, with the refusal each must raise.
     * A refusal that stops matching fails its case, so a fixed example removes its entry.
     */
    private const FIXTURE_LIMITS = [
        // displayNameSource is a free string in the OpenAPI, so the example carries the "example" placeholder where
        // the server only ever sends application or hosting.
        'admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status maximal' => 'custd: desired-state displayNameSource must be application or hosting',
        'admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status minimal' => 'custd: desired-state displayNameSource must be application or hosting',
        // A principal carries userUuid for a human and clientId for a machine; the schema cannot state that pairing.
        'admin-api GET /api/v1/admin/data-scope-grants maximal' => 'custd: a human principal requires userUuid and no clientId',
        'admin-api POST /api/v1/admin/data-scope-grants maximal' => 'custd: a human principal requires userUuid and no clientId',
        'admin-api POST /api/v1/admin/data-scope-grants minimal' => 'custd: a human principal requires userUuid and no clientId',
        // The response must account for every submitted item; the example cannot correlate with the request.
        'admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk minimal' => 'custd: measurement result count 0 does not match submitted row count 1',
        'admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv minimal' => 'custd: measurement result count 0 does not match submitted row count 1',
        'admin-api POST /api/v1/admin/workflow-timings/observations:batch maximal' => 'custd: workflow timing response has invalid item indexes',
        'admin-api POST /api/v1/admin/workflow-timings/observations:batch minimal' => 'custd: workflow timing response does not account for every input; replay with the same idempotency keys',
        // An enabled browser collector always carries its key; the schema cannot state that condition.
        'admin-api PUT /api/v1/site-domains/{domainUuid}/browser-collector minimal' => 'custd: response field browserKey is required',
    ];

    public function test_coverage_file_lists_exactly_the_table_operations(): void
    {
        $ids = array_map(static fn (array $row): string => $row[0], self::table());
        self::assertSame(array_unique($ids), $ids, 'each operation has one row');
        sort($ids);

        $coverage = self::json('coverage/php.json');
        self::assertSame($ids, $coverage['operations']);
        self::assertSame([], array_diff(array_keys(self::FIXTURE_LIMITS), array_keys(iterator_to_array(self::decodes()))));
    }

    /**
     * @param  array<string, string>  $pathValues
     * @param  \Closure(CustdClient, \Closure(DeliveryRequest): int): mixed  $call
     */
    #[DataProvider('routes')]
    public function test_route_sends_operation_method_and_path(string $id, string $method, array $pathValues, \Closure $call): void
    {
        $operation = self::operations()[$id] ?? null;
        self::assertNotNull($operation, "{$id} is not in operations.json");
        self::assertSame('required', $operation['sdk']);
        self::assertContains($operation['method'], [$method, 'ANY']);

        $calls = [];
        $client = self::client($calls, '{}');
        $deliver = static function (DeliveryRequest $delivery) use (&$calls): int {
            $calls[] = ['method' => $delivery->method, 'url' => $delivery->url];

            return 202;
        };
        try {
            $call($client, $deliver);
        } catch (\Throwable) {
            // The route test owns only the request; the decode test owns the response.
        }

        self::assertNotEmpty($calls, "{$id} sent no request");
        self::assertSame($method, $calls[0]['method']);
        self::assertSame(self::BASE_URL.self::expandPath($operation['path'], $pathValues), strtok($calls[0]['url'], '?'));
        parse_str((string) parse_url($calls[0]['url'], PHP_URL_QUERY), $sent);
        foreach ($operation['query'] ?? [] as $parameter) {
            if ($parameter['required']) {
                self::assertArrayHasKey($parameter['name'], $sent, "{$id} must send its required {$parameter['name']} query parameter");
            }
        }
    }

    /** @param \Closure(CustdClient): mixed $call */
    #[DataProvider('decodes')]
    public function test_response_example_decodes(string $id, string $variant, \Closure $call): void
    {
        $example = json_decode(
            (string) file_get_contents(self::API.self::operations()[$id]['example']),
            false,
            512,
            JSON_THROW_ON_ERROR,
        );
        self::assertInstanceOf(\stdClass::class, $example);
        $calls = [];
        $limit = self::FIXTURE_LIMITS["{$id} {$variant}"] ?? null;
        if ($limit !== null) {
            $this->expectExceptionMessage($limit);
        }

        $call(self::client($calls, json_encode($example->{$variant}, JSON_THROW_ON_ERROR)));

        self::assertCount(1, $calls, "{$id} {$variant}");
    }

    /** @return iterable<string, array{string, string, array<string, string>, \Closure}> */
    public static function routes(): iterable
    {
        foreach (self::table() as $row) {
            yield $row[0] => $row;
        }
    }

    /** @return iterable<string, array{string, string, \Closure}> */
    public static function decodes(): iterable
    {
        $operations = self::operations();
        foreach (self::table() as [$id, , , $call]) {
            if (isset($operations[$id]['example'])) {
                yield "{$id} minimal" => [$id, 'minimal', $call];
                yield "{$id} maximal" => [$id, 'maximal', $call];
            }
        }
    }

    /**
     * @param  list<array{method: string, url: string}>  $calls
     *
     * @param-out list<array{method: string, url: string}> $calls
     */
    private static function client(?array &$calls, string $body): CustdClient
    {
        $calls ??= [];
        $transport = static function (string $method, string $url) use (&$calls, $body): array {
            $calls[] = ['method' => $method, 'url' => $url];

            return ['status' => 200, 'body' => $body, 'headers' => []];
        };

        $ingest = static function (string $url, mixed $payload, string $token, array $headers, string $method) use (&$calls, $body): array {
            $calls[] = ['method' => $method, 'url' => $url];

            return ['status' => 200, 'body' => $body];
        };

        return new CustdClient(self::BASE_URL, 'token', [
            'admin_http_client' => $transport,
            'http_client' => $ingest,
            'retry' => ['max_attempts' => 1, 'sleeper' => static fn (int $milliseconds): null => null],
            // A queued track() flushes through the batch route.
            'queue' => ['enabled' => true],
        ]);
    }

    /** @param array<string, string> $values */
    private static function expandPath(string $template, array $values): string
    {
        $path = preg_replace_callback(
            '/\{([^}]+)\}/',
            static function (array $match) use ($values, $template): string {
                self::assertArrayHasKey($match[1], $values, "{$template} needs a sample {$match[1]}");

                return rawurlencode($values[$match[1]]);
            },
            $template,
        );
        self::assertIsString($path);

        return $path;
    }

    /** @return array<string, array{id: string, method: string, path: string, sdk: string, example?: string, query?: list<array{name: string, required: bool}>}> */
    public static function operations(): array
    {
        $operations = [];
        foreach (self::json('operations.json')['operations'] as $operation) {
            $operations[$operation['id']] = $operation;
        }

        return $operations;
    }

    /** @return array<string, mixed> */
    private static function json(string $file): array
    {
        /** @var array<string, mixed> $decoded */
        $decoded = json_decode((string) file_get_contents(self::API.$file), true, 512, JSON_THROW_ON_ERROR);

        return $decoded;
    }

    /**
     * table is one row per operation: operation ID, the HTTP method the SDK sends, a sample value for each path
     * parameter, and the public SDK call.
     *
     * @return list<array{string, string, array<string, string>, \Closure(CustdClient): mixed}>
     */
    public static function table(): array
    {
        $key = new AP\RequestOptions(idempotencyKey: 'idempotency-key-1');
        $target = new AP\ApplicationPrincipalTarget(self::A, self::B, self::C, self::D);
        $desired = new AP\DesiredStateRequest(new AP\DesiredState('isolated', 'invite_only', false), 1);
        $pack = new RP\PackDefinition('pack', 'Pack', 'owner', 1, true, [], [], [], [], new RP\TrustDiagnostics([], []), new RP\ProofProfile('proof', [], [], [], 'table'));
        $plan = new TP\Definition(horizonMs: 60000);
        $obs = WT\Observation::runStarted('wf', 'run-1', '2026-01-01T00:00:00Z', 'idem-1', 'actor');
        $principal = new DS\PrincipalRef('human', userUuid: self::B);
        $grant = new DS\Grant($principal, new DS\GrantTarget('sub_client', scopeUuid: self::A), 'read');
        $draft = new SD\SiteStatusPageDraft('Status', []);
        $saveParser = new SaveParserRequest('code', 'Name', 'regex', '^\S+', '2006-01-02T15:04:05Z07:00');

        $rows = [
            ['billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->createPurchaseHandoff('shop', new SF\CreatePurchaseHandoffRequest('order-1', 'offer-1', new SF\Money('ZAR', '100')))],
            ['billing GET /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}', 'GET', ['storefront' => 'shop', 'handoff' => 'handoff-1'], fn (CustdClient $c) => $c->storefronts()->getPurchaseHandoff('shop', 'handoff-1')],
            ['billing POST /api/v1/billing/storefronts/{storefront}/purchase-handoffs/{handoff}/cancel', 'POST', ['storefront' => 'shop', 'handoff' => 'handoff-1'], fn (CustdClient $c) => $c->storefronts()->cancelPurchaseHandoff('shop', 'handoff-1')],
            ['billing DELETE /api/v1/billing/merchant', 'DELETE', [], fn (CustdClient $c) => $c->storefronts()->revokeMerchant(new SF\RevokeMerchant(expectedRevision: 1))],
            ['billing DELETE /api/v1/billing/storefronts/{storefront}/analytics-destination', 'DELETE', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->disableAnalyticsDestination('shop')],
            ['billing DELETE /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance', 'DELETE', ['storefront' => 'shop', 'enrollment' => 'enrollment'], fn (CustdClient $c) => $c->storefronts()->cancelUsageSchedule('shop', 'enrollment')],
            ['billing GET /api/v1/billing/accounting-export', 'GET', [], fn (CustdClient $c) => $c->storefronts()->readAccountingExport(new SF\AccountingExportRequest(month: '2026-11', businessTimeZone: 'UTC', after: 'sample-after'))],
            ['billing GET /api/v1/billing/merchant', 'GET', [], fn (CustdClient $c) => $c->storefronts()->getMerchant()],
            ['billing GET /api/v1/billing/partners', 'GET', [], fn (CustdClient $c) => $c->storefronts()->listBillingPartners(new SF\BillingPartnerPageRequest(after: 'sample-after'))],
            ['billing GET /api/v1/billing/partners/referral-reviews', 'GET', [], fn (CustdClient $c) => $c->storefronts()->listReferralReviews(new SF\PartnerReferralPageRequest(before: 'sample-before'))],
            ['billing GET /api/v1/billing/partners/sellers', 'GET', [], fn (CustdClient $c) => $c->storefronts()->listBillingPartnerSellers(new SF\BillingPartnerPageRequest(after: 'sample-after'))],
            ['billing GET /api/v1/billing/partners/sellers/{seller}/settlement-preference', 'GET', ['seller' => 'seller'], fn (CustdClient $c) => $c->storefronts()->getSellerSettlementPreference('seller')],
            ['billing GET /api/v1/billing/partners/sellers/{seller}/tax-disclosure', 'GET', ['seller' => 'seller'], fn (CustdClient $c) => $c->storefronts()->getSellerTaxDisclosure('seller')],
            ['billing GET /api/v1/billing/partners/{partner}/fee-balance', 'GET', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->getPartnerFeeBalance('partner', new SF\PartnerFeeBalanceRequest(asOf: '2026-11-01'))],
            ['billing GET /api/v1/billing/partners/{partner}/payouts', 'GET', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->listPartnerPayouts(new SF\PartnerPayoutPageRequest(partnerCompanyUuid: 'partner', before: 'sample-before'))],
            ['billing GET /api/v1/billing/partners/{partner}/referral-terms', 'GET', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->listPartnerReferralTerms('partner', new SF\PartnerReferralPageRequest(before: 'sample-before'))],
            ['billing GET /api/v1/billing/partners/{partner}/settlement-preference', 'GET', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->getPartnerSettlementPreference('partner')],
            ['billing GET /api/v1/billing/partners/{partner}/tax-disclosure', 'GET', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->getPartnerTaxDisclosure('partner')],
            ['billing GET /api/v1/billing/storefronts', 'GET', [], fn (CustdClient $c) => $c->storefronts()->listOwnedStorefronts()],
            ['billing GET /api/v1/billing/storefronts/{storefront}/analytics-destination', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->getAnalyticsDestination('shop')],
            ['billing GET /api/v1/billing/storefronts/{storefront}/invoices', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->listSellerInvoices(new SF\SellerInvoiceListRequest(storefront: 'shop', before: 'sample-before'))],
            ['billing GET /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms', 'GET', ['storefront' => 'shop', 'offer' => 'offer'], fn (CustdClient $c) => $c->storefronts()->listPartnerProductTerms(new SF\PartnerProductTermsPageRequest(storefront: 'shop', offerUuid: 'offer', before: 'sample-before'))],
            ['billing GET /api/v1/billing/storefronts/{storefront}/partners/{partner}/statement', 'GET', ['storefront' => 'shop', 'partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->getPartnerStatement(new SF\PartnerStatementRequest(storefront: 'shop', partnerCompanyUuid: 'partner', month: '2026-11', cursor: 'sample-cursor'))],
            ['billing GET /api/v1/billing/storefronts/{storefront}/receipt-template', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->getReceiptTemplate('shop')],
            ['billing GET /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off', 'GET', ['storefront' => 'shop', 'invoice' => 'invoice'], fn (CustdClient $c) => $c->storefronts()->getStorefrontSetOffEligibility('shop', 'invoice')],
            ['billing GET /api/v1/storefronts/{storefront}/usage-enrollments', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->listUsageEnrollments(new SF\UsagePageRequest(storefront: 'shop', before: 'sample-before'))],
            ['billing GET /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance', 'GET', ['storefront' => 'shop', 'enrollment' => 'enrollment'], fn (CustdClient $c) => $c->storefronts()->getUsageSchedule('shop', 'enrollment')],
            ['billing GET /api/v1/storefronts/{storefront}/usage-tariffs', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->listUsageTariffs(new SF\UsagePageRequest(storefront: 'shop', before: 'sample-before'))],
            ['billing GET /api/v1/storefronts/{storefront}/usage-tariffs/{revision}', 'GET', ['storefront' => 'shop', 'revision' => 'revision'], fn (CustdClient $c) => $c->storefronts()->getUsageTariff('shop', 'revision')],
            ['billing POST /api/v1/billing/merchant/test', 'POST', [], fn (CustdClient $c) => $c->storefronts()->verifyMerchant(new SF\VerifyMerchant(appUuid: 'example', invoiceUuid: 'example'))],
            ['billing POST /api/v1/billing/partners/invitations', 'POST', [], fn (CustdClient $c) => $c->storefronts()->createBillingPartnerInvitation()],
            ['billing POST /api/v1/billing/partners/invitations/accept', 'POST', [], fn (CustdClient $c) => $c->storefronts()->acceptBillingPartnerInvitation(new SF\AcceptBillingPartnerInvitationRequest(code: 'example'))],
            ['billing POST /api/v1/billing/partners/referral-reviews/{attribution}/retry', 'POST', ['attribution' => 'attribution'], fn (CustdClient $c) => $c->storefronts()->retryReferralReview('attribution')],
            ['billing POST /api/v1/billing/partners/sellers/{seller}/settlement-preference', 'POST', ['seller' => 'seller'], fn (CustdClient $c) => $c->storefronts()->recordPartnerSettlementPreference('seller', new SF\RecordPartnerSettlementPreferenceRequest(preferenceUuid: 'example', mode: SF\PartnerSettlementMode::Payout))],
            ['billing POST /api/v1/billing/partners/sellers/{seller}/tax-disclosure', 'POST', ['seller' => 'seller'], fn (CustdClient $c) => $c->storefronts()->recordPartnerTaxDisclosure('seller', new SF\RecordPartnerTaxDisclosureRequest(disclosureUuid: 'example', status: SF\PartnerTaxStatus::Registered, jurisdiction: 'example'))],
            ['billing POST /api/v1/billing/partners/{partner}/payouts', 'POST', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->recordPartnerPayout('partner', new SF\RecordPartnerPayoutRequest(externalReference: 'example', amount: new SF\Money('ZAR', '9007199254740993'), paidAt: '2026-11-01T00:00:00Z'))],
            ['billing POST /api/v1/billing/partners/{partner}/referral-terms', 'POST', ['partner' => 'partner'], fn (CustdClient $c) => $c->storefronts()->publishPartnerReferralTerms('partner', new SF\PublishReferralTerms(code: 'example', effectiveFrom: 'example', agreementDate: 'example', agreementReference: 'example', signedAgreementAttested: true, share: 'example', months: 1, holdDays: 1))],
            ['billing POST /api/v1/billing/storefronts', 'POST', [], fn (CustdClient $c) => $c->storefronts()->registerStorefront(new SF\RegisterStorefront(slug: 'example', appUuid: 'example'))],
            ['billing POST /api/v1/billing/storefronts/{storefront}/capacity-offers', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->publishCapacityOffer('shop', new SF\PublishStorefrontCapacityOffer(offerUuid: 'example', name: 'example', billingInterval: 'example', unitPrice: new SF\UnitPrice('ZAR', '25.50'), taxRate: 'example', taxLabel: 'example', dataSpaceCapacity: new SF\DataSpaceCapacity(extraSpacesPerUnit: 1, extraProducersPerSpacePerUnit: 1)))],
            ['billing POST /api/v1/billing/storefronts/{storefront}/offers/{offer}/partner-terms', 'POST', ['storefront' => 'shop', 'offer' => 'offer'], fn (CustdClient $c) => $c->storefronts()->publishPartnerProductTerms('shop', 'offer', new SF\PublishPartnerProductTermsRequest(partnerCompanyUuid: 'example', effectiveFrom: 'example', agreementDate: 'example', agreementReference: 'example', signedAgreementAttested: true, unitCost: 'example', sellerCut: 'example'))],
            ['billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund', 'POST', ['storefront' => 'shop', 'invoice' => 'invoice'], fn (CustdClient $c) => $c->storefronts()->requestRefund('shop', 'invoice', new SF\AdjustmentRequest(reason: 'example'))],
            ['billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/refund/reconcile', 'POST', ['storefront' => 'shop', 'invoice' => 'invoice'], fn (CustdClient $c) => $c->storefronts()->reconcileRefund('shop', 'invoice')],
            ['billing POST /api/v1/storefronts/{storefront}/purchase-handoffs/{handoff}/redeem', 'POST', ['storefront' => 'shop', 'handoff' => 'handoff'], fn (CustdClient $c) => $c->storefronts()->redeemPurchaseHandoff('shop', 'handoff')],
            ['billing POST /api/v1/storefronts/{storefront}/purchases/{invoice}/set-off', 'POST', ['storefront' => 'shop', 'invoice' => 'invoice'], fn (CustdClient $c) => $c->storefronts()->applyStorefrontSetOff('shop', 'invoice')],
            ['billing POST /api/v1/storefronts/{storefront}/quotes/{quote}/invoice', 'POST', ['storefront' => 'shop', 'quote' => 'quote'], fn (CustdClient $c) => $c->storefronts()->issueStorefrontInvoice('shop', 'quote')],
            ['billing POST /api/v1/storefronts/{storefront}/usage-enrollments', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->enrollUsage('shop', new SF\EnrollUsageRequest(tariffRevisionUuid: 'example', periodStart: '2026-11-01T00:00:00Z', closeNotBefore: '2026-11-01T00:00:00Z'))],
            ['billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/issue', 'POST', ['storefront' => 'shop', 'enrollment' => 'enrollment'], fn (CustdClient $c) => $c->storefronts()->issueUsageInvoice('shop', 'enrollment')],
            ['billing POST /api/v1/storefronts/{storefront}/usage-enrollments/{enrollment}/scheduled-issuance', 'POST', ['storefront' => 'shop', 'enrollment' => 'enrollment'], fn (CustdClient $c) => $c->storefronts()->scheduleUsageInvoice('shop', 'enrollment', new SF\UsageInvoiceOptIn(invoiceOnlyAttested: true))],
            ['billing POST /api/v1/storefronts/{storefront}/usage-tariffs', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->publishUsageTariff('shop', new SF\PublishUsageTariffRequest(tariffRevisionUuid: 'example', productUuid: 'example', description: 'example', meter: new SF\UsageMeter(slug: 'example', version: 1, unit: 'example'), effectiveFrom: '2026-11-01T00:00:00Z', rate: new SF\UsageRate(currency: 'example', majorAmount: 'example', perUnits: 'example'), tax: new SF\UsageTax(label: 'example', rate: 'example')))],
            ['billing PUT /api/v1/billing/merchant', 'PUT', [], fn (CustdClient $c) => $c->storefronts()->configureMerchant(new SF\ConfigureMerchant(merchantId: 'example', expectedRevision: 1, businessTimeZone: 'example', refundsEnabled: true, checkoutSecretKey: 'example', paymentsReadToken: 'example'))],
            ['billing PUT /api/v1/billing/storefronts/{storefront}/analytics-destination', 'PUT', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->selectAnalyticsDestination('shop', new SF\SelectStorefrontAnalyticsDestination(siteUuid: 'example'))],
            ['billing PUT /api/v1/billing/storefronts/{storefront}/receipt-template', 'PUT', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->selectReceiptTemplate('shop', new SF\SelectStorefrontReceiptTemplate(revision: 'example'))],
            ['billing GET /api/v1/storefronts/{storefront}/offers', 'GET', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->listOffers('shop')],
            ['billing POST /api/v1/storefronts/{storefront}/offers', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->publishOffer('shop', new SF\PublishOffer('Starter', 'month', new SF\UnitPrice('ZAR', '15.25'), '0.15', 'VAT'))],
            ['billing POST /api/v1/storefronts/{storefront}/carts', 'POST', ['storefront' => 'shop'], fn (CustdClient $c) => $c->storefronts()->createCart('shop')],
            ['billing GET /api/v1/storefronts/{storefront}/carts/{cart}', 'GET', ['storefront' => 'shop', 'cart' => 'cart-1'], fn (CustdClient $c) => $c->storefronts()->getCart('shop', 'cart-1')],
            ['billing PUT /api/v1/storefronts/{storefront}/carts/{cart}/lines/{offer}', 'PUT', ['storefront' => 'shop', 'cart' => 'cart-1', 'offer' => 'offer-1'], fn (CustdClient $c) => $c->storefronts()->updateLine('shop', 'cart-1', 'offer-1', new SF\LineQuantity('2.50'))],
            ['billing POST /api/v1/storefronts/{storefront}/carts/{cart}/quotes', 'POST', ['storefront' => 'shop', 'cart' => 'cart-1'], fn (CustdClient $c) => $c->storefronts()->createQuote('shop', 'cart-1')],
            ['billing GET /api/v1/storefronts/{storefront}/quotes/{quote}', 'GET', ['storefront' => 'shop', 'quote' => 'quote-1'], fn (CustdClient $c) => $c->storefronts()->getQuote('shop', 'quote-1')],
            ['billing POST /api/v1/storefronts/{storefront}/quotes/{quote}/checkout', 'POST', ['storefront' => 'shop', 'quote' => 'quote-1'], fn (CustdClient $c) => $c->storefronts()->checkout('shop', 'quote-1')],
            ['billing GET /api/v1/storefronts/{storefront}/purchases/{invoice}', 'GET', ['storefront' => 'shop', 'invoice' => 'invoice-1'], fn (CustdClient $c) => $c->storefronts()->getPurchase('shop', 'invoice-1')],
            ['billing POST /api/v1/storefronts/{storefront}/purchases/{invoice}/payment', 'POST', ['storefront' => 'shop', 'invoice' => 'invoice-1'], fn (CustdClient $c) => $c->storefronts()->startPayment('shop', 'invoice-1')],
            ['billing POST /api/v1/storefronts/{storefront}/invoices/{invoice}/credit-note', 'POST', ['storefront' => 'shop', 'invoice' => 'invoice-1'], fn (CustdClient $c) => $c->storefronts()->issueCreditNote('shop', 'invoice-1', new SF\AdjustmentRequest('Duplicate sale'))],
            ['admin-api GET /api/v1/app/messages/session', 'GET', [], fn (CustdClient $c) => $c->appMessages()->session()],
            ['admin-api POST /api/v1/app/messages/batch', 'POST', [], fn (CustdClient $c) => $c->appMessages()->import(new App\AppMessageBatchRequest(App\AppMessageSource::Sms, []))],
            ['admin-api POST /api/v1/app/messages/search', 'POST', [], fn (CustdClient $c) => $c->appMessages()->search(new App\AppMessageSearchRequest(query: 'test'))],
            ['admin-api GET /api/v1/app/messages/{messageUuid}', 'GET', ['messageUuid' => self::A], fn (CustdClient $c) => $c->appMessages()->get(self::A)],
            ['admin-api DELETE /api/v1/app/messages/sources/{source}', 'DELETE', ['source' => 'sms'], fn (CustdClient $c) => $c->appMessages()->deleteSource(App\AppMessageSource::Sms)],
            ['admin-api PUT /api/v1/app/messages/{messageUuid}/media', 'PUT', ['messageUuid' => self::A], fn (CustdClient $c) => $c->appMessages()->uploadMedia(new App\AppMessageMediaUpload(self::A, 'jpeg'))],
            ['admin-api GET /api/v1/app/messages/{messageUuid}/media/{mediaUuid}', 'GET', ['messageUuid' => self::A, 'mediaUuid' => self::B], fn (CustdClient $c) => $c->appMessages()->downloadMedia(new App\AppMessageMediaRef(self::A, self::B))],
            ['admin-api GET /api/v1/admin/site-insights/tasks', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->getSiteInsightsTasks()],
            ['admin-api GET /api/v1/site-domains', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->list()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->get(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/verify', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->verify(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/attestation', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->attest(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/attestation', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->unattest(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/audit', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->requestAudit(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/findings', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listFindings(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/checks', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->setCheckMode(self::A, SD\SiteCheckMode::PAUSED)],
            ['admin-api GET /api/v1/site-domains/alert-destination', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->getAlertDestination()],
            ['admin-api PUT /api/v1/site-domains/alert-destination', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->setAlertDestination(null, null)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/incidents', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listIncidents(self::A)],
            ['admin-api GET /api/v1/site-domains/search-account', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->getSearchAccount()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/search', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getSearchPerformance(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/search/{provider}', 'PUT', ['domainUuid' => self::A, 'provider' => 'google'], fn (CustdClient $c) => $c->adminSiteDomains()->connectSearch(self::A, SD\SiteSearchProvider::GOOGLE, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/search/{provider}', 'DELETE', ['domainUuid' => self::A, 'provider' => 'google'], fn (CustdClient $c) => $c->adminSiteDomains()->disconnectSearch(self::A, SD\SiteSearchProvider::GOOGLE)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/search/{provider}/retry', 'POST', ['domainUuid' => self::A, 'provider' => 'google'], fn (CustdClient $c) => $c->adminSiteDomains()->retrySearch(self::A, SD\SiteSearchProvider::GOOGLE)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/search/rows', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listSearchRows(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/search/inspections', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listSearchInspections(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/search/inspections', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->requestSearchInspection(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/page-facts', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getPageFacts(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/page-search-queries', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getPageSearchQueries(self::A, self::B)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/page-rechecks', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->requestPageRecheck(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks/{recheckUuid}', 'GET', ['domainUuid' => self::A, 'recheckUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->getPageRecheck(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listPageRechecks(self::A, [])],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/page-wording', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->comparePageWording(self::A, self::B, self::C)],
            ['admin-api GET /api/v1/site-domains/project-context', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->getProjectContext()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/indexnow', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getIndexNow(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/indexnow', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->enableIndexNow(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/indexnow', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->disableIndexNow(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/verify', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->verifyIndexNow(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/submissions', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->submitIndexNow(self::A, [])],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/report', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getReport(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listSavedReports(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}', 'GET', ['domainUuid' => self::A, 'reportUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->getSavedReport(self::A, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}', 'DELETE', ['domainUuid' => self::A, 'reportUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->deleteSavedReport(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/audit-pages', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listAuditPages(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/findings/{findingUuid}/search-impact', 'GET', ['domainUuid' => self::A, 'findingUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->getFindingSearchImpact(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/search-value', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getSearchValue(self::A, ['signup'])],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/audit-delta', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getAuditDelta(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/uptime-history', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getUptimeHistory(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getLighthouseHistory(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse/pages', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->getLighthousePages(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/lighthouse/pages', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->setLighthousePages(self::A, [])],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/probes', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listProbes(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/probes', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->setProbes(self::A, [])],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/report-shares', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listReportShares(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/report-shares/{shareUuid}', 'DELETE', ['domainUuid' => self::A, 'shareUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->revokeReportShare(self::A, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->delete(self::A)],
            ['admin-api POST /api/v1/admin/measurement/projects', 'POST', [], fn (CustdClient $c) => $c->adminMeasurementProjects()->create(new MeasurementProjectCreateRequest(kind: 'x', name: 'x', projectCode: 'x', series: [], target: new MeasurementTargetCreateRequest(name: 'x', state: 'x', targetCode: 'x', targetValue: 1.0)))],
            ['admin-api GET /api/v1/admin/measurement/projects', 'GET', [], fn (CustdClient $c) => $c->adminMeasurementProjects()->list()],
            ['admin-api GET /api/v1/admin/measurement/projects/{projectUuid}', 'GET', ['projectUuid' => self::A], fn (CustdClient $c) => $c->adminMeasurementProjects()->get(self::A)],
            ['admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk', 'POST', ['projectUuid' => self::A], fn (CustdClient $c) => $c->adminMeasurementProjects()->submitObservation(self::A, new MeasurementObservationRow(observedAt: 'x', seriesUuid: 'x', value: 1.0))],
            ['admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv', 'POST', ['projectUuid' => self::A], fn (CustdClient $c) => $c->adminMeasurementProjects()->importCSVString(self::A, self::B, 1)],
            ['admin-api GET /api/v1/admin/workflow-timings/definitions', 'GET', [], fn (CustdClient $c) => $c->adminWorkflowTimings()->listDefinitions(self::A)],
            ['admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}', 'GET', ['workflowKey' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->getDefinition(self::A, self::B)],
            ['admin-api GET /api/v1/admin/workflow-timings/runs', 'GET', [], fn (CustdClient $c) => $c->adminWorkflowTimings()->listRuns(self::A)],
            ['admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}', 'GET', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->getRun(self::A, self::B)],
            ['admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction', 'GET', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->prediction(self::A, self::B)],
            ['admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history', 'GET', ['workflowKey' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->durationHistory(self::A, self::B)],
            ['admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/evaluation', 'GET', ['workflowKey' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->evaluation(self::A, self::B)],
            ['admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild', 'POST', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminWorkflowTimings()->rebuild(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions', 'GET', [], fn (CustdClient $c) => $c->adminMeasurementPredictions()->listDefinitions(self::A)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}', 'GET', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->getDefinition(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions', 'POST', [], fn (CustdClient $c) => $c->adminMeasurementPredictions()->createDefinition(self::A, new MeasurementPredictionDefinitionCreateRequest(definitionKey: 'x', displayName: 'x'))],
            ['admin-api PATCH /api/v1/admin/measurement/predictions/definitions/{definitionUuid}', 'PATCH', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->updateDefinition(self::A, self::B, new MeasurementPredictionDefinitionUpdateRequest(definitionKey: 'x', revision: 1))],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/versions/{versionUuid}', 'GET', ['definitionUuid' => self::B, 'versionUuid' => self::C], fn (CustdClient $c) => $c->adminMeasurementPredictions()->getVersion(self::A, self::B, self::C)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/publish', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->publishVersion(self::A, self::B, new MeasurementPredictionVersionPublishRequest(createdBy: 'x'))],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/activate', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->activateVersion(self::A, self::B, new MeasurementPredictionActivateRequest(versionUuid: 'x'))],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/pause', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->pauseDefinition(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/resume', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->resumeDefinition(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/archive', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->archiveDefinition(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/run-now', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->runNow(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs', 'GET', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->listRuns(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes', 'GET', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->listOutcomes(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/evaluations', 'GET', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->getEvaluation(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events', 'GET', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->listThresholdEvents(self::A, self::B)],
            ['admin-api GET /api/v1/admin/measurement/predictions/sources', 'GET', [], fn (CustdClient $c) => $c->adminMeasurementPredictions()->listSignalSources(self::A)],
            ['admin-api GET /api/v1/admin/measurement/predictions/sources/{sourceUuid}', 'GET', ['sourceUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->getSignalSource(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/sources', 'POST', [], fn (CustdClient $c) => $c->adminMeasurementPredictions()->createSignalSource(self::A, new MeasurementSignalSourceCreateRequest(displayName: 'x', sourceKey: 'x', sourceMode: 'x'))],
            ['admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/activate', 'POST', ['sourceUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->activateSignalSource(self::A, self::B)],
            ['admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/archive', 'POST', ['sourceUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->archiveSignalSource(self::A, self::B)],
            ['admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/download', 'GET', ['requestUuid' => self::A], fn (CustdClient $c) => $c->adminOffboarding()->download(self::A, fopen('php://memory', 'w+b'))],
            ['admin-api GET /api/v1/admin/data-scopes', 'GET', [], fn (CustdClient $c) => $c->adminDataScopes()->listScopes()],
            ['admin-api GET /api/v1/admin/data-scopes/{scopeUuid}', 'GET', ['scopeUuid' => self::A], fn (CustdClient $c) => $c->adminDataScopes()->getScope(self::A)],
            ['admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/disable', 'POST', ['scopeUuid' => self::A], fn (CustdClient $c) => $c->adminDataScopes()->disableScope(self::A)],
            ['admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources', 'GET', ['scopeUuid' => self::A], fn (CustdClient $c) => $c->adminDataScopes()->listResources(self::A)],
            ['admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}', 'GET', ['scopeUuid' => self::A, 'resourceUuid' => self::B], fn (CustdClient $c) => $c->adminDataScopes()->getResource(self::A, self::B)],
            ['admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}/disable', 'POST', ['scopeUuid' => self::A, 'resourceUuid' => self::B], fn (CustdClient $c) => $c->adminDataScopes()->disableResource(self::A, self::B)],
            ['admin-api GET /api/v1/admin/reporting-packs/drafts', 'GET', [], fn (CustdClient $c) => $c->adminReportingPacks()->listDrafts()],
            ['admin-api GET /api/v1/admin/reporting-packs/drafts/{draftId}', 'GET', ['draftId' => self::A], fn (CustdClient $c) => $c->adminReportingPacks()->getDraft(self::A)],
            ['admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/publish', 'POST', ['draftId' => self::A], fn (CustdClient $c) => $c->adminReportingPacks()->publish(self::A)],
            ['admin-api GET /api/v1/admin/reporting-packs/setup-templates', 'GET', [], fn (CustdClient $c) => $c->adminReportingPacks()->listSetupTemplates()],
            ['admin-api GET /api/v1/admin/time-plans', 'GET', [], fn (CustdClient $c) => $c->adminTimePlans()->list(self::A)],
            ['admin-api GET /api/v1/admin/time-plans/{planUuid}', 'GET', ['planUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->get(self::A, self::B)],
            ['admin-api POST /api/v1/admin/time-plans/{planUuid}/retire', 'POST', ['planUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->retire(self::A, self::B)],
            ['admin-api GET /api/v1/admin/time-plans/runs/{runUuid}', 'GET', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->getRun(self::A, self::B)],
            ['admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/history', 'GET', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->history(self::A, self::B)],
            ['admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/annotations', 'GET', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->listAnnotations(self::A, self::B)],
            ['admin-api GET /api/v1/admin/audit/events', 'GET', [], fn (CustdClient $c) => $c->adminAudit()->listEvents()],
            ['admin-api GET /api/v1/admin/audit/events/{eventId}', 'GET', ['eventId' => self::A], fn (CustdClient $c) => $c->adminAudit()->getEvent(self::A)],
            ['admin-api GET /api/v1/admin/audit/events/export', 'GET', [], fn (CustdClient $c) => $c->adminAudit()->exportEvents(fopen('php://memory', 'w+b'))],
            ['admin-api GET /api/v1/admin/reporting-packs/audit-events', 'GET', [], fn (CustdClient $c) => $c->adminAudit()->listReportingPackEvents(self::A)],
            ['admin-api GET /api/v1/admin/usage/me', 'GET', [], fn (CustdClient $c) => $c->adminUsage()->get()],
            ['admin-api GET /api/v1/admin/auth-projects', 'GET', [], fn (CustdClient $c) => $c->adminAuthProjects()->listProjects()],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/company-binding', 'POST', ['projectId' => self::A], fn (CustdClient $c) => $c->adminAuthProjects()->bindCompany(self::A)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions', 'GET', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->listPrincipalSessions(self::A, self::B, self::C, self::D)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->getEnvironmentStatus(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->getEnvironmentAuthDomain(self::A, self::B)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/admit', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->admitEnvironmentAuthDomain(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/capability', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->getEnvironmentCapability(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->listDirectories(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/organisations', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->listEnvironmentOrganisations(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->listPrincipals(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->listInvitations(self::A, self::B)],
            ['admin-api POST /api/v1/data-spaces', 'POST', [], fn (CustdClient $c) => $c->provisioning()->createDataSpace(new PV\DataSpaceCreateRequest('acme-store', 'Acme Store'))],
            ['admin-api GET /api/v1/data-spaces', 'GET', [], fn (CustdClient $c) => $c->provisioning()->listDataSpaces()],
            ['admin-api DELETE /api/v1/data-spaces/{slug}', 'DELETE', ['slug' => self::A], fn (CustdClient $c) => $c->provisioning()->revokeDataSpace(self::A)],
            ['admin-api POST /api/v1/producer-provisioning', 'POST', [], fn (CustdClient $c) => $c->provisioning()->provisionProducer(new PV\ProvisionProducerRequest('acme', 'webhook'))],
            ['admin-api GET /api/v1/producer-provisioning', 'GET', [], fn (CustdClient $c) => $c->provisioning()->listProducers()],
            ['admin-api POST /api/v1/producer-provisioning/{clientId}/rotate-secret', 'POST', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->rotateProducerSecret(self::A)],
            ['admin-api PATCH /api/v1/producer-provisioning/{clientId}/environment', 'PATCH', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->updateProducerEnvironment(self::A, new PV\ProducerEnvironmentUpdateRequest('staging'))],
            ['admin-api POST /api/v1/data-spaces/{slug}/erasure', 'POST', ['slug' => 'acme-store'], fn (CustdClient $c) => $c->provisioning()->eraseDataSpace('acme-store')],
            ['admin-api GET /api/v1/data-spaces/{slug}/erasure', 'GET', ['slug' => 'acme-store'], fn (CustdClient $c) => $c->provisioning()->getDataSpaceErasure('acme-store')],
            ['admin-api PUT /api/v1/producer-provisioning/{clientId}/signing-keys', 'PUT', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->setProducerSigningKeys(self::A, new PV\ProducerSigningKeysUpdateRequest(['AAAA']))],
            ['admin-api GET /api/v1/producer-provisioning/{clientId}/signing-keys', 'GET', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->getProducerSigningKeys(self::A)],
            ['admin-api GET /api/v1/data-spaces/{slug}/signing-status', 'GET', ['slug' => 'acme-store'], fn (CustdClient $c) => $c->provisioning()->getDataSpaceSigningStatus('acme-store')],
            ['admin-api POST /api/v1/data-spaces/{slug}/sites/{siteUuid}/adopt', 'POST', ['slug' => 'acme-store', 'siteUuid' => self::A], fn (CustdClient $c) => $c->provisioning()->adoptDataSpaceSite('acme-store', self::A)],
            ['admin-api DELETE /api/v1/producer-provisioning/{clientId}', 'DELETE', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->revokeProducer(self::A)],
            ['admin-api GET /api/v1/producer-provisioning/{clientId}', 'GET', ['clientId' => self::A], fn (CustdClient $c) => $c->provisioning()->getProducer(self::A)],
            ['admin-api GET /api/v1/data-spaces/usage', 'GET', [], fn (CustdClient $c) => $c->provisioning()->getDataSpaceUsage()],
            ['admin-api POST /api/v1/data-spaces/{slug}/producer-reservations', 'POST', ['slug' => 'acme-store'], fn (CustdClient $c) => $c->provisioning()->reserveProducer('acme-store', new PV\ProducerReservationRequest('webhook', 600))],
            ['admin-api GET /api/v1/data-spaces/{slug}/producer-reservations', 'GET', ['slug' => 'acme-store'], fn (CustdClient $c) => $c->provisioning()->listProducerReservations('acme-store')],
            ['admin-api POST /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}/claim', 'POST', ['slug' => 'acme-store', 'producerSlug' => 'webhook'], fn (CustdClient $c) => $c->provisioning()->claimProducerReservation('acme-store', 'webhook', new PV\ProducerReservationClaimRequest(self::A))],
            ['admin-api DELETE /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}', 'DELETE', ['slug' => 'acme-store', 'producerSlug' => 'webhook'], fn (CustdClient $c) => $c->provisioning()->releaseProducerReservation('acme-store', 'webhook')],
            ['analytics-api GET /api/v1/reporting/dashboards/{key}', 'GET', ['key' => self::A], fn (CustdClient $c) => $c->reporting()->dashboard(self::A)],
            ['analytics-api GET /api/v1/reporting/exports', 'GET', [], fn (CustdClient $c) => $c->reporting()->listExports()],
            ['analytics-api GET /api/v1/reporting/exports/{exportID}', 'GET', ['exportID' => self::A], fn (CustdClient $c) => $c->reporting()->getExport(self::A)],
            ['analytics-api POST /api/v1/reporting/exports/{exportID}/cancel', 'POST', ['exportID' => self::A], fn (CustdClient $c) => $c->reporting()->cancelExport(self::A)],
            ['analytics-api GET /api/v1/reporting/exports/{exportID}/artifacts/{artifactID}', 'GET', ['exportID' => self::A, 'artifactID' => self::B], fn (CustdClient $c) => $c->reporting()->downloadExport(self::A, self::B)],
            ['analytics-api POST /api/v1/reporting/query', 'POST', [], fn (CustdClient $c) => $c->reporting()->query(new ReportingQueryRequest(metrics: ['m'], template: 't'))],
            ['analytics-api GET /api/v1/processing/{receiptUuid}', 'GET', ['receiptUuid' => self::A], fn (CustdClient $c) => $c->reporting()->receipt(self::A)],
            ['analytics-api GET /api/v1/reporting/outputs', 'GET', [], fn (CustdClient $c) => $c->reporting()->outputs()],
            ['analytics-api GET /api/v1/reporting/outputs/{outputUuid}', 'GET', ['outputUuid' => self::A], fn (CustdClient $c) => $c->reporting()->output(self::A)],
            ['analytics-api POST /api/v1/reporting/outputs/{outputUuid}/query', 'POST', ['outputUuid' => self::A], fn (CustdClient $c) => $c->reporting()->queryOutput(self::A, new ReportingQueryRequest(metrics: ['m'], template: 't'))],
            ['schema-registry GET /api/v1/parsers/presets', 'GET', [], fn (CustdClient $c) => $c->parsers()->listPresets()],
            ['schema-registry GET /api/v1/parsers', 'GET', [], fn (CustdClient $c) => $c->parsers()->list()],
            ['schema-registry DELETE /api/v1/parsers/{uuid}', 'DELETE', ['uuid' => self::A], fn (CustdClient $c) => $c->parsers()->delete(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/traffic', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->accessLogs()->getTraffic(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/ai-visibility', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->accessLogs()->getAIVisibility(self::A)],
            ['admin-api POST /api/v1/admin/access-log-hours/replay', 'POST', [], fn (CustdClient $c) => $c->adminSiteDomains()->accessLogs()->replayAccessLogHour(new \DateTimeImmutable('2026-01-01T00:00:00Z'))],
            ['admin-api GET /api/v1/site-domains/ai-settings', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->getSettings()],
            ['admin-api GET /api/v1/site-domains/ai-usage', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->getTenantUsage()],
            ['admin-api GET /api/v1/admin/site-insights/ai-usage', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->getPlatformUsage()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/analytics', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->analytics()->getAnalytics(self::A)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/analytics/ga4', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->analytics()->connectGA4(self::A, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/analytics/ga4', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->analytics()->disconnectGA4(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/campaign-links', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->campaignLinks()->listCampaignLinks(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links/{linkUuid}/archive', 'POST', ['domainUuid' => self::A, 'linkUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->campaignLinks()->archiveCampaignLink(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/export', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->export()->getExport(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/export/search-metrics', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->export()->listSearchMetrics(self::A)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/next-actions', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->nextActions()->forDomain(self::A)],
            ['admin-api GET /api/v1/site-domains/portfolio-summary', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->nextActions()->portfolioSummary()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/rankings', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->rankings()->getRankings(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}', 'DELETE', ['domainUuid' => self::A, 'keywordUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->rankings()->untrackKeyword(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/search-pool', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->searchPool()->getSearchPool()],
            ['admin-api PUT /api/v1/site-domains/search-pool', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->searchPool()->setSearchPool(false, null)],
            ['admin-api GET /api/v1/site-domains/search-pool/queries', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->searchPool()->listSearchPoolQueries()],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/status-page', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->statusPage()->getSettings(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/status-page', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->statusPage()->unpublish(self::A)],
            ['admin-api GET /api/v1/site-domains/web-domains', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getWebDomains()],
            ['admin-api GET /api/v1/site-domains/web-pages', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->listWebPages(self::A)],
            ['admin-api GET /api/v1/site-domains/referring-domains', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getReferringDomains(self::A)],
            ['admin-api GET /api/v1/site-domains/topic-trends', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getTopicTrends()],
            ['admin-api GET /api/v1/site-domains/regional-trends', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getRegionalTrends()],
            ['admin-api GET /api/v1/site-domains/content-gap', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getContentGap()],
            ['admin-api GET /api/v1/site-domains/keyword-lists', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->listKeywordLists()],
            ['admin-api DELETE /api/v1/site-domains/keyword-lists', 'DELETE', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->deleteKeywordList(self::A)],
            ['admin-api GET /api/v1/site-domains/keyword-clusters', 'GET', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->getKeywordClusters(self::A)],
            ['admin-api POST /api/v1/admin/campaign-email-revisions/{revision}/render', 'POST', ['revision' => self::DIGEST], fn (CustdClient $c) => $c->adminCampaignEmailRevisions()->render(self::DIGEST, [])],
            ['admin-api POST /api/v1/admin/campaign-email-revisions/{revision}/preview', 'POST', ['revision' => self::DIGEST], fn (CustdClient $c) => $c->adminCampaignEmail()->previewRevision(self::DIGEST, [])],
            ['admin-api POST /api/v1/site-domains', 'POST', [], fn (CustdClient $c) => $c->adminSiteDomains()->create(new SD\CreateSiteDomainRequest(self::A, 'example.com'))],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/browser-collector', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->convergeBrowserCollector(self::A, SD\SiteBrowserCollectorRequest::enable('production'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/page-check', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->checkPage(self::A, new SD\SitePageCheckRequest('https://example.com/', '<html></html>'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/wording-compare', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->compareWording(self::A, new SD\SiteWordingCompareRequest('one', 'two'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/robots-test', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->testRobots(self::A, new SD\SiteRobotsTestRequest('https://example.com/', 'Googlebot'))],
            ['admin-api PUT /api/v1/site-domains/project-context', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->setProjectContext(self::A, new SD\SiteProjectContextRequest)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/saved-reports', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->saveReport(self::A, new SD\SavedSiteReportRequest('Weekly'))],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}', 'PUT', ['domainUuid' => self::A, 'reportUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->replaceSavedReport(self::A, self::B, new SD\SavedSiteReportRequest('Weekly'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/report-shares', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->createReportShare(self::A, new SD\SiteReportShareRequest)],
            ['admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}', 'PUT', ['workflowKey' => 'wf'], fn (CustdClient $c) => $c->adminWorkflowTimings()->reconcile(self::A, new WT\WorkflowDeclaration('wf', 'Workflow'))],
            ['admin-api POST /api/v1/admin/workflow-timings/observations', 'POST', [], fn (CustdClient $c) => $c->adminWorkflowTimings()->append(self::A, $obs)],
            ['admin-api POST /api/v1/admin/workflow-timings/corrections', 'POST', [], fn (CustdClient $c) => $c->adminWorkflowTimings()->correct(self::A, $obs)],
            ['admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations', 'POST', ['definitionUuid' => self::B], fn (CustdClient $c) => $c->adminMeasurementPredictions()->evaluateDurationHistory(self::A, self::B, new DurationEvaluationRequest(self::C, 'run'))],
            ['admin-api POST /api/v1/admin/data-scopes', 'POST', [], fn (CustdClient $c) => $c->adminDataScopes()->createScope(new DS\CreateScopeRequest('code', 'Name'))],
            ['admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}', 'PATCH', ['scopeUuid' => self::A], fn (CustdClient $c) => $c->adminDataScopes()->updateScope(self::A, new DS\UpdateScopeRequest(name: 'Name'))],
            ['admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources', 'POST', ['scopeUuid' => self::A], fn (CustdClient $c) => $c->adminDataScopes()->createResource(self::A, new DS\CreateResourceRequest('code', 'Name'))],
            ['admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}', 'PATCH', ['scopeUuid' => self::A, 'resourceUuid' => self::B], fn (CustdClient $c) => $c->adminDataScopes()->updateResource(self::A, self::B, new DS\UpdateResourceRequest(name: 'Name'))],
            ['admin-api GET /api/v1/admin/data-scope-grants', 'GET', [], fn (CustdClient $c) => $c->adminDataScopes()->listGrants($principal)],
            ['admin-api POST /api/v1/admin/data-scope-grants', 'POST', [], fn (CustdClient $c) => $c->adminDataScopes()->createGrant($grant)],
            ['admin-api POST /api/v1/admin/data-scope-grants/revoke', 'POST', [], fn (CustdClient $c) => $c->adminDataScopes()->revokeGrant($grant)],
            ['admin-api POST /api/v1/admin/reporting-packs/drafts', 'POST', [], fn (CustdClient $c) => $c->adminReportingPacks()->createDraft(new RP\ReportingPackDraftCreateRequest($pack))],
            ['admin-api PUT /api/v1/admin/reporting-packs/drafts/{draftId}', 'PUT', ['draftId' => self::A], fn (CustdClient $c) => $c->adminReportingPacks()->updateDraft(self::A, new RP\ReportingPackDraftUpdateRequest($pack, 1))],
            ['admin-api POST /api/v1/admin/reporting-packs/validate', 'POST', [], fn (CustdClient $c) => $c->adminReportingPacks()->validate(new RP\ReportingPackDraftCreateRequest($pack))],
            ['admin-api POST /api/v1/admin/reporting-packs/preview', 'POST', [], fn (CustdClient $c) => $c->adminReportingPacks()->preview(new RP\ReportingPackPreviewRequest($pack, 'acme', new RP\QueryHint('summary', ['events'])))],
            ['admin-api POST /api/v1/admin/reporting-packs/setup-templates/{kind}/bind', 'POST', ['kind' => self::A], fn (CustdClient $c) => $c->adminReportingPacks()->bindSetupTemplate(self::A, new RP\ReportingPackSetupTemplateBindRequest(new RP\LogObservabilityBindings('e', 's', 'r')))],
            ['admin-api POST /api/v1/admin/time-plans', 'POST', [], fn (CustdClient $c) => $c->adminTimePlans()->create(self::A, new TP\DraftRequest('plan', 'Plan', $plan))],
            ['admin-api POST /api/v1/admin/time-plans/preview', 'POST', [], fn (CustdClient $c) => $c->adminTimePlans()->preview(self::A, $plan)],
            ['admin-api PATCH /api/v1/admin/time-plans/{planUuid}', 'PATCH', ['planUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->revise(self::A, self::B, new TP\DraftRevisionRequest(1, 'plan', 'Plan', $plan))],
            ['admin-api POST /api/v1/admin/time-plans/{planUuid}/publish', 'POST', ['planUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->publish(self::A, self::B, new TP\RevisionRequest(1))],
            ['admin-api POST /api/v1/admin/time-plans/runs', 'POST', [], fn (CustdClient $c) => $c->adminTimePlans()->createRun(self::A, new TP\RunRequest(self::B))],
            ['admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/commands', 'POST', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->execute(self::A, self::B, new TP\CommandRequest('command-1', 'idem-1', 0, 'start_run'))],
            ['admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations', 'POST', ['runUuid' => self::B], fn (CustdClient $c) => $c->adminTimePlans()->createAnnotation(self::A, self::B, new TP\AnnotationInput('note', text: 'hello'))],
            ['admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/corrections', 'POST', ['runUuid' => self::B, 'annotationUuid' => self::C], fn (CustdClient $c) => $c->adminTimePlans()->correctAnnotation(self::A, self::B, self::C, new TP\AnnotationInput('note', text: 'hello'))],
            ['admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/redact', 'POST', ['runUuid' => self::B, 'annotationUuid' => self::C], fn (CustdClient $c) => $c->adminTimePlans()->redactAnnotation(self::A, self::B, self::C, new TP\RedactionRequest('privacy'))],
            ['admin-api POST /api/v1/admin/auth-projects', 'POST', [], fn (CustdClient $c) => $c->adminAuthProjects()->createProject(new AP\CreateRequest('app', 'App', 'production', 'isolated', 'explicit_grants'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments', 'POST', ['projectId' => self::A], fn (CustdClient $c) => $c->adminAuthProjects()->createEnvironment(self::A, new AP\EnvironmentCreateRequest('staging', 'Staging', 'isolated', 'explicit_grants'), $key)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/export', 'GET', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->exportPrincipal($target)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/suspend', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->suspendPrincipal($target, $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/restore', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->restorePrincipal($target, $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/erase', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->erasePrincipal($target, new AP\ApplicationPrincipalErasureRequest(true), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->revokePrincipalSession(self::A, self::B, self::C, self::D, new AP\SessionRevokeRequest('session-1'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke-all', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->revokePrincipalSessions(self::A, self::B, self::C, self::D, new AP\SessionsRevokeAllRequest(true), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships/revoke', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->revokePrincipalMembership(self::A, self::B, self::C, self::D, new AP\MembershipRevokeRequest('org-1'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/apply', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->applyEnvironmentDesiredState(self::A, self::B, $desired, $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/preview', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->previewEnvironmentDesiredState(self::A, self::B, $desired)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{action}', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'action' => 'enable'], fn (CustdClient $c) => $c->adminAuthProjects()->actOnDirectory(self::A, self::B, 'enable', new AP\DirectoryRequest('pool-1', 1), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/clients/reconcile', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->reconcileEnvironmentClients(self::A, self::B, new AP\ClientSyncRequest(1), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->issueInvitation(self::A, self::B, new AP\InvitationIssueRequest('pool-1', 'org-1', 'a@example.com', 'member', 3600), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/revoke', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->revokeInvitation(self::A, self::B, new AP\InvitationRevocationRequest('inv-1'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/redeliver', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->redeliverInvitation(self::A, self::B, new AP\InvitationRedeliveryRequest('inv-1'), $key)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences', 'GET', ['projectId' => self::A, 'environmentId' => self::B, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->listPrincipalAudiences($target)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/grant', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->grantPrincipalAudience($target, new AP\AudienceGrantRequest(self::C, 'aud', 'org-1'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/revoke', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->revokePrincipalAudience($target, new AP\AudienceGrantRequest(self::C, 'aud', 'org-1'), $key)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile', 'GET', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->getPrincipalProfile($target)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->setPrincipalProfile($target, new AP\ProfileValuesRequest([new AP\ApplicationProfileValue('display_name', 'Ada')]), $key)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships', 'GET', ['projectId' => self::A, 'environmentId' => self::B, 'directoryId' => self::C, 'providerSubject' => self::D], fn (CustdClient $c) => $c->adminAuthProjects()->listPrincipalMemberships($target)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/delete', 'POST', ['projectId' => self::A], fn (CustdClient $c) => $c->adminAuthProjects()->deleteProject(self::A, new AP\ProjectDeletionRequest('app'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/delete', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->deleteEnvironment(self::A, self::B, new AP\EnvironmentDeletionRequest('staging'), $key)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/offboard', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->offboardEnvironment(self::A, self::B, new AP\EnvironmentOffboardRequest('staging'), $key)],
            ['analytics-api POST /api/v1/reporting/exports', 'POST', [], fn (CustdClient $c) => $c->reporting()->createExport(new ReportExportCreateRequest('executive', ['csv'], new ExportQueryParameters))],
            ['analytics-api POST /api/v1/reporting/insights/subject', 'POST', [], fn (CustdClient $c) => $c->reporting()->subjectInsight(new SubjectInsightRequest(subject: 'subject-1', template: 'learning_subject', rangeDays: 30))],
            ['analytics-api POST /api/v1/analytics/query', 'POST', [], fn (CustdClient $c) => $c->analytics()->query(new AnalyticsEventsQueryRequest('2026-09-14'))],
            ['analytics-api POST /api/v1/analytics/query-range', 'POST', [], fn (CustdClient $c) => $c->analytics()->queryRange(new RangeQueryRequest('2026-09-14', '2026-09-15'))],
            ['schema-registry POST /api/v1/parsers', 'POST', [], fn (CustdClient $c) => $c->parsers()->create($saveParser)],
            ['schema-registry PUT /api/v1/parsers/{uuid}', 'PUT', ['uuid' => self::A], fn (CustdClient $c) => $c->parsers()->update(self::A, $saveParser)],
            ['ingest-api POST /api/v1/parser-preview', 'POST', [], fn (CustdClient $c) => $c->parsers()->preview(new ParserPreviewRequest('code', 'Name', 'regex', '^\\S+', '2006-01-02T15:04:05Z07:00', [], 'line', 20))],
            ['admin-api PUT /api/v1/site-domains/ai-settings', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->setSettings(new SD\SiteAISettingsRequest(SD\SiteAIMode::OFF, 0))],
            ['admin-api PUT /api/v1/site-domains/ai-settings/consent', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->setConsent(SD\SiteAIConsentRequest::grant('2026-01'))],
            ['admin-api POST /api/v1/site-domains/ai-owner-handoffs', 'POST', [], fn (CustdClient $c) => $c->adminSiteDomains()->ai()->createOwnerHandoff(new SD\SiteAIOwnerHandoffRequest('acme', 'owner-1'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->campaignLinks()->createCampaignLink(self::A, new SD\SiteCampaignLinkRequest('https://example.com/', 'news', 'email', 'launch'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/rankings/keywords', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->rankings()->trackKeyword(self::A, new SD\SiteTrackKeywordRequest('custd'))],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}', 'PUT', ['domainUuid' => self::A, 'keywordUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->rankings()->updateTrackedKeyword(self::A, self::B, new SD\SiteUpdateTrackedKeywordRequest(true))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/status-page/preview', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->statusPage()->preview(self::A, $draft)],
            ['admin-api PUT /api/v1/site-domains/{domainUuid}/status-page', 'PUT', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->statusPage()->publish(self::A, $draft)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/status-page/updates', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->statusPage()->postUpdate(self::A, new SD\SiteStatusUpdateRequest(self::B, 'Investigating'))],
            ['admin-api PUT /api/v1/site-domains/keyword-lists', 'PUT', [], fn (CustdClient $c) => $c->adminSiteDomains()->webData()->saveKeywordList(new SD\SiteKeywordListRequest('List', ['custd']))],
            ['admin-api POST /api/v1/admin/workflow-timings/observations:batch', 'POST', [], fn (CustdClient $c) => $c->adminWorkflowTimings()->appendBatch(self::A, [$obs])],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/approval', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->approve(self::A)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/approval', 'DELETE', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->withdrawApproval(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/uptime-check', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->requestUptimeCheck(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/incidents/{incidentUuid}/acknowledgment', 'POST', ['domainUuid' => self::A, 'incidentUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->acknowledgeIncident(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->listFindingDismissals(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/finding-dismissals', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->dismissFinding(self::A, new SD\SiteFindingDismissalRequest(self::B, SD\SiteFindingDismissalScope::RULE, 'accepted'))],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/finding-dismissals/{dismissalUuid}', 'DELETE', ['domainUuid' => self::A, 'dismissalUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->restoreFinding(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->listHeartbeats(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->createHeartbeat(self::A, new SD\SiteHeartbeatRequest('backup', new SD\SiteHeartbeatSchedule('0 3 * * *', 'UTC', 30)))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}/credential', 'POST', ['domainUuid' => self::A, 'monitorUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->rotateHeartbeat(self::A, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}', 'DELETE', ['domainUuid' => self::A, 'monitorUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->deleteHeartbeat(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/private-uptime', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->getPrivateUptime(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->createPrivateUptime(self::A, new SD\PrivateUptimeRequest('office'))],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/check', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->requestPrivateUptime(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}/credential', 'POST', ['domainUuid' => self::A, 'monitorUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->rotatePrivateUptime(self::A, self::B)],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}', 'DELETE', ['domainUuid' => self::A, 'monitorUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->deletePrivateUptime(self::A, self::B)],
            ['admin-api GET /api/v1/site-domains/{domainUuid}/maintenance', 'GET', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->listMaintenance(self::A)],
            ['admin-api POST /api/v1/site-domains/{domainUuid}/maintenance', 'POST', ['domainUuid' => self::A], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->scheduleMaintenance(self::A, new SD\SiteMaintenanceWindowRequest(self::B, '2026-12-01T00:00:00Z', '2026-12-01T01:00:00Z'))],
            ['admin-api DELETE /api/v1/site-domains/{domainUuid}/maintenance/{windowUuid}', 'DELETE', ['domainUuid' => self::A, 'windowUuid' => self::B], fn (CustdClient $c) => $c->adminSiteDomains()->monitoring()->cancelMaintenance(self::A, self::B)],
            ['admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain', 'PUT', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->bindEnvironmentAuthDomain(self::A, self::B, new AP\BindAuthDomainRequest(self::C, 'auth.example.com'))],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/mint', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->mintEnvironmentAuthDomain(self::A, self::B, new AP\MintAuthDomainRequest(self::C))],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/retry', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->retryEnvironmentAuthDomain(self::A, self::B)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/disable', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->disableEnvironmentAuthDomain(self::A, self::B)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/release', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->releaseEnvironmentAuthDomain(self::A, self::B)],
            ['admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override', 'PUT', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->setEnvironmentAuthDomainImageOverride(self::A, self::B, new AP\AuthDomainImageOverrideRequest('hydra', 'sha256:'.self::DIGEST, 'INC-1', '2026-12-01T00:00:00Z'))],
            ['admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override', 'DELETE', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->clearEnvironmentAuthDomainImageOverride(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->listEnvironmentAppLinks(self::A, self::B)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->setEnvironmentBrandLogo(self::A, self::B, 'logo.png', 'png-bytes')],
            ['admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo', 'DELETE', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->clearEnvironmentBrandLogo(self::A, self::B)],
            ['admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases', 'GET', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->releases()->list(self::A, self::B)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases', 'POST', ['projectId' => self::A, 'environmentId' => self::B], fn (CustdClient $c) => $c->adminAuthProjects()->releases()->create(self::A, self::B, new AP\AppReleaseCreateRequest([new AP\AppReleaseFile('index.html', 3, self::DIGEST, 'text/html')]))],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/files', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'releaseId' => self::C], fn (CustdClient $c) => $c->adminAuthProjects()->releases()->uploadFile(self::A, self::B, self::C, 'index.html', 'abc')],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/verify', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'releaseId' => self::C], fn (CustdClient $c) => $c->adminAuthProjects()->releases()->verify(self::A, self::B, self::C)],
            ['admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/promote', 'POST', ['projectId' => self::A, 'environmentId' => self::B, 'releaseId' => self::C], fn (CustdClient $c) => $c->adminAuthProjects()->releases()->promote(self::A, self::B, self::C)],
            ['ingest-api POST /api/v1/events', 'POST', [], fn (CustdClient $c) => $c->ingestEvent(self::event())],
            ['ingest-api POST /api/v1/events/batch', 'POST', [], fn (CustdClient $c) => $c->track(self::event())],
            ['ingest-api POST /api/v1/raw', 'POST', [], fn (CustdClient $c) => $c->ingestRawLines(new RawIngestRequest("line\n", self::A))],
            ['ingest-api POST /api/v1/managed-audit/redactions', 'POST', [], fn (CustdClient $c) => $c->redactAwthyAuditEvents(AwthyAuditRedactionRequest::fromArray('store-1', ['redactionId' => self::A, 'reason' => 'privacy_erasure', 'events' => [['localAuditEventId' => 'evt-1', 'fields' => ['actor']]]]))],
            ['ingest-api ANY /api/v1/errors/api/{project}/envelope/', 'POST', ['project' => '1'], fn (CustdClient $c, \Closure $deliver) => (new ET\Client(new ET\Config(self::BASE_URL, 'site_pk_'.str_repeat('a', 32), 'test'), $deliver))->captureException(new ET\CaptureRequest(new \RuntimeException('boom')))],
            ['schema-registry GET /api/v1/schemas', 'GET', [], fn (CustdClient $c) => $c->schemas()->list()],
            ['schema-registry GET /api/v1/schemas/{eventType}/versions', 'GET', ['eventType' => 'page.view'], fn (CustdClient $c) => $c->schemas()->listVersions('page.view')],
            ['schema-registry GET /api/v1/schemas/{eventType}/{version}', 'GET', ['eventType' => 'page.view', 'version' => '1.0.0'], fn (CustdClient $c) => $c->schemas()->get('page.view', '1.0.0')],
            ['schema-registry POST /api/v1/schemas', 'POST', [], fn (CustdClient $c) => $c->schemas()->register(new SC\EventSchemaRegisterRequest('page.view', 'Page view', '1.0.0', '{}'))],
            ['schema-registry POST /api/v1/schemas/validate', 'POST', [], fn (CustdClient $c) => $c->schemas()->validate(new SC\EventSchemaCheckRequest('page.view', '1.0.0', '{}'))],
            ['schema-registry POST /api/v1/schemas/dry-run', 'POST', [], fn (CustdClient $c) => $c->schemas()->dryRun(new SC\EventSchemaCheckRequest('page.view', '1.0.0', '{}'))],
            ['schema-registry POST /api/v1/schemas/infer', 'POST', [], fn (CustdClient $c) => $c->schemas()->infer(new SC\EventSchemaInferRequest([['a' => 1]]))],
            ['schema-registry POST /api/v1/schemas/{eventType}/{version}/active', 'POST', ['eventType' => 'page.view', 'version' => '1.0.0'], fn (CustdClient $c) => $c->schemas()->activate('page.view', '1.0.0')],
            ['schema-registry PUT /api/v1/schemas/{eventType}/{version}/enabled', 'PUT', ['eventType' => 'page.view', 'version' => '1.0.0'], fn (CustdClient $c) => $c->schemas()->enable('page.view', '1.0.0')],
            ['schema-registry DELETE /api/v1/schemas/{eventType}/{version}/enabled', 'DELETE', ['eventType' => 'page.view', 'version' => '1.0.0'], fn (CustdClient $c) => $c->schemas()->disable('page.view', '1.0.0')],
            ['schema-registry DELETE /api/v1/schemas/{eventType}', 'DELETE', ['eventType' => 'page.view'], fn (CustdClient $c) => $c->schemas()->disableEventType('page.view')],
            ['admin-api POST /api/v1/admin/subject-exports', 'POST', [], fn (CustdClient $c) => $c->adminSubjectExports()->create(new SubjectExportCreateRequest(idempotencyKey: 'x', opaqueSubjectId: 'x', scope: 'access'))],
            ['admin-api GET /api/v1/admin/subject-exports', 'GET', [], fn (CustdClient $c) => $c->adminSubjectExports()->list()],
            ['admin-api GET /api/v1/admin/subject-exports/{requestId}', 'GET', ['requestId' => self::A], fn (CustdClient $c) => $c->adminSubjectExports()->get(self::A)],
            ['admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel', 'POST', ['requestId' => self::A], fn (CustdClient $c) => $c->adminSubjectExports()->cancel(self::A)],
            ['admin-api GET /api/v1/admin/subject-exports/{requestId}/download', 'GET', ['requestId' => self::A], fn (CustdClient $c) => $c->adminSubjectExports()->download(self::A, 'access')],
            ['admin-api POST /api/v1/admin/subject-exports/{requestId}/force', 'POST', ['requestId' => self::A], fn (CustdClient $c) => $c->adminSubjectExports()->force(self::A, 'acme')],
            ['admin-api POST /api/v1/admin/privacy/erasures', 'POST', [], fn (CustdClient $c) => $c->adminPrivacyErasures()->create(new PrivacyErasureCreateRequest(companySlug: 'acme', forceNow: false, reason: 'x', redactionId: 'x', selector: new PrivacyErasureSelector(type: 'x', value: 'x')))],
            ['admin-api GET /api/v1/admin/privacy/erasures', 'GET', [], fn (CustdClient $c) => $c->adminPrivacyErasures()->list()],
            ['admin-api GET /api/v1/admin/privacy/erasures/{requestUuid}', 'GET', ['requestUuid' => self::A], fn (CustdClient $c) => $c->adminPrivacyErasures()->get(self::A)],
            ['admin-api POST /api/v1/admin/privacy/erasures/{requestUuid}/force', 'POST', ['requestUuid' => self::A], fn (CustdClient $c) => $c->adminPrivacyErasures()->force(self::A)],
            ['admin-api GET /api/v1/admin/retention/policies', 'GET', [], fn (CustdClient $c) => $c->adminRetention()->list()],
            ['admin-api GET /api/v1/admin/retention/policies/{tenantSlug}', 'GET', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->get(self::A)],
            ['admin-api PUT /api/v1/admin/retention/policies/{tenantSlug}', 'PUT', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->upsert(self::A, new RetentionPolicyUpsertRequest(legalHold: false, maxAgeSeconds: 1, precedence: 1, retentionClass: 'archive', scope: 'tenant'))],
            ['admin-api DELETE /api/v1/admin/retention/policies/{tenantSlug}', 'DELETE', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->delete(self::A)],
            ['admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/preview', 'POST', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->preview(self::A)],
            ['admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/apply', 'POST', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->apply(self::A)],
            ['admin-api GET /api/v1/admin/retention/policies/{tenantSlug}/runs', 'GET', ['tenantSlug' => self::A], fn (CustdClient $c) => $c->adminRetention()->listRuns(self::A)],
            ['admin-api GET /api/v1/admin/data-labels', 'GET', [], fn (CustdClient $c) => $c->adminDataLabels()->list()],
            ['admin-api GET /api/v1/admin/data-labels/catalogue', 'GET', [], fn (CustdClient $c) => $c->adminDataLabels()->catalogue()],
            ['admin-api GET /api/v1/admin/data-labels/{definitionUuid}', 'GET', ['definitionUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->get(self::A)],
            ['admin-api POST /api/v1/admin/data-labels', 'POST', [], fn (CustdClient $c) => $c->adminDataLabels()->create(new DataLabelDefinitionCreateRequest(allowedScopes: [], description: 'x', displayName: 'x', intendedUse: 'x', key: 'x', propagationPolicy: 'event_type_to_event', sensitivity: 'internal', synonyms: []))],
            ['admin-api PATCH /api/v1/admin/data-labels/{definitionUuid}', 'PATCH', ['definitionUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->update(self::A, new DataLabelDefinitionUpdateRequest(allowedScopes: [], description: 'x', displayName: 'x', intendedUse: 'x', propagationPolicy: 'event_type_to_event', sensitivity: 'internal', synonyms: []))],
            ['admin-api POST /api/v1/admin/data-labels/{definitionUuid}/disable', 'POST', ['definitionUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->disable(self::A)],
            ['admin-api POST /api/v1/admin/data-labels/{definitionUuid}/values', 'POST', ['definitionUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->createValue(self::A, new DataLabelValueCreateRequest(description: 'x', displayName: 'x', value: 'x'))],
            ['admin-api PATCH /api/v1/admin/data-label-values/{valueUuid}', 'PATCH', ['valueUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->updateValue(self::A, new DataLabelValueUpdateRequest(description: 'x', displayName: 'x'))],
            ['admin-api POST /api/v1/admin/data-label-values/{valueUuid}/disable', 'POST', ['valueUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->disableValue(self::A)],
            ['admin-api GET /api/v1/admin/data-labels/usage', 'GET', [], fn (CustdClient $c) => $c->adminDataLabels()->listUsage()],
            ['admin-api GET /api/v1/admin/data-label-assignments', 'GET', [], fn (CustdClient $c) => $c->adminDataLabels()->listAssignments()],
            ['admin-api PUT /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}', 'PUT', ['slug' => self::A, 'definitionUuid' => self::B], fn (CustdClient $c) => $c->adminDataLabels()->setEventTypeDefault(self::A, self::B, new EventTypeDataLabelDefaultRequest(valueUuid: 'x'))],
            ['admin-api DELETE /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}', 'DELETE', ['slug' => self::A, 'definitionUuid' => self::B], fn (CustdClient $c) => $c->adminDataLabels()->removeEventTypeDefault(self::A, self::B)],
            ['admin-api PUT /api/v1/admin/event-schemas/{schemaUuid}/field-data-labels', 'PUT', ['schemaUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->setSchemaFieldAssignment(self::A, new SchemaFieldDataLabelAssignmentRequest(definitionUuid: 'x', fieldPath: 'x', valueUuid: 'x'))],
            ['admin-api DELETE /api/v1/admin/data-label-assignments/schema-fields/{assignmentUuid}', 'DELETE', ['assignmentUuid' => self::A], fn (CustdClient $c) => $c->adminDataLabels()->removeSchemaFieldAssignment(self::A)],
        ];

        return array_merge($rows, Surface\TypedClientRows::rows(), self::handRows());
    }

    /**
     * handRows are the operations whose public method is written by hand: binary and HTML answers, and routes
     * Custd publishes no OpenAPI for.
     *
     * @return list<array{string, string, array<string, string>, \Closure(CustdClient): mixed}>
     */
    private static function handRows(): array
    {
        $png = "\x89PNG\r\n\x1a\n".str_repeat("\0", 8);
        $pack = new RP\PackDefinition('pack', 'Pack', 'owner', 1, true, [], [], [], [], new RP\TrustDiagnostics([], []), new RP\ProofProfile('proof', [], [], [], 'table'));

        return [
            ['admin-api GET /api/v1/app/item/alerts/unsubscribe', 'GET', [], fn (CustdClient $c) => $c->appItems('site_pk_test', 'https://app.example.com')->getAlertUnsubscribePage('token-1')],
            ['admin-api GET /api/v1/app/profile/photo', 'GET', [], fn (CustdClient $c) => $c->appProfile('app-token')->readPhoto()],
            ['admin-api PUT /api/v1/app/profile/photo', 'PUT', [], fn (CustdClient $c) => $c->appProfile('app-token')->uploadPhoto(new AppProfilePhoto(AppProfilePhoto::PNG, $png))],
            ['admin-api POST /api/v1/app/profile/photo', 'POST', [], fn (CustdClient $c) => $c->appProfile('app-token')->initializePhoto(new AppProfilePhoto(AppProfilePhoto::PNG, $png))],
            ['admin-api GET /api/v1/shared-site-reports/{token}', 'GET', ['token' => 'token-1'], fn (CustdClient $c) => $c->publicReads()->sharedSiteReport('token-1')],
            ['admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute', 'POST', ['requestUuid' => self::A], fn (CustdClient $c) => $c->adminOffboarding()->execute(self::A)],
            ['admin-api GET /api/v1/admin/usage', 'GET', [], fn (CustdClient $c) => $c->adminSystemUsage()->list(companySlug: 'acme')],
            ['admin-api GET /api/v1/admin/usage/export', 'GET', [], fn (CustdClient $c) => $c->adminSystemUsage()->export(companySlug: 'acme')],
            ['ingest-api GET /api/v1/monitoring/alerts', 'GET', [], fn (CustdClient $c) => $c->ingestOperations()->monitoringAlerts()],
            ['analytics-api POST /api/v1/reporting/draft-preview', 'POST', [], fn (CustdClient $c) => $c->reporting()->previewDraft(new RP\ReportingPackPreviewRequest($pack, 'acme', new RP\QueryHint('t', ['m'])))],
            ['ingest-api POST /api/v1/collect/events', 'POST', [], fn (CustdClient $c) => $c->collectEvent(self::event(), 'site_pk_test', 'https://example.com')],
            ['ingest-api POST /api/v1/collect/events/batch', 'POST', [], fn (CustdClient $c) => $c->collectEvents([self::event()], 'site_pk_test', 'https://example.com')],
            ['admin-api GET /api/v1/public-status-pages/{key}', 'GET', ['key' => 'page-key'], fn (CustdClient $c) => $c->publicReads()->statusPage('page-key')],
            ['admin-api POST /api/v1/public-status-pages/{key}/subscribe', 'POST', ['key' => 'page-key'], fn (CustdClient $c) => $c->publicReads()->subscribeToStatusPage('page-key', 'owner@example.com')],
            ['admin-api POST /api/v1/public-status-pages/{key}/confirm-subscription', 'POST', ['key' => 'page-key'], fn (CustdClient $c) => $c->publicReads()->confirmStatusPageSubscription('page-key', 'token-1')],
            ['admin-api POST /api/v1/public-status-pages/{key}/unsubscribe', 'POST', ['key' => 'page-key'], fn (CustdClient $c) => $c->publicReads()->unsubscribeFromStatusPage('page-key', 'token-1')],
            ['admin-api POST /api/v1/site-heartbeat-reports/{companySlug}/{monitorUuid}', 'POST', ['companySlug' => 'acme', 'monitorUuid' => self::A], fn (CustdClient $c) => $c->publicReads()->submitSiteHeartbeat('/api/v1/site-heartbeat-reports/acme/'.self::A, self::DIGEST, new SD\SiteHeartbeatReport('2026-01-01T00:00:00Z', SD\SiteHeartbeatOutcome::SUCCEEDED))],
            ['admin-api POST /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}', 'POST', ['companySlug' => 'acme', 'monitorUuid' => self::A], fn (CustdClient $c) => $c->publicReads()->submitPrivateUptime('/api/v1/site-private-uptime-reports/acme/'.self::A, self::DIGEST, new SD\PrivateUptimeReport(self::B, '2026-01-01T00:00:00Z', 12, 200))],
            ['admin-api GET /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}', 'GET', ['companySlug' => 'acme', 'monitorUuid' => self::A], fn (CustdClient $c) => $c->publicReads()->getPrivateUptimeWork('/api/v1/site-private-uptime-reports/acme/'.self::A, self::DIGEST)],
            ['admin-api POST /api/v1/site-ai-owner/redeem', 'POST', [], fn (CustdClient $c) => $c->publicReads()->redeemSiteAIOwnerHandoff(new SD\SiteAIOwnerHandoff('code-1', self::BASE_URL.'/api/v1/site-ai-owner/redeem'), 'https://hub.example.com')],
            ['admin-api GET /api/v1/site-ai-owner/settings', 'GET', [], fn (CustdClient $c) => $c->publicReads()->resumeSiteAIOwnerSession(self::BASE_URL, 'handle-1')->getSettings()],
            ['admin-api PUT /api/v1/site-ai-owner/settings', 'PUT', [], fn (CustdClient $c) => $c->publicReads()->resumeSiteAIOwnerSession(self::BASE_URL, 'handle-1', 'binding-1')->setSettings(new SD\SiteAISettingsRequest(SD\SiteAIMode::OFF, 0))],
            ['admin-api PUT /api/v1/site-ai-owner/consent', 'PUT', [], fn (CustdClient $c) => $c->publicReads()->resumeSiteAIOwnerSession(self::BASE_URL, 'handle-1', 'binding-1')->setConsent(SD\SiteAIConsentRequest::revoke())],
        ];
    }

    /** @return array<string, mixed> */
    private static function event(): array
    {
        return [
            'eventUuid' => self::A,
            'eventTypeSlug' => 'page-view',
            'schemaVersion' => '1.0.0',
            'timestamp' => '2026-01-24T00:00:00Z',
            'sessionId' => 'sess-1',
            'anonymousId' => 'anon-1',
            'companySlug' => 'acme',
            'context' => ['device' => ['type' => 'desktop']],
            'payload' => ['page' => '/'],
        ];
    }
}
