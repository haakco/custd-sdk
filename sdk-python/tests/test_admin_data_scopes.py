import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient

SCOPE_UUID = "11111111-1111-1111-1111-111111111111"
RESOURCE_UUID = "33333333-3333-3333-3333-333333333333"
USER_UUID = "22222222-2222-2222-2222-222222222222"

SCOPE = {
    "uuid": SCOPE_UUID,
    "code": "acme-store",
    "name": "Acme Store",
    "status": "active",
    "createdAt": "2026-10-15T00:00:00Z",
    "updatedAt": "2026-10-15T00:00:00Z",
}
RESOURCE = {**SCOPE, "scopeUuid": SCOPE_UUID, "uuid": RESOURCE_UUID, "code": "srv-01"}


class Transport:
    """Records every admin call and returns a fixed success body."""

    def __init__(self, body=None):
        self.calls = []
        self.body = body if body is not None else {}

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append((method, url.removeprefix("http://localhost:8080"), payload))
        return {"status": 200, "body": self.body}


def make_client(transport):
    return CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)


class DataScopeAdminClientTest(unittest.TestCase):
    def test_scope_crud_routes(self) -> None:
        transport = Transport(SCOPE)
        scopes = make_client(transport).admin.data_scopes

        scopes.create_scope({"code": "acme-store", "name": "Acme Store"})
        self.assertEqual(
            transport.calls[0],
            ("POST", "/api/v1/admin/data-scopes", {"code": "acme-store", "name": "Acme Store"}),
        )

        scopes.list_scopes(True)
        self.assertEqual(transport.calls[1][:2], ("GET", "/api/v1/admin/data-scopes?includeDisabled=true"))

        scopes.get_scope(SCOPE_UUID)
        self.assertEqual(transport.calls[2][:2], ("GET", f"/api/v1/admin/data-scopes/{SCOPE_UUID}"))

        scopes.update_scope(SCOPE_UUID, {"status": "disabled"})
        self.assertEqual(
            transport.calls[3],
            ("PATCH", f"/api/v1/admin/data-scopes/{SCOPE_UUID}", {"status": "disabled"}),
        )

        scopes.disable_scope(SCOPE_UUID)
        self.assertEqual(transport.calls[4][:2], ("POST", f"/api/v1/admin/data-scopes/{SCOPE_UUID}/disable"))

    def test_resource_crud_routes(self) -> None:
        transport = Transport(RESOURCE)
        scopes = make_client(transport).admin.data_scopes
        base = f"/api/v1/admin/data-scopes/{SCOPE_UUID}/resources"

        scopes.create_resource(SCOPE_UUID, {"code": "srv-01", "name": "Server 1"})
        self.assertEqual(transport.calls[0][:2], ("POST", base))

        scopes.list_resources(SCOPE_UUID, True)
        self.assertEqual(transport.calls[1][:2], ("GET", base + "?includeDisabled=true"))

        scopes.get_resource(SCOPE_UUID, RESOURCE_UUID)
        self.assertEqual(transport.calls[2][:2], ("GET", f"{base}/{RESOURCE_UUID}"))

        scopes.update_resource(SCOPE_UUID, RESOURCE_UUID, {"name": "Server One"})
        self.assertEqual(transport.calls[3], ("PATCH", f"{base}/{RESOURCE_UUID}", {"name": "Server One"}))

        scopes.disable_resource(SCOPE_UUID, RESOURCE_UUID)
        self.assertEqual(transport.calls[4][:2], ("POST", f"{base}/{RESOURCE_UUID}/disable"))

    def test_grant_routes_and_principal_query(self) -> None:
        transport = Transport({"grants": []})
        scopes = make_client(transport).admin.data_scopes

        scopes.list_grants({"kind": "human", "userUuid": USER_UUID})
        self.assertEqual(transport.calls[0][0], "GET")
        self.assertIn("/api/v1/admin/data-scope-grants?", transport.calls[0][1])
        self.assertIn("kind=human", transport.calls[0][1])
        self.assertIn(f"userUuid={USER_UUID}", transport.calls[0][1])

        grant = {
            "principal": {"kind": "machine", "clientId": "custd-producer"},
            "target": {"kind": "sub_client", "scopeUuid": SCOPE_UUID},
            "action": "read",
        }
        scopes.create_grant(grant)
        self.assertEqual(transport.calls[1], ("POST", "/api/v1/admin/data-scope-grants", grant))

        scopes.revoke_grant(grant)
        self.assertEqual(transport.calls[2], ("POST", "/api/v1/admin/data-scope-grants/revoke", grant))

    def test_rejects_invalid_shapes_before_sending(self) -> None:
        cases = [
            lambda s: s.create_scope({"code": "bad code", "name": "x"}),
            lambda s: s.create_scope({"code": "ok", "name": ""}),
            lambda s: s.update_scope(SCOPE_UUID, {}),
            lambda s: s.update_scope(SCOPE_UUID, {"status": "paused"}),
            lambda s: s.create_grant(
                {
                    "principal": {"kind": "human", "userUuid": USER_UUID, "clientId": "x"},
                    "target": {"kind": "parent"},
                    "action": "read",
                }
            ),
            lambda s: s.create_grant(
                {
                    "principal": {"kind": "machine", "clientId": "custd-producer"},
                    "target": {"kind": "parent", "scopeUuid": SCOPE_UUID},
                    "action": "read",
                }
            ),
            lambda s: s.create_grant(
                {
                    "principal": {"kind": "machine", "clientId": "custd-producer"},
                    "target": {"kind": "parent"},
                    "action": "admin",
                }
            ),
        ]
        for case in cases:
            transport = Transport(SCOPE)
            with self.assertRaises(ValueError):
                case(make_client(transport).admin.data_scopes)
            self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
