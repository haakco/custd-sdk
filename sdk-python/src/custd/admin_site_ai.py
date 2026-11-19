"""Site Insights AI policy, consent and billing usage wire types."""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict

SCOPE_TEMPLATE_SITE_AI_READ = "site-ai-read"

SiteAIMode = Literal["off", "platform", "own-key"]
SiteAIProduct = Literal["hosting", "custd", "cb", "awthy"]
SiteAIUsagePeriod = Literal["day", "month", "previous-month"]


class SiteAISettings(TypedDict):
    aiMode: SiteAIMode
    monthlyCapUsdMicros: int
    keyConfigured: bool
    ownKeyAvailable: NotRequired[bool]
    keyRefused: NotRequired[bool]
    currentTermsVersion: NotRequired[str]
    acceptedTermsVersion: NotRequired[str]
    consentAcceptedAt: NotRequired[str]


class SiteAISettingsRequest(TypedDict):
    aiMode: SiteAIMode
    monthlyCapUsdMicros: int
    apiKey: NotRequired[str]


class SiteAIGrantConsentRequest(TypedDict):
    action: Literal["grant"]
    termsVersion: str


class SiteAIRevokeConsentRequest(TypedDict):
    action: Literal["revoke"]


SiteAIConsentRequest = SiteAIGrantConsentRequest | SiteAIRevokeConsentRequest


class SiteAIUsageRow(TypedDict):
    tenantSlug: NotRequired[str]
    feature: str
    samplingProduct: NotRequired[SiteAIProduct]
    provider: str
    method: str
    model: str
    payer: str
    priceRevision: str
    attempts: int
    unsettledAttempts: int
    unknownCostAttempts: int
    failedAttempts: int
    notSentAttempts: int
    inputTokens: int
    cachedInputTokens: int
    outputTokens: int
    searches: int
    pages: int
    audioMilliseconds: int
    confirmedCostUsdMicros: int
    estimatedCostUsdMicros: int
    capAccountedUsdMicros: int


_SiteAIUsageWindow = TypedDict("_SiteAIUsageWindow", {"from": str, "until": str, "rows": list[SiteAIUsageRow]})


class SiteAIUsage(_SiteAIUsageWindow):
    period: SiteAIUsagePeriod


class SiteAITenantUsage(_SiteAIUsageWindow):
    period: Literal["month"]
    aiMode: SiteAIMode
    monthlyCapUsdMicros: int


class SiteAIPlatformUsage(SiteAIUsage):
    samplingMonthlyCapUsdMicros: int
