<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAccountEntryRequest binds a hosted settings ticket to a registered application origin. Take the
 * issuer and application origin from trusted deployment configuration.
 */
final readonly class AppAccountEntryRequest
{
    /**
     * @param string $returnPath The page on the application origin hosted settings links back to, such as
     *                           "/mine"; empty links to the application's home.
     */
    public function __construct(
        public string $issuer,
        public string $applicationOrigin,
        public string $returnPath = '',
    ) {
    }
}
