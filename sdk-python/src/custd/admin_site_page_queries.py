"""Site Insights page search queries: the queries one page ranks for, the title options built from
them and the Site's pages that mention them, as link sources.

Every shape is the admin-api's own JSON. The enum-like strings are open sets: compare them with
the constants below.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

# Whether a page's queries could be read: available, the domain has no Google connection, no
# import has finished yet, or the page ranked for no query in the window.
SITE_PAGE_QUERIES_AVAILABLE = "available"
SITE_PAGE_QUERIES_NOT_CONNECTED = "not_connected"
SITE_PAGE_QUERIES_NOT_IMPORTED = "not_imported"
SITE_PAGE_QUERIES_NO_QUERIES = "no_queries"

# The pattern a title option follows.
SITE_TITLE_TEMPLATE_GENERAL = "general"
SITE_TITLE_TEMPLATE_GUIDE = "guide"

# Where a link source mentions the query.
SITE_LINK_SOURCE_IN_TITLE = "title"
SITE_LINK_SOURCE_IN_HEADING = "heading"


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
    template: str
    query: str
    impressions: int


class SiteLinkSource(TypedDict):
    """A page of the Site that mentions a ranking query, so it can link here with that text."""

    url: str
    title: str
    query: str
    where: str


# "from" is a Python keyword, so the window uses the functional form.
_SitePageQueryWindow = TypedDict(
    "_SitePageQueryWindow", {"provider": str, "from": str, "to": str, "importedAt": str}
)


class SitePageQueryWindow(_SitePageQueryWindow):
    """The imported days the queries cover; ``from`` and ``to`` are YYYY-MM-DD."""


class SitePageSearchQueries(TypedDict):
    """A page's ranking queries (at most ``maxQueries``), title options and link sources.

    ``window`` is absent until an import has finished.
    """

    domainUuid: str
    url: str
    state: str
    maxQueries: int
    queries: list[SitePageQuery]
    titleOptions: list[SiteTitleOption]
    linkSources: list[SiteLinkSource]
    window: NotRequired[SitePageQueryWindow]
