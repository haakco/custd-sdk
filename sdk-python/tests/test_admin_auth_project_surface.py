import pathlib
import sys
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import AuthProjectRealmNotConvergedError, AuthProjectRealmProvisionError, CustdClient

OWNING_USER = "01957abc-0000-7000-8000-0000000000aa"
OWNING_USER_HEADER = "X-Custd-Owning-User-UUID"
BASE = "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"

DESIRED_STATE: dict[str, Any] = {
    "identityMode": "isolated",
    "registrationPolicy": "invite_only",
    "loginPaused": False,
    "audiences": [],
    "profileFields": [],
}


class QueuedTransport:
    """Answers each call with the queued body, recording every request."""

    def __init__(self, bodies: list[Any], statuses: list[int] | None = None):
        self.bodies = bodies
        self.statuses = statuses or []
        self.calls: list[dict[str, Any]] = []

    def __call__(self, method, url, payload, headers, timeout):
        index = len(self.calls)
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers})
        status = self.statuses[index] if index < len(self.statuses) else 200
        body = self.bodies[index] if index < len(self.bodies) else {}
        return {"status": status, "body": body}


def client_with(bodies: list[Any], statuses: list[int] | None = None) -> tuple[CustdClient, QueuedTransport]:
    transport = QueuedTransport(bodies, statuses)
    client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)
    return client, transport


class RealmWireTransport:
    """Stateful stand-in for the admin API's project-auth revision rules.

    It enforces what the service enforces, so a provision test exercises the real
    ordering contract instead of a permissive fixed response: an apply at the
    current revision advances it, a directory transition compares its expected
    revision against the environment revision and advances it, a reconcile records
    its observation at the current revision without advancing it, status is
    reconciled only when the observation describes the current revision, and a
    repeated Idempotency-Key returns the recorded response instead of writing
    again.
    """

    def __init__(self, project_id: str = "project-1", environment_id: str = "environment-1") -> None:
        self.project_id = project_id
        self.environment_id = environment_id
        self.revision = 0
        self.observed_at = 0
        self.operations: dict[str, Any] = {}
        self.calls: list[dict[str, Any]] = []
        self.status_failures = 0
        self.skip_observation = False

    def __call__(self, method, url, payload, headers, timeout):
        key = headers.get("Idempotency-Key", "")
        self.calls.append({"method": method, "url": url, "payload": payload, "headers": headers})
        if key and not 8 <= len(key) <= 128:
            return {"status": 400, "body": {"title": "invalid_idempotency_key"}}
        if method == "POST" and url.endswith("/apply"):
            return self._apply(key)
        if method == "POST" and url.endswith("/directories/enable"):
            return self._enable(key)
        if method == "POST" and url.endswith("/clients/reconcile"):
            return self._reconcile(key)
        if method == "GET" and url.endswith("/status"):
            return self._status()
        return {"status": 404, "body": {"title": "not_found"}}

    def _apply(self, key: str) -> dict[str, Any]:
        if key in self.operations:
            return {"status": 200, "body": self.operations[key]}
        expected = self.calls[-1]["payload"]["expectedRevision"]
        if self.revision == 0 and expected == 0:
            self.revision = 1
        elif self.revision != 0 and expected == self.revision:
            self.revision += 1
        else:
            return {"status": 409, "body": {"title": "revision_conflict"}}
        operation = self._operation("project_auth_config_update", key)
        self.operations[key] = operation
        return {"status": 200, "body": operation}

    def _enable(self, key: str) -> dict[str, Any]:
        if key in self.operations:
            return {"status": 200, "body": self.operations[key]}
        if self.calls[-1]["payload"]["expectedRevision"] != self.revision:
            return {"status": 409, "body": {"title": "revision_conflict"}}
        self.revision += 1
        operation = self._operation("directory_enable", key)
        self.operations[key] = operation
        return {"status": 200, "body": operation}

    def _reconcile(self, key: str) -> dict[str, Any]:
        if key in self.operations:
            return {"status": 200, "body": self.operations[key]}
        if self.calls[-1]["payload"]["expectedRevision"] != self.revision:
            return {"status": 409, "body": {"title": "client_sync_stale"}}
        if not self.skip_observation:
            self.observed_at = self.revision
        report = {
            "environmentId": self.environment_id,
            "revision": self.revision,
            "checkedAt": "2026-10-16T00:00:00Z",
            "superseded": False,
            "clients": [],
        }
        self.operations[key] = report
        return {"status": 200, "body": report}

    def _status(self) -> dict[str, Any]:
        if self.status_failures > 0:
            self.status_failures -= 1
            return {"status": 500, "body": {"title": "status_unavailable"}}
        reconciled = self.observed_at != 0 and self.observed_at == self.revision
        client_sync = None
        if self.observed_at != 0:
            client_sync = {
                "clientIds": [],
                "revision": self.observed_at,
                "checkedAt": "2026-10-16T00:00:00Z",
                "current": self.observed_at == self.revision,
                "registrations": [],
            }
        return {
            "status": 200,
            "body": {
                "projectId": self.project_id,
                "environmentId": self.environment_id,
                "revision": self.revision,
                "desired": DESIRED_STATE,
                "reconciled": reconciled,
                "reconcileNote": "",
                "loginReady": False,
                "loginNote": "",
                "clientSync": client_sync,
            },
        }

    def _operation(self, kind: str, key: str) -> dict[str, Any]:
        return {
            "id": f"op-{self.revision}",
            "kind": kind,
            "status": "applied",
            "revision": self.revision,
            "idempotencyKey": key,
            "appliedAt": "2026-10-16T00:00:00Z",
            "replayed": False,
        }


