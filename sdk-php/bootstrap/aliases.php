<?php

declare(strict_types=1);

/**
 * Backward-compatible class aliases for the pre-v1.2.1 `Authy` names.
 *
 * v1.2.1 renamed `HaakCo\Custd\Authy\*` to `HaakCo\Custd\Awthy\*`. To keep that
 * rename from being a breaking change, the old names are aliased to the new
 * classes. Registration is lazy — the alias is only created when the legacy
 * name is referenced — so consumers that never used the old names pay nothing.
 *
 * Deprecated. Remove in the next major release once downstreams have migrated.
 */

spl_autoload_register(static function (string $class): void {
    /** @var array<string, class-string> $legacyAliases */
    static $legacyAliases = [
        "HaakCo\\Custd\\Authy\\AuthyAuditEvent" => \HaakCo\Custd\Awthy\AwthyAuditEvent::class,
        "HaakCo\\Custd\\Authy\\AuthyAuditRedactionRequest" => \HaakCo\Custd\Awthy\AwthyAuditRedactionRequest::class,
    ];

    if (isset($legacyAliases[$class])) {
        class_alias($legacyAliases[$class], $class);
    }
});
