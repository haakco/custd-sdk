<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Measurement\MeasurementObservationBulkRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationBulkResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationCSVImportRequest;
use HaakCo\Custd\Admin\Measurement\ProjectCompleteRequest;
use HaakCo\Custd\Admin\Measurement\ProjectEstimate;
use HaakCo\Custd\Admin\Measurement\ProjectEstimateCreateRequest;
use HaakCo\Custd\Admin\Measurement\ProjectRunCreateRequest;
use HaakCo\Custd\Admin\Uncertainty\CopyModelRequest;
use HaakCo\Custd\Admin\Uncertainty\RunDetail;
use HaakCo\Custd\Admin\Uncertainty\RunRequest;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastRunRequest;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastRunResponse;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastStoryResponse;

/**
 * AppItemsClient is a hosted application's data access to its items. It creates an item with the
 * app's public Site key, then reads and changes it with the item's owner link, or only reads it
 * with its share link. A call names its item by the link token, or by {@see AppItemRef} for an item
 * the signed-in user owns, reached with their access token and no link.
 *
 * A link token travels only in the Authorization header, the Site key in X-Custd-Site-Key, the app
 * origin in Origin and the signed-in user's token in X-Custd-User-Token. The server checks the key
 * against the app's allowed origins, so the origin must be one of them. The client never sends an
 * operator credential.
 */
final class AppItemsClient
{
    public const SITE_KEY_HEADER = 'X-Custd-Site-Key';
    public const USER_TOKEN_HEADER = 'X-Custd-User-Token';

    private readonly AppHttp $http;

    /** @var (callable():(string|null))|null */
    private $userToken;

    /**
     * @param string $siteKey The app's public Site key (site_pk_...), as its discovery document names it.
     * @param string $origin One of the app's allowed origins, such as https://shop.example.com.
     * @param (callable():(string|null))|null $userToken The signed-in user's current access token, or null when signed out.
     */
    public function __construct(
        string $apiBaseUrl,
        private readonly string $siteKey,
        private readonly string $origin,
        ?callable $transport = null,
        ?callable $userToken = null,
    ) {
        $this->http = new AppHttp($apiBaseUrl, $transport);
        $this->userToken = $userToken;
    }

    /** The confirmation page an alert email's unsubscribe link opens, as HTML. It changes nothing. */
    public function getAlertUnsubscribePage(string $token): string
    {
        return $this->http->send('GET', '/api/v1/app/item/alerts/unsubscribe', ['token' => $token], null, '', ['Origin' => $this->origin]) ?? '';
    }

    /**
     * Create an item and its owner and share links.
     */
    public function createItem(AppItemCreateRequest $request): AppItemCreated
    {
        return AppItemCreated::fromPayload($this->object('POST', '/api/v1/app/items', [], $request->serialise(), null, true));
    }

    /**
     * List the signed-in person's items.
     */
    public function listMyItems(): AppItemList
    {
        return AppItemList::fromPayload($this->object('GET', '/api/v1/app/items', [], null, null, true));
    }

    /**
     * Claim an unowned item with its owner link.
     */
    public function claim(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/claim', [], null, $access, true));
    }

