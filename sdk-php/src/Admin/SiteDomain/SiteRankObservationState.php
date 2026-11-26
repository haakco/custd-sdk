<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRankObservationState names the values of RankObservation.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteRankObservationState
{
    public const RANKING = 'ranking';
    public const NOT_RANKING = 'not_ranking';
    public const NO_DATA = 'no_data';
}
