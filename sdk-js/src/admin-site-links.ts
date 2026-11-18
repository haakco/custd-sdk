// The domains linking to one of a Site's web domains, from Bing, Common Crawl's
// domain graph and Custd's own crawl. SiteDomainAdminClient sends the read. A
// count or rank a source did not report is absent, never 0.

/** Where a referring domain was seen; newer sources may appear. */
export const SiteLinkSource = {
  Bing: "bing",
  CommonCrawl: "commoncrawl",
  Crawl: "crawl",
} as const;

/** The state of one link source for the domain; newer values may appear. */
export const SiteLinkSourceStatus = {
  Available: "available",
  Pending: "pending",
  Failed: "failed",
  Unavailable: "unavailable",
} as const;

/** One source's totals. referringDomains and links are absent when the source did not count them. */
export type SiteLinkSourceTotal = {
  /** A SiteLinkSource value. */
  source: string;
  /** A SiteLinkSourceStatus value. */
  status: string;
  /** What the totals cover, in words. */
  scope: string;
  /** The day the source was read (YYYY-MM-DD), or the Common Crawl release. */
  asOf?: string;
  referringDomains?: number;
  links?: number;
  /** How many of the referring domains are listed. */
  listed: number;
  /** Every referring domain the source knows in scope is listed. */
  complete: boolean;
  lastFailure?: string;
};

/** The domain's place in a Common Crawl release. Every rank is absent when inGraph is false. */
export type SiteDomainAuthority = {
  release: string;
  /** The registrable domain the graph ranks. */
  graphDomain: string;
  inGraph: boolean;
  /** Position by harmonic centrality, 1 is best. */
  harmonicRank?: number;
  harmonicCentrality?: number;
  /** Position by PageRank, 1 is best. */
  pageRankRank?: number;
  pageRank?: number;
  /** Host names the graph holds under the domain. */
  hosts?: number;
};

/** One linking domain. bingLinks, crawlLinks and followed are absent when that source saw no link. */
export type SiteReferringDomain = {
  domain: string;
  /** SiteLinkSource values: the sources that saw it link. */
  sources: string[];
  bingLinks?: number;
  crawlLinks?: number;
  /** A crawled link from it is followed; absent without crawled links. */
  followed?: boolean;
  anchorText?: string;
  harmonicRank?: number;
  pageRankRank?: number;
};

/** A domain that linked in the previous release and no longer does. */
export type SiteLostReferringDomain = {
  domain: string;
  /** Its position in the previous release. */
  harmonicRank?: number;
};

export type SiteLostLinks = {
  /** A SiteLinkSourceStatus value: available, pending or unavailable. */
  status: string;
  release?: string;
  previousRelease?: string;
  scope: string;
  domains: SiteLostReferringDomain[];
};

export type SiteReferringDomains = {
  siteUuid: string;
  domain: string;
  /** A SiteWebDomainRole value. */
  role: string;
  sources: SiteLinkSourceTotal[];
  /** Absent until a Common Crawl release is read for the domain. */
  authority?: SiteDomainAuthority;
  referringDomains: SiteReferringDomain[];
  lost: SiteLostLinks;
};
