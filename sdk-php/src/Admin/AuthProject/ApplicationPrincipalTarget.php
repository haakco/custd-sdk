<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

final readonly class ApplicationPrincipalTarget
{
    public function __construct(
        public string $projectId,
        public string $environmentId,
        public string $directoryId,
        public string $providerSubject,
    ) {
    }
}
