"""What a company's machine credentials (OAuth clients) may do, per feature area.

The policy only narrows: an allowed area still needs the client's own scopes. The company sets each
area ``allowed`` or ``blocked`` for every machine; one machine may override an area with ``allowed``,
``blocked`` or ``inherit``. A blocked call is refused with a ``RequestError`` whose ``code`` is
``machine_access_blocked`` and whose ``machine_access`` names the area and the setting that blocked
it. Area, state and decided-by values are open sets; the constants name the ones Custd sends today.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, NotRequired, TypedDict

from . import _wire
from .client import quote_path

if TYPE_CHECKING:
    from .client import AdminClient

MACHINE_ACCESS_PATH = "/api/v1/admin/machine-access"

MACHINE_ACCESS_AREA_SITES = "sites"
MACHINE_ACCESS_AREA_REPORTING = "reporting"
MACHINE_ACCESS_AREA_PRIVACY_ERASURE = "privacy_erasure"
MACHINE_ACCESS_AREA_DESTRUCTIVE_JOBS = "destructive_jobs"
MACHINE_ACCESS_AREA_USERS_ACCESS = "users_access"
MACHINE_ACCESS_AREA_PROVISIONING_CREDENTIALS = "provisioning_credentials"
MACHINE_ACCESS_AREA_INGEST_SCHEMAS = "ingest_schemas"
MACHINE_ACCESS_AREA_USAGE_BILLING = "usage_billing"

MACHINE_ACCESS_ALLOWED = "allowed"
MACHINE_ACCESS_BLOCKED = "blocked"
MACHINE_ACCESS_INHERIT = "inherit"

MACHINE_ACCESS_DECIDED_BY_COMPANY = "company"
MACHINE_ACCESS_DECIDED_BY_MACHINE = "machine"
MACHINE_ACCESS_DECIDED_BY_SUPPORT_AUTOMATION = "support_automation"


class MachineAccessAreaSetting(TypedDict):
    area: str
    state: str


class MachineAccessCompanyPolicy(TypedDict):
    companySlug: str
    allowSupportAutomation: bool
    areas: list[MachineAccessAreaSetting]


class MachineAccessCompanyUpdateRequest(TypedDict):
    """Both members are optional: an absent one leaves that setting as it is."""

    allowSupportAutomation: NotRequired[bool]
    areas: NotRequired[list[MachineAccessAreaSetting]]


class MachineAccessMachinePolicy(TypedDict):
    companySlug: str
    clientId: str
    areas: list[MachineAccessAreaSetting]


class MachineAccessMachineUpdateRequest(TypedDict):
    areas: list[MachineAccessAreaSetting]


class MachineAccessEffectiveArea(TypedDict):
    area: str
    allowed: bool
    decidedBy: str
    companyState: str
    machineState: str


class MachineAccessEffective(TypedDict):
    companySlug: str
    clientId: str
    scopes: list[str]
    allowedAreas: int
    totalAreas: int
    areas: list[MachineAccessEffectiveArea]


class MachineAccessAdminClient:
    """A tenant administrator manages its own company; platform authority names it with ``company_slug``."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def get(self, company_slug: str | None = None) -> MachineAccessCompanyPolicy:
        """The company default for every area and whether Custd support automation may act in it."""
        value = _wire.request(self._admin, "GET", MACHINE_ACCESS_PATH, query={"companySlug": company_slug})
        return _wire.decode(MachineAccessCompanyPolicy, value)

    def update(
        self, request: MachineAccessCompanyUpdateRequest, company_slug: str | None = None
    ) -> MachineAccessCompanyPolicy:
        value = _wire.request(
            self._admin, "PUT", MACHINE_ACCESS_PATH, query={"companySlug": company_slug}, body=dict(request)
        )
        return _wire.decode(MachineAccessCompanyPolicy, value)

    def get_override(self, client_id: str) -> MachineAccessMachinePolicy:
        """One machine's own per-area setting; the server resolves its company from the client."""
        value = _wire.request(self._admin, "GET", _client_path(client_id))
        return _wire.decode(MachineAccessMachinePolicy, value)

    def update_override(self, client_id: str, request: MachineAccessMachineUpdateRequest) -> MachineAccessMachinePolicy:
        value = _wire.request(self._admin, "PUT", _client_path(client_id), body=dict(request))
        return _wire.decode(MachineAccessMachinePolicy, value)

    def get_effective(self, client_id: str) -> MachineAccessEffective:
        """What the machine can do in each area, and which setting decided it."""
        value = _wire.request(self._admin, "GET", _client_path(client_id) + "/effective")
        return _wire.decode(MachineAccessEffective, value)


def _client_path(client_id: str) -> str:
    return f"{MACHINE_ACCESS_PATH}/clients/{quote_path(client_id)}"