    /**
     * Read the item a link opens.
     */
    public function readItem(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('GET', '/api/v1/app/item', [], null, $access, true));
    }

    /**
     * Read the overall completion forecast for a plan.
     */
    public function planForecast(string|AppItemRef $access): AppPlanForecast
    {
        return AppPlanForecast::fromPayload($this->object('GET', '/api/v1/app/item/plan/forecast', [], null, $access, true));
    }

    /**
     * Replace a plan's parts and dependencies at an expected revision.
     */
    public function updatePlan(string|AppItemRef $access, AppPlanUpdate $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('PATCH', '/api/v1/app/item/plan', [], $request->serialise(), $access, true));
    }

    /**
     * Change an item's idle window and project settings.
     */
    public function updateSettings(string|AppItemRef $access, AppItemSettingsRequest $request = new AppItemSettingsRequest()): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('PATCH', '/api/v1/app/item', [], $request->serialise(), $access, true));
    }

    /**
     * Add measurements, one or in bulk.
     */
    public function addMeasurements(string|AppItemRef $access, MeasurementObservationBulkRequest $request): MeasurementObservationBulkResponse
    {
        return MeasurementObservationBulkResponse::fromPayload($this->object('POST', '/api/v1/app/item/measurements', [], $request->serialise(), $access, true));
    }

    /**
     * Add measurements from CSV.
     */
    public function importMeasurementsCsv(string|AppItemRef $access, MeasurementObservationCSVImportRequest $request): MeasurementObservationBulkResponse
    {
        return MeasurementObservationBulkResponse::fromPayload($this->object('POST', '/api/v1/app/item/measurements/csv', [], $request->serialise(), $access, true));
    }

    /**
     * Page through measurement runs.
     */
    public function listRuns(string|AppItemRef $access, ?string $after = null, ?int $limit = null): AppItemRunPage
    {
        return AppItemRunPage::fromPayload($this->object('GET', '/api/v1/app/item/runs', ['after' => $after, 'limit' => $limit], null, $access, true));
    }

    /**
     * Start a new measurement run.
     */
    public function startRun(string|AppItemRef $access, ProjectRunCreateRequest $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/runs', [], $request->serialise(), $access, true));
    }

    /**
     * Page through a run's measurements in observed time order.
     */
    public function listMeasurements(string|AppItemRef $access, ?string $after = null, ?int $limit = null, ?string $run = null): AppItemMeasurementPage
    {
        return AppItemMeasurementPage::fromPayload($this->object('GET', '/api/v1/app/item/measurements', ['after' => $after, 'limit' => $limit, 'run' => $run], null, $access, true));
    }

    /**
     * Record a dated low/high delivery estimate.
     */
    public function createEstimate(string|AppItemRef $access, ProjectEstimateCreateRequest $request): ProjectEstimate
    {
        return ProjectEstimate::fromPayload($this->object('POST', '/api/v1/app/item/estimates', [], $request->serialise(), $access, true));
    }

    /**
     * Complete a project on its actual date.
     */
    public function complete(string|AppItemRef $access, ProjectCompleteRequest $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/complete', [], $request->serialise(), $access, true));
    }

    /**
     * Cancel a project.
     */
    public function cancel(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/cancel', [], null, $access, true));
    }

    /**
     * Reopen a counter whose target was met.
     */
    public function reopen(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/reopen', [], null, $access, true));
    }

    /**
     * Add the item a pasted link opens to a collection.
     */
    public function addEntry(string|AppItemRef $access, AppLinkCollectionEntryAddRequest $request): AppLinkCollectionEntry
    {
        return AppLinkCollectionEntry::fromPayload($this->object('POST', '/api/v1/app/item/entries', [], $request->serialise(), $access, true));
    }

    /**
     * Remove an entry from a collection.
     */
    public function removeEntry(string|AppItemRef $access, string $entryUuid): void
    {
        $this->none('DELETE', '/api/v1/app/item/entries/' . rawurlencode($entryUuid), [], null, $access, true);
    }

    /**
     * Revoke one of the item's links.
     */
    public function revokeLink(string|AppItemRef $access, string $linkUuid): void
    {
        $this->none('DELETE', '/api/v1/app/item/links/' . rawurlencode($linkUuid), [], null, $access, true);
    }

    /**
     * Give a link a new token.
     */
    public function rotateLink(string|AppItemRef $access, string $linkUuid): AppItemLinkRotated
    {
        return AppItemLinkRotated::fromPayload($this->object('POST', '/api/v1/app/item/links/' . rawurlencode($linkUuid) . '/rotate', [], null, $access, true));
    }

    /**
     * Run the item's forecast.
     */
    public function runForecast(string|AppItemRef $access, MeasurementForecastRunRequest $request = new MeasurementForecastRunRequest()): MeasurementForecastRunResponse
    {
        return MeasurementForecastRunResponse::fromPayload($this->object('POST', '/api/v1/app/forecast/runs', [], $request->serialise(), $access, true));
    }

    /**
     * Read the item's latest forecast.
     */
    public function latestForecast(string|AppItemRef $access): MeasurementForecastRunResponse
    {
        return MeasurementForecastRunResponse::fromPayload($this->object('GET', '/api/v1/app/forecast/latest', [], null, $access, true));
    }

    /**
     * Read one forecast run of the item.
     */
    public function forecastRun(string|AppItemRef $access, string $runUuid): MeasurementForecastRunResponse
    {
        return MeasurementForecastRunResponse::fromPayload($this->object('GET', '/api/v1/app/forecast/runs/' . rawurlencode($runUuid), [], null, $access, true));
    }

    /**
     * Read the item's measurements and forecast story.
     */
    public function forecastStory(string|AppItemRef $access): MeasurementForecastStoryResponse
    {
        return MeasurementForecastStoryResponse::fromPayload($this->object('GET', '/api/v1/app/forecast/story', [], null, $access, true));
    }

    /**
     * Save a new version of a model's quantities.
     */
    public function addModelVersion(string|AppItemRef $access, AppModelVersionRequest $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/model/versions', [], $request->serialise(), $access, true));
    }

    /**
     * Copy a model version into a new item with its own links.
     */
    public function copyModel(string|AppItemRef $access, CopyModelRequest $request = new CopyModelRequest()): AppItemCreated
    {
        return AppItemCreated::fromPayload($this->object('POST', '/api/v1/app/item/model/copy', [], $request->serialise(), $access, true));
    }

    /**
     * Run the item's uncertainty model.
     */
    public function runModel(string|AppItemRef $access, RunRequest $request): RunDetail
    {
        return RunDetail::fromPayload($this->object('POST', '/api/v1/app/models/runs', [], $request->serialise(), $access, true));
    }

    /**
     * Calculate the item's uncertainty model with input overrides, without storing a run.
     */
    public function calculateModel(string|AppItemRef $access, CalculateRequest $request): CalculateResult
    {
        return CalculateResult::fromPayload($this->object('POST', '/api/v1/app/models/calculate', [], $request->serialise(), $access, true));
    }

    /**
     * Read the latest run of the item's uncertainty model.
     */
    public function latestModelRun(string|AppItemRef $access): RunDetail
    {
        return RunDetail::fromPayload($this->object('GET', '/api/v1/app/models/latest', [], null, $access, true));
    }

    /**
     * Read the item's alert rules, webhooks and your email subscription.
     */
    public function alertSettings(string|AppItemRef $access): AppItemAlertSettings
    {
        return AppItemAlertSettings::fromPayload($this->object('GET', '/api/v1/app/item/alerts', [], null, $access, true));
    }

    /**
     * Read the newest alert deliveries and their outcome.
     */
    public function alertDeliveries(string|AppItemRef $access): AppItemAlertDeliveryList
    {
        return AppItemAlertDeliveryList::fromPayload($this->object('GET', '/api/v1/app/item/alerts/deliveries', [], null, $access, true));
    }

    /**
     * Add an alert rule.
     */
    public function addAlertRule(string|AppItemRef $access, AppItemAlertRuleCreateRequest $request): AppItemAlertRule
    {
        return AppItemAlertRule::fromPayload($this->object('POST', '/api/v1/app/item/alerts/rules', [], $request->serialise(), $access, true));
    }

    /**
     * Remove an alert rule.
     */
    public function removeAlertRule(string|AppItemRef $access, string $ruleUuid): void
    {
        $this->none('DELETE', '/api/v1/app/item/alerts/rules/' . rawurlencode($ruleUuid), [], null, $access, true);
    }

    /**
     * Register a signed webhook; its secret is shown once.
     */
    public function addAlertWebhook(string|AppItemRef $access, AppItemAlertWebhookCreateRequest $request): AppItemAlertWebhookCreated
    {
        return AppItemAlertWebhookCreated::fromPayload($this->object('POST', '/api/v1/app/item/alerts/webhooks', [], $request->serialise(), $access, true));
    }

    /**
     * Post the item's alerts to a Slack incoming webhook; remove it like a webhook.
     */
    public function addAlertSlack(string|AppItemRef $access, AppItemAlertSlackCreateRequest $request): AppItemAlertWebhook
    {
        return AppItemAlertWebhook::fromPayload($this->object('POST', '/api/v1/app/item/alerts/slack', [], $request->serialise(), $access, true));
    }

    /**
     * Remove a webhook or Slack destination.
     */
    public function removeAlertWebhook(string|AppItemRef $access, string $webhookUuid): void
    {
        $this->none('DELETE', '/api/v1/app/item/alerts/webhooks/' . rawurlencode($webhookUuid), [], null, $access, true);
    }

    /**
     * Get the item's alerts by email (signed in).
     */
    public function subscribeAlertEmail(string|AppItemRef $access): AppItemAlertSubscription
    {
        return AppItemAlertSubscription::fromPayload($this->object('PUT', '/api/v1/app/item/alerts/subscription', [], null, $access, true));
    }

    /**
     * Stop your alert emails for the item (signed in).
     */
    public function unsubscribeAlertEmail(string|AppItemRef $access): void
    {
        $this->none('DELETE', '/api/v1/app/item/alerts/subscription', [], null, $access, true);
    }

    /**
     * Stop the email subscription an unsubscribe token names.
     */
    public function unsubscribeAlertEmailByToken(AppAlertUnsubscribeRequest $request): void
    {
        $this->none('POST', '/api/v1/app/item/alerts/unsubscribe', [], $request->serialise(), null, false);
    }

    /**
     * Save owner-only meeting minutes and linked actions.
     */
    public function updateMeetingMinutes(string|AppItemRef $access, AppMeetingMinutesUpdate $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('PATCH', '/api/v1/app/item/meeting/minutes', [], $request->serialise(), $access, true));
    }

    /**
     * Start a meeting: its first block goes on.
     */
    public function startMeeting(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/meeting/start', [], null, $access, true));
    }

    /**
     * Finish the named current block and start the next.
     */
    public function advanceMeeting(string|AppItemRef $access, AppMeetingAdvanceRequest $request): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/meeting/advance', [], $request->serialise(), $access, true));
    }

    /**
     * End a meeting now.
     */
    public function endMeeting(string|AppItemRef $access): AppItemRead
    {
        return AppItemRead::fromPayload($this->object('POST', '/api/v1/app/item/meeting/end', [], null, $access, true));
    }

    /**
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|null $body
     */
    private function object(string $method, string $path, array $query, ?array $body, string|AppItemRef|null $access, bool $signedIn): \stdClass
    {
        [$bearer, $query, $headers] = $this->credential($query, $access, $signedIn);

        return $this->http->object($method, $path, $query, $body, $bearer, $headers);
    }

    /**
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @param array<string, mixed>|null $body
     */
    private function none(string $method, string $path, array $query, ?array $body, string|AppItemRef|null $access, bool $signedIn): void
    {
        [$bearer, $query, $headers] = $this->credential($query, $access, $signedIn);
        $this->http->send($method, $path, $query, $body, $bearer, $headers);
    }

    /**
     * credential turns how a call reaches its item into the request's bearer, query and headers. A
     * public route (the unsubscribe confirmation) carries only the Site key.
     *
     * @param array<string, string|int|float|bool|list<string>|null> $query
     * @return array{string, array<string, string|int|float|bool|list<string>|null>, array<string, string>}
     */
    private function credential(array $query, string|AppItemRef|null $access, bool $signedIn): array
    {
        $headers = [self::SITE_KEY_HEADER => $this->siteKey, 'Origin' => $this->origin];
        $bearer = '';
        if ($access instanceof AppItemRef) {
            $query = ['item' => $access->itemUuid] + $query;
        } elseif ($access !== null) {
            $bearer = $access;
        }
        if ($signedIn) {
            $token = $this->userToken === null ? null : ($this->userToken)();
            if (is_string($token) && trim($token) !== '') {
                $headers[self::USER_TOKEN_HEADER] = trim($token);
            }
        }

        return [$bearer, $query, $headers];
    }
}