def client_for(transport: RealmWireTransport) -> CustdClient:
    return CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)


class AuthProjectSurfaceTest(unittest.TestCase):
    def test_reads_capability(self) -> None:
        client, transport = client_with(
            [
                {
                    "identityModes": ["isolated", "shared"],
                    "registrationPolicies": ["invite_only"],
                    "profileFieldKeys": ["contact_email"],
                    "audienceConstraints": "one audience per environment",
                    "subjectUniqueness": "per environment",
                }
            ]
        )

        capability = client.admin.auth_projects.get_environment_capability(
            "project-1", "environment-1", {"owning_user_uuid": OWNING_USER}
        )

        call = transport.calls[0]
        self.assertEqual("GET", call["method"])
        self.assertEqual(f"{BASE}/capability", call["url"])
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertEqual("shared", capability["identityModes"][1])

    def test_lists_directories_with_capacity(self) -> None:
        client, transport = client_with(
            [
                {
                    "projectId": "project-1",
                    "environmentId": "environment-1",
                    "revision": 4,
                    "directories": [
                        {
                            "poolId": "pool-1",
                            "poolSlug": "primary",
                            "state": "ready",
                            "slotRef": "store-1",
                            "revision": 4,
                            "attemptCount": 1,
                        }
                    ],
                    "ready": True,
                    "capacity": {"declared": 3, "inUse": 1, "free": 2},
                }
            ]
        )

        status = client.admin.auth_projects.list_directories("project-1", "environment-1")

        call = transport.calls[0]
        self.assertEqual(f"{BASE}/directories", call["url"])
        self.assertEqual(2, status["capacity"]["free"])
        self.assertEqual("store-1", status["directories"][0]["slotRef"])

    def test_acts_on_directory_with_escaped_action(self) -> None:
        client, transport = client_with(
            [
                {
                    "id": "op-1",
                    "kind": "directory_enable",
                    "status": "applied",
                    "revision": 5,
                    "idempotencyKey": "idem-dir",
                    "appliedAt": "2026-10-16T00:00:00Z",
                    "replayed": False,
                }
            ]
        )

        operation = client.admin.auth_projects.act_on_directory(
            "project-1",
            "environment-1",
            "enable",
            {"poolId": "pool-1", "expectedRevision": 4},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-dir"},
        )

        call = transport.calls[0]
        self.assertEqual(f"{BASE}/directories/enable", call["url"])
        self.assertEqual("idem-dir", call["headers"]["Idempotency-Key"])
        self.assertEqual({"poolId": "pool-1", "expectedRevision": 4}, call["payload"])
        self.assertEqual(5, operation["revision"])

    def test_rejects_unknown_directory_action(self) -> None:
        client, transport = client_with([{}])

        with self.assertRaises(ValueError):
            client.admin.auth_projects.act_on_directory(
                "project-1", "environment-1", "destroy", {"poolId": "pool-1", "expectedRevision": 0}
            )

        self.assertEqual([], transport.calls)

    def test_lists_environment_organisations(self) -> None:
        client, transport = client_with(
            [
                {
                    "projectId": "project-1",
                    "environmentId": "environment-1",
                    "organisations": [
                        {"organisationId": "org-1", "slug": "acme", "name": "Acme", "identityPoolId": "pool-1"}
                    ],
                }
            ]
        )

        organisations = client.admin.auth_projects.list_environment_organisations("project-1", "environment-1")

        self.assertEqual(f"{BASE}/organisations", transport.calls[0]["url"])
        self.assertEqual("pool-1", organisations["organisations"][0]["identityPoolId"])

    def test_reconciles_environment_clients(self) -> None:
        client, transport = client_with(
            [
                {
                    "environmentId": "environment-1",
                    "revision": 6,
                    "checkedAt": "2026-10-16T00:00:00Z",
                    "superseded": False,
                    "clients": [
                        {
                            "audience": "hosting-edge",
                            "clientId": "custd-app-environment-1-hosting-edge",
                            "action": "created",
                        }
                    ],
                }
            ]
        )

        report = client.admin.auth_projects.reconcile_environment_clients(
            "project-1",
            "environment-1",
            {"expectedRevision": 5},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-reconcile"},
        )

        call = transport.calls[0]
        self.assertEqual(f"{BASE}/clients/reconcile", call["url"])
        self.assertEqual({"expectedRevision": 5}, call["payload"])
        self.assertEqual("created", report["clients"][0]["action"])

    def test_reconcile_reports_null_clients_for_an_empty_configuration(self) -> None:
        client, transport = client_with(
            [
                {
                    "environmentId": "environment-1",
                    "revision": 1,
                    "checkedAt": "2026-10-16T00:00:00Z",
                    "superseded": False,
                    "clients": None,
                }
            ]
        )

        report = client.admin.auth_projects.reconcile_environment_clients(
            "project-1",
            "environment-1",
            {"expectedRevision": 0},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-reconcile"},
        )

        self.assertEqual(f"{BASE}/clients/reconcile", transport.calls[0]["url"])
        self.assertIsNone(report["clients"])

    def test_invitation_lifecycle(self) -> None:
        invitation = {
            "invitationId": "inv-1",
            "email": "person@example.com",
            "membershipRole": "member",
            "poolId": "pool-1",
            "organisationId": "org-1",
            "expiresAt": "2026-10-20T00:00:00Z",
            "createdAt": "2026-10-16T00:00:00Z",
            "state": "open",
        }
        client, transport = client_with(
            [
                {
                    "invitations": [
                        {**invitation, "acceptedPrincipalId": None},
                        {
                            **invitation,
                            "invitationId": "inv-accepted",
                            "state": "accepted",
                            "acceptedPrincipalId": "017f22e2-79b0-7f4a-8f90-ec7c7c502334",
                        },
                    ]
                },
                {
                    "invitation": {**invitation, "delivered": True},
                    "inviteUrl": "https://auth.example.com/invite/abc",
                    "replayed": False,
                },
                {"invitation": invitation, "inviteUrl": "https://auth.example.com/invite/def", "replayed": False},
                {**invitation, "state": "revoked"},
            ]
        )
        projects = client.admin.auth_projects
        opts = {"owning_user_uuid": OWNING_USER}

        listed = projects.list_invitations("project-1", "environment-1", opts)
        issued = projects.issue_invitation(
            "project-1",
            "environment-1",
            {
                "poolId": "pool-1",
                "organisationId": "org-1",
                "email": "person@example.com",
                "membershipRole": "member",
                "expiresInSeconds": 86400,
            },
            {**opts, "idempotency_key": "idem-invite"},
        )
        redelivered = projects.redeliver_invitation(
            "project-1", "environment-1", {"invitationId": "inv-1"}, {**opts, "idempotency_key": "idem-redeliver"}
        )
        revoked = projects.revoke_invitation(
            "project-1", "environment-1", {"invitationId": "inv-1"}, {**opts, "idempotency_key": "idem-revoke"}
        )

        self.assertEqual(f"{BASE}/invitations", transport.calls[0]["url"])
        self.assertEqual(f"{BASE}/invitations", transport.calls[1]["url"])
        self.assertEqual(f"{BASE}/invitations/redeliver", transport.calls[2]["url"])
        self.assertEqual(f"{BASE}/invitations/revoke", transport.calls[3]["url"])
        self.assertEqual("open", listed["invitations"][0]["state"])
        self.assertIsNone(listed["invitations"][0].get("acceptedPrincipalId"))
        self.assertEqual(
            "017f22e2-79b0-7f4a-8f90-ec7c7c502334", listed["invitations"][1].get("acceptedPrincipalId")
        )
        self.assertEqual("https://auth.example.com/invite/abc", issued["inviteUrl"])
        self.assertEqual("https://auth.example.com/invite/def", redelivered["inviteUrl"])
        self.assertEqual("revoked", revoked["state"])

    def test_invitation_routes_reject_missing_idempotency_key(self) -> None:
        client, transport = client_with([{}])
        projects = client.admin.auth_projects

        for invoke in (
            lambda: projects.issue_invitation(
                "project-1",
                "environment-1",
                {
                    "poolId": "pool-1",
                    "organisationId": "org-1",
                    "email": "e",
                    "membershipRole": "member",
                    "expiresInSeconds": 1,
                },
                {"owning_user_uuid": OWNING_USER},
            ),
            lambda: projects.redeliver_invitation(
                "project-1", "environment-1", {"invitationId": "inv-1"}, {"owning_user_uuid": OWNING_USER}
            ),
            lambda: projects.revoke_invitation(
                "project-1", "environment-1", {"invitationId": "inv-1"}, {"owning_user_uuid": OWNING_USER}
            ),
        ):
            with self.assertRaises(ValueError):
                invoke()

        self.assertEqual([], transport.calls)

    def test_principal_profile_and_memberships(self) -> None:
        target = {
            "projectId": "project-1",
            "environmentId": "environment-1",
            "directoryId": "directory-1",
            "providerSubject": "subject-1",
        }
        principal_path = f"{BASE}/directories/directory-1/principals/subject-1"
        client, transport = client_with(
            [
                {
                    "projectId": "project-1",
                    "environmentId": "environment-1",
                    "directoryId": "directory-1",
                    "principalId": "principal-1",
                    "fields": [
                        {
                            "fieldKey": "contact_email",
                            "value": "person@example.com",
                            "present": True,
                            "required": True,
                            "editableBy": "user",
                            "editable": False,
                        }
                    ],
                    "missingRequired": ["display_name"],
                },
                {
                    "projectId": "project-1",
                    "environmentId": "environment-1",
                    "directoryId": "directory-1",
                    "principalId": "principal-1",
                    "fields": [],
                    "missingRequired": [],
                },
                {
                    "projectId": "project-1",
                    "environmentId": "environment-1",
                    "directoryId": "directory-1",
                    "principalId": "principal-1",
                    "memberships": [
                        {
                            "organisationId": "org-1",
                            "organisationSlug": "acme",
                            "organisationName": "Acme",
                            "role": "member",
                        }
                    ],
                },
            ]
        )
        projects = client.admin.auth_projects

        profile = projects.get_principal_profile(target, {"owning_user_uuid": OWNING_USER})
        projects.set_principal_profile(
            target,
            {"values": [{"fieldKey": "display_name", "value": "Ada"}]},
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "idem-profile"},
        )
        memberships = projects.list_principal_memberships(target, {"owning_user_uuid": OWNING_USER})

        self.assertEqual(f"{principal_path}/profile", transport.calls[0]["url"])
        self.assertEqual(f"{principal_path}/profile", transport.calls[1]["url"])
        self.assertEqual(f"{principal_path}/memberships", transport.calls[2]["url"])
        self.assertFalse(profile["fields"][0]["editable"])
        self.assertEqual(["display_name"], profile["missingRequired"])
        self.assertEqual("member", memberships["memberships"][0]["role"])

    def test_deletes_project_and_environment(self) -> None:
        client, transport = client_with(
            [
                {
                    "projectId": "project-1",
                    "slug": "hosting-eu",
                    "name": "Hosting EU",
                    "released": {
                        "environments": 2,
                        "directories": 2,
                        "organisations": 2,
                        "memberships": 1,
                        "invitations": 3,
                        "audienceBindings": 1,
                        "operations": 4,
                    },
                },
                {
                    "projectId": "project-1",
                    "projectSlug": "hosting-eu",
                    "environmentId": "environment-1",
                    "slug": "staging",
                    "name": "Staging",
                    "released": {
                        "directories": 1,
                        "organisations": 1,
                        "memberships": 0,
                        "invitations": 1,
                        "audienceBindings": 1,
                        "operations": 2,
                        "profileValues": 3,
                    },
                },
            ]
        )
        projects = client.admin.auth_projects

        deletion = projects.delete_project(
            "project-1", {"confirmSlug": "hosting-eu"}, {"owning_user_uuid": OWNING_USER}
        )
        environment = projects.delete_environment(
            "project-1", "environment-1", {"confirmSlug": "staging"}, {"owning_user_uuid": OWNING_USER}
        )

        self.assertEqual("http://localhost:8080/api/v1/admin/auth-projects/project-1/delete", transport.calls[0]["url"])
        self.assertEqual(f"{BASE}/delete", transport.calls[1]["url"])
        self.assertEqual({"confirmSlug": "hosting-eu"}, transport.calls[0]["payload"])
        self.assertEqual(2, deletion["released"]["environments"])
        self.assertEqual(3, environment["released"]["profileValues"])

    def test_offboards_environment_without_idempotency_key(self) -> None:
        client, transport = client_with(
            [
                {
                    "projectId": "project-1",
                    "projectSlug": "hosting-eu",
                    "environmentId": "environment-1",
                    "slug": "staging",
                    "name": "Staging",
                    "authorityWithdrawn": True,
                    "loginPaused": True,
                    "revision": 7,
                    "clientCleanup": {"status": "complete", "clientsRemoved": 2},
                    "retained": {
                        "directories": 1,
                        "organisations": 1,
                        "memberships": 0,
                        "invitations": 1,
                        "profileValues": 3,
                        "reservedSlots": 1,
                    },
                }
            ]
        )

        receipt = client.admin.auth_projects.offboard_environment(
            "project-1", "environment-1", {"confirmSlug": "staging"}, {"owning_user_uuid": OWNING_USER}
        )

        call = transport.calls[0]
        self.assertEqual("POST", call["method"])
        self.assertEqual(f"{BASE}/offboard", call["url"])
        self.assertEqual({"confirmSlug": "staging"}, call["payload"])
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertNotIn("Idempotency-Key", call["headers"])
        self.assertTrue(receipt["authorityWithdrawn"])
        self.assertEqual("complete", receipt["clientCleanup"]["status"])
        self.assertEqual(1, receipt["retained"]["reservedSlots"])


