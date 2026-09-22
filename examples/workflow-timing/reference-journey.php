#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Released-SDK reference journey for Custd external workflow timing.
 *
 * It consumes the published package, never a local checkout: the dependency is
 * `haakco/custd-sdk` from its GitHub repository, and `vendor/composer/installed.json`
 * records the released version the proof ran against.
 *
 *   CUSTD_BASE_URL=https://custd.example \
 *   CUSTD_TOKEN=<machine credential with measurement.prediction.read/admin> \
 *   CUSTD_COMPANY_SLUG=<tenant slug> \
 *   php reference-journey.php
 *
 * Exit status is 0 only when every proof passed.
 */

require __DIR__ . '/vendor/autoload.php';

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Examples\WorkflowTiming\HostingFixture;
use HaakCo\Custd\Examples\WorkflowTiming\Proofs;
use HaakCo\Custd\Examples\WorkflowTiming\ReferenceJourney;

$baseUrl = rtrim((string) getenv('CUSTD_BASE_URL'), '/');
$token = (string) getenv('CUSTD_TOKEN');
$companySlug = (string) getenv('CUSTD_COMPANY_SLUG');
$actorRef = (string) (getenv('CUSTD_ACTOR_REF') ?: 'hosting-reconciler');
$unavailableBaseUrl = (string) (getenv('CUSTD_UNAVAILABLE_BASE_URL') ?: 'http://127.0.0.1:1');

if ($baseUrl === '' || $token === '' || $companySlug === '') {
    fwrite(STDERR, "usage: CUSTD_BASE_URL=<url> CUSTD_TOKEN=<token> CUSTD_COMPANY_SLUG=<slug> php reference-journey.php\n");
    exit(2);
}

$proofs = new Proofs();
$proofs->note(sprintf('released package: %s', releasedVersion()));
$proofs->note(sprintf('tenant: %s  endpoint: %s  actor: %s', $companySlug, $baseUrl, $actorRef));

$journey = new ReferenceJourney(
    $proofs,
    HostingFixture::load(__DIR__ . '/hosting-reconcile.json'),
    (new CustdClient($baseUrl, $token))->adminWorkflowTimings(),
    $companySlug,
    $actorRef,
    $unavailableBaseUrl,
    $token,
    sys_get_temp_dir() . '/custd-workflow-timing-pending-' . bin2hex(random_bytes(4)) . '.json',
);

exit($journey->run());

/**
 * releasedVersion reads the version Composer actually installed, so the proof
 * states which release it exercised instead of assuming one.
 */
function releasedVersion(): string
{
    $installed = __DIR__ . '/vendor/composer/installed.json';
    if (!is_file($installed)) {
        return 'unknown (run composer install)';
    }
    $document = json_decode((string) file_get_contents($installed), true, flags: JSON_THROW_ON_ERROR);
    $packages = $document['packages'] ?? $document;
    foreach ($packages as $package) {
        if (($package['name'] ?? '') === 'haakco/custd-sdk') {
            return (string) $package['version'];
        }
    }

    return 'unknown';
}
