// The searches one page shows for (Search Console's page and query dimensions
// together), with title options and pages to link from built from them.
// SiteDomainAdminClient.getPageSearchQueries sends the read.

/** Why a page has ranking queries to show or not. */
export const SitePageQueriesState = {
  Available: "available",
  NotConnected: "not_connected",
  NotImported: "not_imported",
  NoQueries: "no_queries",
} as const;

export type SitePageQueriesState = (typeof SitePageQueriesState)[keyof typeof SitePageQueriesState];

/** The shape a suggested title takes. */
export const SiteTitleTemplate = {
  General: "general",
  Guide: "guide",
} as const;

export type SiteTitleTemplate = (typeof SiteTitleTemplate)[keyof typeof SiteTitleTemplate];

/** Where a page to link from mentions the query; newer values may appear. */
export const SitePageLinkSourceWhere = {
  Title: "title",
  Heading: "heading",
} as const;

/** One query the page shows for, and whether the page's title, description or h1 contains it. */
export type SitePageQuery = {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
  inTitle: boolean;
  inDescription: boolean;
  inH1: boolean;
};

export type SiteTitleOption = {
  title: string;
  /** A SiteTitleTemplate value. */
  template: SiteTitleTemplate;
  query: string;
  impressions: number;
};

/** A page on the site that mentions the query and could link to this one. */
export type SitePageLinkSource = {
  url: string;
  title: string;
  query: string;
  /** A SitePageLinkSourceWhere value. */
  where: string;
};

/** The imported window the queries cover; from and to are YYYY-MM-DD. */
export type SitePageQueryWindow = {
  provider: "google" | "bing";
  from: string;
  to: string;
  importedAt: string;
};

export type SitePageSearchQueries = {
  domainUuid: string;
  url: string;
  /** A SitePageQueriesState value. */
  state: SitePageQueriesState;
  /** Absent until a search import has covered the page. */
  window?: SitePageQueryWindow;
  maxQueries: number;
  queries: SitePageQuery[];
  titleOptions: SiteTitleOption[];
  linkSources: SitePageLinkSource[];
};
