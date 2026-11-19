export type SiteAIMode = "off" | "platform" | "own-key";
export type SiteAIUsagePeriod = "day" | "month" | "previous-month";
export type SiteAIProduct = "hosting" | "custd" | "cb" | "awthy";

/** Grant requires the version the tenant explicitly accepted. */
export type SiteAIConsentRequest = { action: "grant"; termsVersion: string } | { action: "revoke" };

export type SiteAISettings = {
  aiMode: SiteAIMode;
  monthlyCapUsdMicros: number;
  keyConfigured: boolean;
  ownKeyAvailable?: boolean;
  keyRefused?: boolean;
  currentTermsVersion?: string;
  acceptedTermsVersion?: string;
  consentAcceptedAt?: string;
};

export type SiteAISettingsRequest = {
  aiMode: SiteAIMode;
  monthlyCapUsdMicros: number;
  apiKey?: string;
};

export type SiteAIUsageRow = {
  tenantSlug?: string;
  feature: string;
  samplingProduct?: SiteAIProduct;
  provider: string;
  method: string;
  model: string;
  payer: string;
  priceRevision: string;
  attempts: number;
  unsettledAttempts: number;
  unknownCostAttempts: number;
  failedAttempts: number;
  notSentAttempts: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  searches: number;
  pages: number;
  audioMilliseconds: number;
  confirmedCostUsdMicros: number;
  estimatedCostUsdMicros: number;
  capAccountedUsdMicros: number;
};

export type SiteAIUsage = {
  period: SiteAIUsagePeriod;
  from: string;
  until: string;
  rows: SiteAIUsageRow[];
};

export type SiteAITenantUsage = SiteAIUsage & {
  period: "month";
  aiMode: SiteAIMode;
  monthlyCapUsdMicros: number;
  monthlyCapUsedUsdMicros?: number;
};

export type SiteAIPlatformUsage = SiteAIUsage & {
  samplingMonthlyCapUsdMicros: number;
};
