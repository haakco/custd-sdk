<?php

declare(strict_types=1);

return [
    "base_url" => env("CUSTD_BASE_URL", "https://custd.com"),
    "token" => env("CUSTD_TOKEN", ""),
    "oauth" => [
        "client_id" => env("CUSTD_CLIENT_ID", ""),
        "client_secret" => env("CUSTD_CLIENT_SECRET", ""),
        "token_url" => env("CUSTD_TOKEN_URL", ""),
        "audience" => env("CUSTD_AUDIENCE", "custd"),
        "scopes" => array_filter(explode(",", env("CUSTD_SCOPES", "events.write"))),
    ],
    "batch" => [
        "max_batch_size" => (int) env("CUSTD_BATCH_MAX_SIZE", 100),
    ],
    "queue" => [
        "enabled" => (bool) env("CUSTD_QUEUE_ENABLED", false),
        "max_size" => (int) env("CUSTD_QUEUE_MAX_SIZE", 1000),
        "store" => env("CUSTD_QUEUE_STORE", null),
        "path" => env("CUSTD_QUEUE_PATH", storage_path("framework/cache/custd-queue.json")),
    ],
    "job" => [
        "tries" => (int) env("CUSTD_JOB_TRIES", 3),
        "backoff" => (int) env("CUSTD_JOB_BACKOFF", 10),
    ],
];
