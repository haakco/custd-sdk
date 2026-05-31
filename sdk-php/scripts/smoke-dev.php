<?php

declare(strict_types=1);

use HaakCo\Custd\CustdClient;

require __DIR__ . "/../vendor/autoload.php";

$baseUrl = getenv("CUSTD_DEV_BASE_URL") ?: "http://localhost:8087";

$token = trim((string) shell_exec("bash ../../scripts/dev-hydra-token.sh"));
if ($token === "") {
    fwrite(STDERR, "failed to get hydra token\n");
    exit(1);
}

$uuid = function (): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20)
    );
};

$client = new CustdClient($baseUrl, $token);
$response = $client->ingestEvent([
    "eventUuid" => $uuid(),
    "eventTypeSlug" => "page-view",
    "schemaVersion" => "1.0.0",
    "timestamp" => gmdate(DATE_RFC3339),
    "sessionId" => $uuid(),
    "anonymousId" => $uuid(),
    "context" => [
        "page" => ["url" => "https://example.com"],
        "device" => ["type" => "desktop"],
    ],
    "payload" => ["source" => "sdk-php-smoke"],
]);

if ($response["status"] >= 400) {
    fwrite(STDERR, "custd sdk php smoke failed: {$response["status"]}\n");
    exit(1);
}

echo "custd sdk php smoke OK\n";
