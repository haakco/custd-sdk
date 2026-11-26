<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAIProduct names the values of SiteAIAnswerSample.product, SiteAIUsageRow.samplingProduct.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAIProduct
{
    public const HOSTING = 'hosting';
    public const CUSTD = 'custd';
    public const CB = 'cb';
    public const AWTHY = 'awthy';
}
