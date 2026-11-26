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


class SiteAIOwnerHandoffRequest(TypedDict):
    """A data space the calling broker owns and the broker's opaque owner subject (1-96 of A-Z, a-z, 0-9, _ or -)."""

    tenantSlug: str
    ownerSubject: str


class SiteAIOwnerHandoff(TypedDict):
    """A single-use code (valid for one minute) and the address the owner's browser redeems it at."""

    code: str
    redeemUrl: str


class SiteAIOwnerSettings(TypedDict):
    """The owner session's tenant and settings; each change presents ``sessionBinding``."""

    tenantSlug: str
    sessionBinding: str
    settings: SiteAISettings


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
    monthlyCapUsedUsdMicros: NotRequired[int]


class SiteAIPlatformUsage(SiteAIUsage):
    samplingMonthlyCapUsdMicros: int
