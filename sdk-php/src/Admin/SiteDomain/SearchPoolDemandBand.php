<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SearchPoolDemandBand names the values of SearchPoolBand.demandBand, SearchPoolQuery.demandBand.
 * Pooled impressions over the window.
 * A value Custd adds later still decodes as a plain string.
 */
final class SearchPoolDemandBand
{
    public const BAND_100_999 = '100_999';
    public const BAND_1K_10K = '1k_10k';
    public const BAND_10K_100K = '10k_100k';
    public const BAND_100K_PLUS = '100k_plus';
}
