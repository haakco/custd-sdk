"""Site Insights next actions: one domain's status and its most important actions, and the tenant's
portfolio of domains, worst first.

Custd ranks the actions once, in a fixed order that never depends on AI, so every product shows the
same first action. A site-bound credential reads only its own Site; a ``site_insights.read``
credential (scope template ``site-insights-read``) reads these two calls for every Site and nothing
else. Kinds, places and statuses are open sets: compare with the constants and show an unknown kind
by its ``title`` and ``why``.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# A next-actions read returns at most this many actions.
SITE_NEXT_ACTIONS_MAX = 3

# The kinds of SiteNextAction, in the order Custd ranks them.
SITE_NEXT_ACTION_VERIFY = "verify"
SITE_NEXT_ACTION_OUTAGE = "outage"
SITE_NEXT_ACTION_CERTIFICATE = "certificate"
SITE_NEXT_ACTION_RECONNECT_SEARCH = "reconnect-search"
SITE_NEXT_ACTION_FINDING = "finding"
SITE_NEXT_ACTION_FIRST_AUDIT_PENDING = "first-audit-pending"
SITE_NEXT_ACTION_CONNECT_SEARCH = "connect-search"

# Where an action is done.
SITE_NEXT_ACTION_PLACE_OWNERSHIP = "ownership"
SITE_NEXT_ACTION_PLACE_UPTIME = "uptime"
SITE_NEXT_ACTION_PLACE_SEARCH_SETTINGS = "search-settings"
SITE_NEXT_ACTION_PLACE_AUDIT = "audit"
SITE_NEXT_ACTION_PLACE_FINDING = "finding"
SITE_NEXT_ACTION_PLACE_PAGE = "page"

# What Custd cannot check yet.
SITE_NOT_CHECKED_UPTIME = "uptime"
SITE_NOT_CHECKED_AUDIT = "audit"
SITE_NOT_CHECKED_SEARCH = "search"

# The producer provisioning template of the tenant-wide, read-only next-actions credential.
SCOPE_TEMPLATE_SITE_INSIGHTS_READ = "site-insights-read"


class SiteNextActionTarget(TypedDict):
    """Where an action is done; a finding action carries its first finding and page."""

    place: str
    findingUuid: NotRequired[str]
    pageUrl: NotRequired[str]


class SiteNextAction(TypedDict):
    """One thing to do. ``affectedCount`` is 0 for an action about the whole site; ``rule`` is set for
    a finding; ``recheckable`` means Check again can confirm the fix at once."""

    kind: str
    title: str
    why: str
    severity: str
    affectedCount: int
    target: SiteNextActionTarget
    recheckable: bool
    rule: NotRequired[str]


class SiteNextActions(TypedDict):
    """A domain's status, one plain headline, what is not checked yet and its most important actions.

    ``actionCount`` counts every action; at most SITE_NEXT_ACTIONS_MAX are in ``actions``.
    """

    domainUuid: str
    host: str
    status: str
    headline: str
    notChecked: list[str]
    actionCount: int
    actions: list[SiteNextAction]
    checkedAt: NotRequired[str]


class SiteFindingCounts(TypedDict):
    high: int
    medium: int
    low: int
    info: int


class SitePortfolioDomain(TypedDict):
    """One domain's status and first action, and its open findings; ``firstAction`` is absent when
    there is nothing to do."""

    domainUuid: str
    siteUuid: str
    host: str
    status: str
    headline: str
    actionCount: int
    openFindings: SiteFindingCounts
    checkedAt: NotRequired[str]
    firstAction: NotRequired[SiteNextAction]


class SitePortfolioSummary(TypedDict):
    """Every domain the caller may see, worst first."""

    domains: list[SitePortfolioDomain]
