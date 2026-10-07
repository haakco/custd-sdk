import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient

OWNING_USER = "01957abc-0000-7000-8000-0000000000aa"
OWNING_USER_HEADER = "X-Custd-Owning-User-UUID"

SUMMARY: dict[str, Any] = {
    "projectId": "01957abc-0000-7000-8000-000000000001",
    "slug": "hosting-eu",
    "name": "Hosting EU",
    "environmentId": "01957abc-0000-7000-8000-000000000002",
    "environmentSlug": "production",
    "identityMode": "isolated",
}

DESIRED_STATE: dict[str, Any] = {
    "identityMode": "isolated",
    "registrationPolicy": "invite_only",
    "loginPaused": False,
    "audiences": [
        {
            "audience": "hosting-edge",
            "publicClient": True,
            "redirectUris": ["https://app.example.com/callback"],
            "postLogoutRedirectUris": ["https://app.example.com/logout"],
            "allowedOrigins": ["https://app.example.com"],
        }
    ],
    "profileFields": [
        {"key": "contact_email", "required": True, "visibleToApplication": True, "editableBy": "user"}
    ],
}


class RecordingTransport:
    def __init__(self, body: Any):
        self.body = body
        self.calls: list[dict[str, Any]] = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers})
        return {"status": 200, "body": self.body}


def client_with(body: Any) -> tuple[CustdClient, RecordingTransport]:
    transport = RecordingTransport(body)
    client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)
    return client, transport


