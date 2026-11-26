<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** BrandLogo is the stored realm logo's metadata; the image itself is served by the realm. */
final readonly class BrandLogo
{
    public function __construct(
        public string $contentType,
        public string $updatedAt,
        public int $byteSize,
        public int $width,
        public int $height,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'brand logo');

        return new self(
            Fields::string($object, 'contentType'),
            Fields::string($object, 'updatedAt'),
            Fields::integer($object, 'byteSize'),
            Fields::integer($object, 'width'),
            Fields::integer($object, 'height'),
        );
    }
}
