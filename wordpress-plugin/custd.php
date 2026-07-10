<?php

/**
 * Plugin Name: Custd
 * Description: Sends redacted WordPress product and activity events to Custd through the shared PHP SDK.
 * Version: 1.5.28
 * Author: HaakCo
 * License: MIT
 */

declare(strict_types=1);

use HaakCo\Custd\WordPress\Plugin;
use HaakCo\Custd\WordPress\Settings;

if (!defined("ABSPATH")) {
    exit;
}

$autoloadCandidates = [
    __DIR__ . "/vendor/autoload.php",
    dirname(__DIR__) . "/vendor/autoload.php",
];

foreach ($autoloadCandidates as $autoloadCandidate) {
    if (is_file($autoloadCandidate)) {
        require_once $autoloadCandidate;
        break;
    }
}

add_action("plugins_loaded", static function (): void {
    $options = get_option("custd_settings", []);
    if (!is_array($options)) {
        $options = [];
    }

    (new Plugin(Settings::fromWordPressOptions($options, $_ENV)))->register();
});