class AuthProjectAdminClientTest(unittest.TestCase):
    def test_creates_a_project_with_the_owning_user_header(self) -> None:
        client, transport = client_with(
            {"project": SUMMARY, "operationId": "op-1", "replayed": False, "runtimeReady": True}
        )

        creation = client.admin.auth_projects.create_project(
            {
                "slug": "hosting-eu",
                "name": "Hosting EU",
                "environmentSlug": "production",
                "identityMode": "isolated",
            },
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-1"},
        )

        call = transport.calls[0]
        self.assertEqual("POST", call["method"])
        self.assertEqual("http://localhost:8080/api/v1/admin/auth-projects", call["url"])
        self.assertEqual("Bearer admin-token", call["headers"]["Authorization"])
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertEqual("idem-1", call["headers"]["Idempotency-Key"])
        self.assertEqual(
            {
                "slug": "hosting-eu",
                "name": "Hosting EU",
                "environmentSlug": "production",
                "identityMode": "isolated",
            },
            call["payload"],
        )
        self.assertEqual("op-1", creation["operationId"])
        self.assertFalse(creation["replayed"])
        self.assertTrue(creation["runtimeReady"])
        self.assertEqual("01957abc-0000-7000-8000-000000000002", creation["project"]["environmentId"])

    def test_lists_projects_with_the_paging_cursor(self) -> None:
        client, transport = client_with({"projects": [SUMMARY], "nextAfter": "cursor-2"})

        page = client.admin.auth_projects.list_projects("cursor-1", {"owning_user_uuid": OWNING_USER})

        call = transport.calls[0]
        self.assertEqual("GET", call["method"])
        self.assertEqual("http://localhost:8080/api/v1/admin/auth-projects?after=cursor-1", call["url"])
        self.assertIsNone(call["payload"])
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertEqual("hosting-eu", page["projects"][0]["slug"])
        self.assertEqual("cursor-2", page["nextAfter"])

    def test_adds_an_environment(self) -> None:
        client, transport = client_with({**SUMMARY, "environmentId": "env-2", "environmentSlug": "staging"})

        environment = client.admin.auth_projects.create_environment(
            "project-1",
            {"slug": "staging", "name": "Staging", "identityMode": "isolated"},
            {"owning_user_uuid": OWNING_USER},
        )

        call = transport.calls[0]
        self.assertEqual("POST", call["method"])
        self.assertEqual("http://localhost:8080/api/v1/admin/auth-projects/project-1/environments", call["url"])
        self.assertEqual(
            {"slug": "staging", "name": "Staging", "identityMode": "isolated"},
            call["payload"],
        )
        self.assertEqual("staging", environment["environmentSlug"])

    def test_lists_a_principal_sessions(self) -> None:
        client, transport = client_with(
            {
                "projectId": "project-1",
                "environmentId": "environment-1",
                "directoryId": "directory-1",
                "principalId": "principal-1",
                "sessions": [
                    {
                        "sessionId": "session-1",
                        "active": True,
                        "authenticatedAt": "2026-10-01T00:00:00Z",
                        "authenticatorAssuranceLevel": "aal1",
                        "expiresAt": "2026-10-01T00:04:30Z",
                        "issuedAt": "2026-10-01T00:00:00Z",
                    }
                ],
            }
        )

        inventory = client.admin.auth_projects.list_principal_sessions(
            "project-1", "environment-1", "directory-1", "subject-1", {"owning_user_uuid": OWNING_USER}
        )

        call = transport.calls[0]
        self.assertEqual("GET", call["method"])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
            "/directories/directory-1/principals/subject-1/sessions",
            call["url"],
        )
        self.assertEqual("principal-1", inventory["principalId"])
        self.assertEqual("session-1", inventory["sessions"][0]["sessionId"])
        self.assertTrue(inventory["sessions"][0]["active"])
        self.assertEqual("aal1", inventory["sessions"][0]["authenticatorAssuranceLevel"])

    def test_revokes_one_session(self) -> None:
        client, transport = client_with(
            {"projectId": "project-1", "directoryId": "directory-1", "principalId": "principal-1", "revoked": 1}
        )

        revocation = client.admin.auth_projects.revoke_principal_session(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            {"sessionId": "session-1"},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-2"},
        )

        call = transport.calls[0]
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
            "/directories/directory-1/principals/subject-1/sessions/revoke",
            call["url"],
        )
        self.assertEqual({"sessionId": "session-1"}, call["payload"])
        self.assertEqual("idem-2", call["headers"]["Idempotency-Key"])
        self.assertEqual(1, revocation["revoked"])

    def test_revokes_all_sessions_with_an_explicit_confirmation(self) -> None:
        client, transport = client_with(
            {"projectId": "project-1", "directoryId": "directory-1", "principalId": "principal-1", "revoked": 3}
        )

        revocation = client.admin.auth_projects.revoke_principal_sessions(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            {"confirm": True},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-3"},
        )

        call = transport.calls[0]
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
            "/directories/directory-1/principals/subject-1/sessions/revoke-all",
            call["url"],
        )
        self.assertEqual({"confirm": True}, call["payload"])
        self.assertEqual(3, revocation["revoked"])

    def test_revokes_a_membership(self) -> None:
        client, transport = client_with(
            {
                "projectId": "project-1",
                "environmentId": "environment-1",
                "directoryId": "directory-1",
                "principalId": "principal-1",
                "organisationId": "organisation-1",
                "removedAt": "2026-10-01T00:00:00Z",
                "removed": True,
            }
        )

        revocation = client.admin.auth_projects.revoke_principal_membership(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            {"organisationId": "organisation-1", "reason": "offboarded"},
            {"owning_user_uuid": OWNING_USER},
        )

        call = transport.calls[0]
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
            "/directories/directory-1/principals/subject-1/memberships/revoke",
            call["url"],
        )
        self.assertEqual({"organisationId": "organisation-1", "reason": "offboarded"}, call["payload"])
        self.assertTrue(revocation["removed"])
        self.assertEqual("organisation-1", revocation["organisationId"])

    def test_rejects_a_missing_idempotency_key_before_sending(self) -> None:
        client, transport = client_with({})

        with self.assertRaises(ValueError):
            client.admin.auth_projects.create_project(
                {"slug": "hosting-eu", "name": "Hosting EU", "environmentSlug": "production"},
                {"owning_user_uuid": OWNING_USER},
            )

        self.assertEqual([], transport.calls)

    def test_omits_the_owning_user_header_for_a_human_administrator(self) -> None:
        client, transport = client_with({"projects": []})

        client.admin.auth_projects.list_projects()

        call = transport.calls[0]
        self.assertEqual("http://localhost:8080/api/v1/admin/auth-projects", call["url"])
        self.assertNotIn(OWNING_USER_HEADER, call["headers"])

    def test_applies_the_environment_desired_state(self) -> None:
        client, transport = client_with(
            {
                "id": "op-1",
                "kind": "project_auth_config_update",
                "status": "applied",
                "revision": 7,
                "idempotencyKey": "idem-apply",
                "appliedAt": "2026-10-07T00:00:00Z",
                "replayed": False,
            }
        )

        operation = client.admin.auth_projects.apply_environment_desired_state(
            "project-1",
            "environment-1",
            {"desiredState": DESIRED_STATE, "expectedRevision": 6},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-apply"},
        )

        call = transport.calls[0]
        self.assertEqual("POST", call["method"])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/apply",
            call["url"],
        )
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertEqual("idem-apply", call["headers"]["Idempotency-Key"])
        self.assertEqual(
            {"desiredState": DESIRED_STATE, "expectedRevision": 6},
            call["payload"],
        )
        self.assertEqual("op-1", operation["id"])
        self.assertEqual(7, operation["revision"])
        self.assertFalse(operation["replayed"])

    def test_previews_the_environment_desired_state(self) -> None:
        client, transport = client_with(
            {
                "projectId": "project-1",
                "environmentId": "environment-1",
                "revision": 7,
                "changes": [
                    {"field": "desired.audiences", "before": "[]", "after": "[hosting-edge]"}
                ],
                "sideEffects": ["client_registration"],
                "noOp": False,
            }
        )

        preview = client.admin.auth_projects.preview_environment_desired_state(
            "project-1",
            "environment-1",
            {"desiredState": DESIRED_STATE, "expectedRevision": 6},
            {"owning_user_uuid": OWNING_USER},
        )

        call = transport.calls[0]
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/preview",
            call["url"],
        )
        self.assertEqual("desired.audiences", preview["changes"][0]["field"])
        self.assertEqual(["client_registration"], preview["sideEffects"])
        self.assertFalse(preview["noOp"])

    def test_reads_the_audience_binding_back_from_environment_status(self) -> None:
        client, transport = client_with(
            {
                "projectId": "project-1",
                "environmentId": "environment-1",
                "revision": 7,
                "desired": DESIRED_STATE,
                "reconciled": True,
                "reconcileNote": "",
                "loginReady": False,
                "loginNote": "",
                "clientSync": {
                    "clientIds": ["custd-app-environment-1-hosting-edge"],
                    "revision": 7,
                    "checkedAt": "2026-10-07T00:00:00Z",
                    "current": True,
                    "registrations": [
                        {
                            "audience": "hosting-edge",
                            "clientId": "custd-app-environment-1-hosting-edge",
                            "observed": True,
                        }
                    ],
                },
            }
        )

        status = client.admin.auth_projects.get_environment_status(
            "project-1", "environment-1", {"owning_user_uuid": OWNING_USER}
        )

        call = transport.calls[0]
        self.assertEqual("GET", call["method"])
        self.assertEqual(
            "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/status",
            call["url"],
        )
        self.assertEqual("environment-1", status["environmentId"])
        self.assertEqual("hosting-edge", status["desired"]["audiences"][0]["audience"])
        self.assertEqual(
            "custd-app-environment-1-hosting-edge",
            status["clientSync"]["registrations"][0]["clientId"],
        )

    def test_rejects_a_missing_idempotency_key_on_apply_before_sending(self) -> None:
        client, transport = client_with({})

        with self.assertRaises(ValueError):
            client.admin.auth_projects.apply_environment_desired_state(
                "project-1",
                "environment-1",
                {"desiredState": DESIRED_STATE, "expectedRevision": 6},
                {"owning_user_uuid": OWNING_USER},
            )

        self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
