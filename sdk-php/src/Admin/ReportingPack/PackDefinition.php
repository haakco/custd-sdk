<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/**
 * PackDefinition is the canonical reporting-pack definition, mirroring
 * libs/go/reporting.Pack. Every contracted field is carried so a definition
 * round-trips losslessly through create/validate/preview/publish; unknown
 * extension fields are the only thing a decode may drop.
 */
final readonly class PackDefinition
{
    /**
     * @param list<string> $eventTypes
     * @param list<PackMetric> $metrics
     * @param list<PackDimension> $dimensions
     * @param list<PackTemplate> $templates
     * @param list<FlowRule>|null $flowRules
     * @param list<RollupRule>|null $rollupRules
     * @param list<PackDashboardDefinition>|null $dashboards
     * @param list<string>|null $exportFormats
     * @param list<RedactionRule>|null $redactionRules
     * @param list<TransitionRule>|null $transitionRules
     * @param list<ActivationRule>|null $activationRules
     * @param list<RetentionRule>|null $retentionRules
     * @param list<ActivityRule>|null $activityRules
     * @param list<SourceReconciliation>|null $reconciliations
     */
    public function __construct(
        public string $key,
        public string $displayName,
        public string $owner,
        public int $version,
        public bool $enabled,
        public array $eventTypes,
        public array $metrics,
        public array $dimensions,
        public array $templates,
        public TrustDiagnostics $trust,
        public ProofProfile $proof,
        public ?array $flowRules = null,
        public ?array $rollupRules = null,
        public ?array $dashboards = null,
        public ?array $exportFormats = null,
        public ?array $redactionRules = null,
        public ?IdentitySelectors $identity = null,
        public ?array $transitionRules = null,
        public ?array $activationRules = null,
        public ?array $retentionRules = null,
        public ?array $activityRules = null,
        public ?ObservationContract $observation = null,
        public ?array $reconciliations = null,
        public ?AssetHierarchy $assetHierarchy = null,
        public ?AccountingContract $accounting = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $map = static fn (?array $objects, callable $factory): ?array => $objects === null
            ? null
            : array_map($factory, $objects);
        $list = static fn (array $objects, callable $factory): array => array_map($factory, $objects);
        $optional = static function (string $key) use ($payload): ?\stdClass {
            return Fields::optionalObject($payload, $key);
        };

        $flowRules = Fields::optionalObjects($payload, 'flowRules');
        $rollupRules = Fields::optionalObjects($payload, 'rollupRules');
        $dashboards = Fields::optionalObjects($payload, 'dashboards');
        $redactionRules = Fields::optionalObjects($payload, 'redactionRules');
        $transitionRules = Fields::optionalObjects($payload, 'transitionRules');
        $activationRules = Fields::optionalObjects($payload, 'activationRules');
        $retentionRules = Fields::optionalObjects($payload, 'retentionRules');
        $activityRules = Fields::optionalObjects($payload, 'activityRules');
        $reconciliations = Fields::optionalObjects($payload, 'reconciliations');
        $identity = $optional('identity');
        $observation = $optional('observation');
        $assetHierarchy = $optional('assetHierarchy');
        $accounting = $optional('accounting');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'displayName'),
            Fields::string($payload, 'owner'),
            Fields::integer($payload, 'version'),
            Fields::boolean($payload, 'enabled'),
            Fields::strings($payload, 'eventTypes'),
            $list(Fields::objects($payload, 'metrics'), static fn (\stdClass $item): PackMetric => PackMetric::fromPayload($item)),
            $list(Fields::objects($payload, 'dimensions'), static fn (\stdClass $item): PackDimension => PackDimension::fromPayload($item)),
            $list(Fields::objects($payload, 'templates'), static fn (\stdClass $item): PackTemplate => PackTemplate::fromPayload($item)),
            TrustDiagnostics::fromPayload(Fields::object($payload, 'trust')),
            ProofProfile::fromPayload(Fields::object($payload, 'proof')),
            $map($flowRules, static fn (\stdClass $item): FlowRule => FlowRule::fromPayload($item)),
            $map($rollupRules, static fn (\stdClass $item): RollupRule => RollupRule::fromPayload($item)),
            $map($dashboards, static fn (\stdClass $item): PackDashboardDefinition => PackDashboardDefinition::fromPayload($item)),
            Fields::optionalStrings($payload, 'exportFormats'),
            $map($redactionRules, static fn (\stdClass $item): RedactionRule => RedactionRule::fromPayload($item)),
            $identity === null ? null : IdentitySelectors::fromPayload($identity),
            $map($transitionRules, static fn (\stdClass $item): TransitionRule => TransitionRule::fromPayload($item)),
            $map($activationRules, static fn (\stdClass $item): ActivationRule => ActivationRule::fromPayload($item)),
            $map($retentionRules, static fn (\stdClass $item): RetentionRule => RetentionRule::fromPayload($item)),
            $map($activityRules, static fn (\stdClass $item): ActivityRule => ActivityRule::fromPayload($item)),
            $observation === null ? null : ObservationContract::fromPayload($observation),
            $map($reconciliations, static fn (\stdClass $item): SourceReconciliation => SourceReconciliation::fromPayload($item)),
            $assetHierarchy === null ? null : AssetHierarchy::fromPayload($assetHierarchy),
            $accounting === null ? null : AccountingContract::fromPayload($accounting),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $serialise = static fn (array $items): array => array_map(static fn ($item): array => $item->serialise(), $items);
        $payload = [
            'key' => $this->key,
            'displayName' => $this->displayName,
            'owner' => $this->owner,
            'version' => $this->version,
            'enabled' => $this->enabled,
            'eventTypes' => $this->eventTypes,
            'metrics' => $serialise($this->metrics),
            'dimensions' => $serialise($this->dimensions),
            'templates' => $serialise($this->templates),
            'trust' => $this->trust->serialise(),
            'proof' => $this->proof->serialise(),
        ];
        foreach (['flowRules' => $this->flowRules, 'rollupRules' => $this->rollupRules, 'dashboards' => $this->dashboards, 'redactionRules' => $this->redactionRules, 'transitionRules' => $this->transitionRules, 'activationRules' => $this->activationRules, 'retentionRules' => $this->retentionRules, 'activityRules' => $this->activityRules, 'reconciliations' => $this->reconciliations] as $key => $items) {
            if ($items !== null) {
                $payload[$key] = $serialise($items);
            }
        }
        if ($this->exportFormats !== null) {
            $payload['exportFormats'] = $this->exportFormats;
        }
        if ($this->identity !== null) {
            $payload['identity'] = $this->identity->serialise();
        }
        if ($this->observation !== null) {
            $payload['observation'] = $this->observation->serialise();
        }
        if ($this->assetHierarchy !== null) {
            $payload['assetHierarchy'] = $this->assetHierarchy->serialise();
        }
        if ($this->accounting !== null) {
            $payload['accounting'] = $this->accounting->serialise();
        }

        return $payload;
    }
}
