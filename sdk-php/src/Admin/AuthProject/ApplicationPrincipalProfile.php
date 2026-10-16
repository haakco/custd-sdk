<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationPrincipalProfile is one principal's profile. It carries only the
 * fields the policy marks visible and names required fields with no stored value
 * as `missingRequired` rather than inventing a default.
 */
final readonly class ApplicationPrincipalProfile
{
    /**
     * @param  list<ApplicationProfileField>  $fields
     * @param  list<string>  $missingRequired
     */
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public string $directoryId = '',
        public string $principalId = '',
        public array $fields = [],
        public array $missingRequired = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal profile');
        $fields = [];
        foreach (Fields::objects($object, 'fields') as $field) {
            $fields[] = ApplicationProfileField::fromPayload($field);
        }

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            $fields,
            Fields::optionalStrings($object, 'missingRequired') ?? [],
        );
    }
}
