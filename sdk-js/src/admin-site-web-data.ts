// Public web data about a Site and its competitors: the domains Custd
// inventories, their pages, topic interest, the content gap, and the Site's
// keyword lists with their search clusters. SiteDomainAdminClient sends them.
// A site-bound credential may omit siteUuid for its own Site.

/** A 404 on deleteKeywordList or getKeywordClusters: the Site has no list of that name. */
export const SITE_KEYWORD_LIST_NOT_FOUND_CODE = "site_keyword_list_not_found";
/** A 409 on saveKeywordList: the Site keeps the most lists; delete one first. */
export const SITE_KEYWORD_LIST_LIMIT_CODE = "site_keyword_list_limit";

/** Whether an inventoried domain is the Site's own or a named competitor; newer values may appear. */
export const SiteWebDomainRole = {
  Own: "own",
  Competitor: "competitor",
} as const;

/** Where a page was found; newer sources may appear. */
export const SiteWebPageSource = {
  Sitemap: "sitemap",
  Wayback: "wayback",
} as const;

/** The state of one inventory source for a domain; newer values may appear. */
export const SiteWebInventoryStatus = {
  Pending: "pending",
  Done: "done",
  Partial: "partial",
  Unavailable: "unavailable",
  Failed: "failed",
} as const;

/** A domain's band in the Tranco top-sites list; newer values may appear. */
export const SiteTrancoBand = {
  Top1K: "top-1k",
  Top10K: "top-10k",
  Top100K: "top-100k",
  Top1M: "top-1m",
  Unranked: "unranked",
  Unknown: "unknown",
} as const;

/** Whether a term's Wikipedia article was found; newer values may appear. */
export const SiteTopicTrendStatus = {
  Pending: "pending",
  Found: "found",
  NoArticle: "no_article",
  Failed: "failed",
} as const;

/** Where a trend term came from: a brand name or the content-gap seed. */
export const SiteTopicTrendSource = {
  Brand: "brand",
  Seed: "seed",
} as const;

/** Whether the Site's own pages and queries could be read for a content gap. */
export const SiteContentGapCoverage = {
  Available: "available",
  Unavailable: "unavailable",
} as const;

/** One inventoried domain. trancoRank, trancoListDay and inventoryAt are absent until known. */
export type SiteWebDomain = {
  domain: string;
  /** A SiteWebDomainRole value. */
  role: string;
  /** A SiteTrancoBand value. */
  trancoBand: string;
  trancoRank?: number;
  trancoListDay?: string;
  /** A SiteWebInventoryStatus value. */
  sitemapStatus: string;
  /** A SiteWebInventoryStatus value. */
  waybackStatus: string;
  pageCount: number;
  lastFailure?: string;
  inventoryAt?: string;
  nextInventoryAt: string;
};

export type SiteWebDomains = {
  siteUuid: string;
  domains: SiteWebDomain[];
};

export type SiteWebPage = {
  url: string;
  /** SiteWebPageSource values. */
  sources: string[];
  firstSeen: string;
  lastSeen: string;
};

/** listWebPages' options; `after` is the previous page's `next`. */
export type SiteWebPagesQuery = {
  siteUuid?: string;
  after?: string;
  limit?: number;
};

/** One page of a domain's URLs; `next` is absent on the last page. */
export type SiteWebPages = {
  siteUuid: string;
  domain: string;
  pages: SiteWebPage[];
  next?: string;
};

export type SiteTopicTrendMonth = {
  /** YYYY-MM. */
  month: string;
  views: number;
};

/** One term's Wikipedia page views; checkedAt is absent until first checked. */
export type SiteTopicTrend = {
  term: string;
  /** A SiteTopicTrendSource value. */
  source: string;
  project: string;
  article: string;
  /** A SiteTopicTrendStatus value. */
  status: string;
  lastFailure?: string;
  checkedAt?: string;
  months: SiteTopicTrendMonth[];
};

export type SiteTopicTrends = {
  siteUuid: string;
  trends: SiteTopicTrend[];
};

export type SiteContentGapCompetitor = {
  domain: string;
  /** A SiteWebInventoryStatus value. */
  sitemapStatus: string;
  /** A SiteWebInventoryStatus value. */
  waybackStatus: string;
  pageCount: number;
};

export type SiteContentGapPage = SiteWebPage & {
  domain: string;
};

/** A topic competitors cover and the Site does not. */
export type SiteContentGapTopic = {
  topic: string;
  label: string;
  competitors: string[];
  pageCount: number;
  pages: SiteContentGapPage[];
};

/** partial is true while a competitor's inventory is incomplete. */
export type SiteContentGap = {
  siteUuid: string;
  seed?: string;
  /** A SiteContentGapCoverage value. */
  ownCoverage: string;
  ownPages: number;
  ownQueries: number;
  partial: boolean;
  competitors: SiteContentGapCompetitor[];
  topics: SiteContentGapTopic[];
};

export type SiteKeywordList = {
  name: string;
  seedTerm?: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type SiteKeywordLists = {
  siteUuid: string;
  lists: SiteKeywordList[];
};

/** Replaces the named list, or creates it. */
export type SiteKeywordListRequest = {
  name: string;
  seedTerm?: string;
  keywords: string[];
};

/** clicks, impressions and avgPosition are absent when no keyword in the cluster has search numbers. */
export type SiteKeywordCluster = {
  cluster: string;
  keywords: string[];
  keywordCount: number;
  measuredKeywords: number;
  clicks?: number;
  impressions?: number;
  avgPosition?: number;
};

export type SiteStrikingKeyword = {
  keyword: string;
  clicks: number;
  impressions: number;
  position: number;
};

export type SiteKeywordClusters = {
  siteUuid: string;
  name: string;
  metricsSource: string;
  metricsDays: number;
  totalKeywords: number;
  clusters: SiteKeywordCluster[];
  strikingDistance: SiteStrikingKeyword[];
};
