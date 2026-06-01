<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Facades;

use Illuminate\Support\Facades\Facade;

final class Custd extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return "custd";
    }
}
