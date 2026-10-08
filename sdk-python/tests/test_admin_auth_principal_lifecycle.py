import unittest

from test_admin_auth_projects import OWNING_USER, OWNING_USER_HEADER, client_with


class PrincipalLifecycleTest(unittest.TestCase):
    def test_mutations_use_the_escaped_boundary_and_preserve_receipts(self):
        target = {
            "projectId": "project/1",
            "environmentId": "environment/1",
            "directoryId": "directory/1",
            "providerSubject": "subject/1",
        }
        options = {"owning_user_uuid": OWNING_USER, "idempotency_key": "principal-operation"}
        for action in ("suspend", "restore", "erase"):
            with self.subTest(action=action):
                expected = {"principalId": "principal-1", "status": "applied", "countsRecorded": False}
                client, transport = client_with(expected)
                method = getattr(client.admin.auth_projects, action + "_principal")
                result = method(target, {"confirm": True}, options) if action == "erase" else method(target, options)
                call = transport.calls[0]
                self.assertEqual("POST", call["method"])
                self.assertEqual(
                    "http://localhost:8080/api/v1/admin/auth-projects/project%2F1"
                    "/environments/environment%2F1/directories/directory%2F1/principals/subject%2F1/" + action,
                    call["url"],
                )
                self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
                self.assertEqual("principal-operation", call["headers"]["Idempotency-Key"])
                self.assertEqual({"confirm": True} if action == "erase" else None, call["payload"])
                self.assertEqual(expected, result)

    def test_export_keeps_each_identity_status_and_json_value_types(self):
        target = {
            "projectId": "project/1",
            "environmentId": "environment/1",
            "directoryId": "directory/1",
            "providerSubject": "subject/1",
        }
        expected = {
            "projectId": "project/1",
            "environmentId": "environment/1",
            "directoryId": "directory/1",
            "principalId": "principal-1",
            "enabled": True,
            "createdAt": "2026-10-08T00:00:00Z",
            "identities": [
                {
                    "providerIssuer": "store-one",
                    "providerSubject": "subject-one",
                    "traitsStatus": "included",
                    "traits": [
                        {"name": "verified", "value": True},
                        {"name": "preferences", "value": {"nested": ["plain", None, False, 2]}},
                    ],
                },
                {
                    "providerIssuer": "store-two",
                    "providerSubject": "subject-two",
                    "traitsStatus": "incomplete",
                    "traits": None,
                },
            ],
            "memberships": [],
            "profileValues": [],
        }
        client, transport = client_with(expected)
        result = client.admin.auth_projects.export_principal(target, {"owning_user_uuid": OWNING_USER})
        self.assertEqual(expected, result)
        self.assertIs(result["identities"][0]["traits"][0]["value"], True)
        self.assertEqual("incomplete", result["identities"][1]["traitsStatus"])
        call = transport.calls[0]
        self.assertEqual("GET", call["method"])
        self.assertTrue(
            call["url"].endswith(
                "project%2F1/environments/environment%2F1/directories/directory%2F1/principals/subject%2F1/export"
            )
        )
        self.assertEqual(OWNING_USER, call["headers"][OWNING_USER_HEADER])
        self.assertIsNone(call["payload"])

    def test_lifecycle_models_are_public(self):
        import custd

        for name in (
            "ApplicationPrincipalTarget",
            "ApplicationPrincipalSuspension",
            "ApplicationPrincipalErasure",
            "ApplicationPrincipalErasureRequest",
            "ApplicationPrincipalExport",
            "ApplicationPrincipalIdentityExport",
            "ApplicationIdentityTrait",
        ):
            self.assertIn(name, custd.__all__)
            self.assertTrue(hasattr(custd, name))

    def test_missing_key_refuses_before_transport(self):
        target = {"projectId": "p", "environmentId": "e", "directoryId": "d", "providerSubject": "s"}
        for action in ("suspend", "restore", "erase"):
            with self.subTest(action=action):
                client, transport = client_with({})
                method = getattr(client.admin.auth_projects, action + "_principal")
                with self.assertRaisesRegex(ValueError, "idempotency key"):
                    method(target, {"confirm": True}) if action == "erase" else method(target)
                self.assertEqual([], transport.calls)