class AuthProjectRealmProvisionTest(unittest.TestCase):
    def test_enforces_server_revision_sequence(self) -> None:
        transport = RealmWireTransport()
        client = client_for(transport)

        receipt = client.admin.auth_projects.provision_realm(
            "project-1",
            "environment-1",
            {
                "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                "directoryPoolId": "pool-1",
            },
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "realm-provision-1"},
        )

        self.assertEqual(4, len(transport.calls))
        suffixes = ["/apply", "/directories/enable", "/clients/reconcile", "/status"]
        for call, suffix in zip(transport.calls, suffixes, strict=True):
            self.assertTrue(call["url"].endswith(suffix), call["url"])
        keys = [
            "realm-provision-1:apply",
            "realm-provision-1:directory-enable",
            "realm-provision-1:client-reconcile",
            "",
        ]
        for call, key in zip(transport.calls, keys, strict=True):
            self.assertEqual(key, call["headers"].get("Idempotency-Key", ""))
        # The directory enable and reconcile must name the revisions the server produced.
        self.assertEqual({"poolId": "pool-1", "expectedRevision": 1}, transport.calls[1]["payload"])
        self.assertEqual({"expectedRevision": 2}, transport.calls[2]["payload"])
        self.assertEqual(2, transport.revision)
        self.assertEqual(2, transport.observed_at)
        self.assertNotIn("failedStep", receipt)
        self.assertEqual(1, receipt["apply"]["revision"])
        self.assertEqual(2, receipt["directory"]["revision"])
        self.assertEqual(2, receipt["reconcile"]["revision"])
        self.assertTrue(receipt["status"]["reconciled"])

    def test_resumes_with_same_base_key_after_late_failure(self) -> None:
        transport = RealmWireTransport()
        transport.status_failures = 1
        client = client_for(transport)
        request = {
            "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
            "directoryPoolId": "pool-1",
        }
        options = {"owning_user_uuid": OWNING_USER, "idempotency_key": "realm-provision-2"}

        with self.assertRaises(AuthProjectRealmProvisionError) as raised:
            client.admin.auth_projects.provision_realm("project-1", "environment-1", request, options)

        self.assertEqual("status", raised.exception.failed_step)
        self.assertEqual(2, transport.revision)

        receipt = client.admin.auth_projects.provision_realm("project-1", "environment-1", request, options)

        self.assertNotIn("failedStep", receipt)
        self.assertTrue(receipt["status"]["reconciled"])
        self.assertEqual(8, len(transport.calls))
        self.assertEqual(2, transport.revision)

    def test_fails_when_not_converged(self) -> None:
        transport = RealmWireTransport()
        transport.skip_observation = True
        client = client_for(transport)

        with self.assertRaises(AuthProjectRealmNotConvergedError) as raised:
            client.admin.auth_projects.provision_realm(
                "project-1",
                "environment-1",
                {
                    "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                    "directoryPoolId": "pool-1",
                },
                {"owning_user_uuid": OWNING_USER, "idempotency_key": "realm-provision-3"},
            )

        error = raised.exception
        self.assertEqual("status", error.failed_step)
        self.assertFalse(error.receipt["status"]["reconciled"])

    def test_rejects_out_of_bounds_base_key(self) -> None:
        for key in ("k" * 7, "k" * 112):
            transport = RealmWireTransport()
            client = client_for(transport)

            with self.assertRaises(ValueError):
                client.admin.auth_projects.provision_realm(
                    "project-1",
                    "environment-1",
                    {
                        "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                        "directoryPoolId": "pool-1",
                    },
                    {"owning_user_uuid": OWNING_USER, "idempotency_key": key},
                )

            self.assertEqual([], transport.calls)

    def test_accepts_boundary_base_key(self) -> None:
        transport = RealmWireTransport()
        client = client_for(transport)

        client.admin.auth_projects.provision_realm(
            "project-1",
            "environment-1",
            {
                "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                "directoryPoolId": "pool-1",
            },
            {"owning_user_uuid": OWNING_USER, "idempotency_key": "k" * 111},
        )

        self.assertEqual(4, len(transport.calls))
        for call in transport.calls:
            key = call["headers"].get("Idempotency-Key", "")
            if key:
                self.assertGreaterEqual(len(key), 8)
                self.assertLessEqual(len(key), 128)

    def test_reports_failed_directory_step_and_keeps_completed_steps(self) -> None:
        client, transport = client_with(
            [
                {
                    "id": "op-apply",
                    "kind": "project_auth_config_update",
                    "status": "applied",
                    "revision": 1,
                    "idempotencyKey": "provision-2:apply",
                    "appliedAt": "x",
                    "replayed": False,
                },
                {"title": "directory_capacity_exhausted"},
            ],
            statuses=[200, 409],
        )

        with self.assertRaises(AuthProjectRealmProvisionError) as raised:
            client.admin.auth_projects.provision_realm(
                "project-1",
                "environment-1",
                {
                    "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                    "directoryPoolId": "pool-1",
                },
                {"owning_user_uuid": OWNING_USER, "idempotency_key": "provision-2"},
            )

        error = raised.exception
        self.assertEqual("directory_enable", error.failed_step)
        self.assertEqual("op-apply", error.receipt["apply"]["id"])
        self.assertEqual(2, len(transport.calls))

    def test_rejects_missing_base_key(self) -> None:
        client, transport = client_with([{}])

        with self.assertRaises(ValueError):
            client.admin.auth_projects.provision_realm(
                "project-1",
                "environment-1",
                {
                    "desiredStateRequest": {"desiredState": DESIRED_STATE, "expectedRevision": 0},
                    "directoryPoolId": "pool-1",
                },
                {"owning_user_uuid": OWNING_USER},
            )

        self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
