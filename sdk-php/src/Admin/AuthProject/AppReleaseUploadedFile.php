<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseUploadedFile is the receipt for one stored release file. */
final readonly class AppReleaseUploadedFile
{
    public function __construct(public string $path, public int $size, public string $sha256)
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'app release file');

        return new self(Fields::string($object, 'path'), Fields::integer($object, 'size'), Fields::string($object, 'sha256'));
    }
}
