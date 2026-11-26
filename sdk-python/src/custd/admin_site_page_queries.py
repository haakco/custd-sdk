"""Site Insights page search queries: the queries one page ranks for, the title options built from
them and the Site's pages that mention them, as link sources.

Every shape is the admin-api's own JSON. Closed string sets are Literal aliases; a value a newer
server adds still decodes, so keep a fallback.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict

if TYPE_CHECKING:
    from .admin_site_domains import SiteSearchProvider

SiteLinkPlacement = Literal["title", "heading"]
SitePageQueriesState = Literal["available", "not_connected", "not_imported", "no_queries"]
SiteTitleTemplate = Literal["general", "guide"]


# Whether a page's queries could be read: available, the domain has no Google connection, no
# import has finished yet, or the page ranked for no query in the window.
SITE_PAGE_QUERIES_AVAILABLE: SitePageQueriesState = "available"
SITE_PAGE_QUERIES_NOT_CONNECTED: SitePageQueriesState = "not_connected"
SITE_PAGE_QUERIES_NOT_IMPORTED: SitePageQueriesState = "not_imported"
SITE_PAGE_QUERIES_NO_QUERIES: SitePageQueriesState = "no_queries"

# The pattern a title option follows.
SITE_TITLE_TEMPLATE_GENERAL: SiteTitleTemplate = "general"
SITE_TITLE_TEMPLATE_GUIDE: SiteTitleTemplate = "guide"

# Where a link source mentions the query.
SITE_LINK_SOURCE_IN_TITLE: SiteLinkPlacement = "title"
SITE_LINK_SOURCE_IN_HEADING: SiteLinkPlacement = "heading"


class SitePageQuery(TypedDict):
    """One query the page ranks for; ``position`` is weighted by impressions."""

    query: str
    clicks: int
    impressions: int
    position: float
    inTitle: bool
    inDescription: bool
    inH1: bool


class SiteTitleOption(TypedDict):
    """A title built from a ranking query; options are ranked by the query's impressions."""

    title: str
    template: SiteTitleTemplate
    query: str
    impressions: int


class SiteLinkSource(TypedDict):
    """A page of the Site that mentions a ranking query, so it can link here with that text."""

    url: str
    title: str
    query: str
    where: SiteLinkPlacement


# "from" is a Python keyword, so the window uses the functional form.
_SitePageQueryWindow = TypedDict(
    "_SitePageQueryWindow", {"provider": "SiteSearchProvider", "from": str, "to": str, "importedAt": str}
)


class SitePageQueryWindow(_SitePageQueryWindow):
    """The imported days the queries cover; ``from`` and ``to`` are YYYY-MM-DD."""


class SitePageSearchQueries(TypedDict):
    """A page's ranking queries (at most ``maxQueries``), title options and link sources.

    ``window`` is absent until an import has finished.
    """

    domainUuid: str
    url: str
    state: SitePageQueriesState
    maxQueries: int
    queries: list[SitePageQuery]
    titleOptions: list[SiteTitleOption]
    linkSources: list[SiteLinkSource]
    window: NotRequired[SitePageQueryWindow]
