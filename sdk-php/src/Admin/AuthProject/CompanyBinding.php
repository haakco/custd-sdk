<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * CompanyBinding is the result of binding an explicitly unbound project to the
 * authenticated human owner's company.
 *
 * It carries the persisted company identity the consumer stores. Binding is a
 * one-way human-owner decision: Custd refuses a machine credential, refuses a
 * foreign rebind, and treats a repeat for the same company as safe.
 */
final readonly class CompanyBinding
{
    public function __construct(
        public string $projectId = '',
        public string $companyUuid = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project company binding');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'companyUuid'),
        );
    }
}
