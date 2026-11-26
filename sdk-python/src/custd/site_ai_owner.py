"""The data-space owner's AI settings session that a broker's handoff code opens.

A broker issues the code with ``client.admin.site_domains.create_ai_owner_handoff``. Redeeming it at
the handoff's ``redeemUrl`` from the broker's hub origin opens a ten-minute owner session, held in an
HttpOnly cookie. The session names its own tenant, so these calls carry no bearer token, no
companySlug and no support-context header. A change presents the ``sessionBinding`` the settings
read returned and the Custd origin, as the Custd-hosted page does.
"""

from __future__ import annotations

import http.cookies
import urllib.parse
from typing import TYPE_CHECKING, TypedDict

from ._wire import answer, decode, public_request
from .admin_site_ai import (
    SiteAIConsentRequest,
    SiteAIOwnerHandoff,
    SiteAIOwnerSettings,
    SiteAISettings,
    SiteAISettingsRequest,
)
from .client import assert_secure_or_local_http, no_redirect_transport
from .version import IDENTITY

if TYPE_CHECKING:
    from .client import AdminTransport

SITE_AI_OWNER_PATH = "/api/v1/site-ai-owner"
SITE_AI_OWNER_COOKIE = "__Host-custd-site-ai-owner"
SITE_AI_OWNER_BINDING_HEADER = "X-Custd-Site-AI-Session"
DEFAULT_SITE_AI_OWNER_TIMEOUT_SECONDS = 10.0
_REDEEM_PATH = SITE_AI_OWNER_PATH + "/redeem"
_SEE_OTHER = 303


class SiteAIOwnerSession(TypedDict):
    """An open owner session: the Custd origin it lives on and its session cookie value."""

    origin: str
    cookie: str


def redeem_site_ai_owner_handoff(
    handoff: SiteAIOwnerHandoff,
    hub_origin: str,
    *,
    timeout: float = DEFAULT_SITE_AI_OWNER_TIMEOUT_SECONDS,
    transport: AdminTransport | None = None,
) -> SiteAIOwnerSession:
    """Redeem a handoff code from the broker's hub origin and return the session it opens."""
    redeem_url = handoff["redeemUrl"]
    assert_secure_or_local_http(redeem_url, "redeemUrl")
    parsed = urllib.parse.urlsplit(redeem_url)
    if parsed.path != _REDEEM_PATH or parsed.query or parsed.fragment:
        raise ValueError("custd: redeemUrl must be the Custd site-ai-owner redeem address")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": hub_origin,
        "X-Custd-Sdk": IDENTITY,
    }
    form = urllib.parse.urlencode({"code": handoff["code"]}).encode("utf-8")
    result = (transport or no_redirect_transport)("POST", redeem_url, form, headers, timeout)
    status = int(result["status"])
    if status != _SEE_OTHER:
        answer(status, result.get("body"), _REDEEM_PATH)
        raise ValueError(f"custd: AI settings redemption answered HTTP {status}, not a session")
    cookies = http.cookies.SimpleCookie(_header(result, "Set-Cookie"))
    if SITE_AI_OWNER_COOKIE not in cookies or not cookies[SITE_AI_OWNER_COOKIE].value:
        raise ValueError("custd: AI settings redemption did not open a session")
    return SiteAIOwnerSession(origin=f"{parsed.scheme}://{parsed.netloc}", cookie=cookies[SITE_AI_OWNER_COOKIE].value)


class SiteAIOwnerClient:
    """The settings calls of one open owner session."""

    def __init__(
        self,
        session: SiteAIOwnerSession,
        *,
        timeout: float = DEFAULT_SITE_AI_OWNER_TIMEOUT_SECONDS,
        transport: AdminTransport | None = None,
    ) -> None:
        self._session = session
        self._timeout = timeout
        self._transport = transport

    def get_settings(self) -> SiteAIOwnerSettings:
        """Read the session's tenant and AI settings, with the binding a change presents."""
        return decode(SiteAIOwnerSettings, self._send("GET", "/settings", None, None))

    def set_settings(self, session_binding: str, request: SiteAISettingsRequest) -> SiteAISettings:
        """Replace AI mode and cap. Omitting the key may keep an existing own key."""
        return decode(SiteAISettings, self._send("PUT", "/settings", session_binding, dict(request)))

    def set_consent(self, session_binding: str, request: SiteAIConsentRequest) -> SiteAISettings:
        """Grant consent for the accepted terms version, or revoke it."""
        return decode(SiteAISettings, self._send("PUT", "/consent", session_binding, dict(request)))

    def _send(self, method: str, path: str, binding: str | None, body: dict[str, object] | None) -> object:
        headers = {"Cookie": f"{SITE_AI_OWNER_COOKIE}={self._session['cookie']}", "X-Custd-Sdk": IDENTITY}
        if binding is not None:
            if not binding.strip():
                raise ValueError("custd: an AI settings change requires the session binding")
            headers.update(
                {
                    "Content-Type": "application/json",
                    "Origin": self._session["origin"],
                    SITE_AI_OWNER_BINDING_HEADER: binding,
                }
            )
        return public_request(
            self._session["origin"],
            method,
            SITE_AI_OWNER_PATH + path,
            body,
            headers,
            self._timeout,
            self._transport or no_redirect_transport,
        )


def _header(result: dict[str, object], name: str) -> str:
    headers = result.get("headers")
    if not isinstance(headers, dict):
        return ""
    for key, value in headers.items():
        if str(key).lower() == name.lower():
            return str(value)
    return ""
