<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AssetHierarchy declares the asset nodes and edges of one tenant. */
final readonly class AssetHierarchy
{
    /**
     * @param list<AssetNode> $nodes
     * @param list<AssetHierarchyEdge>|null $edges
     */
    public function __construct(
        public int $version,
        public string $tenantKey,
        public array $nodes,
        public ?int $maxDepth = null,
        public ?array $edges = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $edges = Fields::optionalObjects($payload, 'edges');

        return new self(
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'tenantKey'),
            array_map(static fn (\stdClass $item): AssetNode => AssetNode::fromPayload($item), Fields::objects($payload, 'nodes')),
            Fields::optionalInteger($payload, 'maxDepth'),
            $edges === null ? null : array_map(static fn (\stdClass $item): AssetHierarchyEdge => AssetHierarchyEdge::fromPayload($item), $edges),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'version' => $this->version,
            'tenantKey' => $this->tenantKey,
            'nodes' => array_map(static fn (AssetNode $item): array => $item->serialise(), $this->nodes),
        ];
        if ($this->maxDepth !== null) {
            $payload['maxDepth'] = $this->maxDepth;
        }
        if ($this->edges !== null) {
            $payload['edges'] = array_map(static fn (AssetHierarchyEdge $item): array => $item->serialise(), $this->edges);
        }

        return $payload;
    }
}
