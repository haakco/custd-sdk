import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import ApplicationPrincipalTarget, AudienceGrantRequest, CustdClient, PrincipalAudiences

TARGET: ApplicationPrincipalTarget = {
    "projectId": "project/1", "environmentId": "env/1", "directoryId": "dir/1", "providerSubject": "provider/subject"
}
BODY: AudienceGrantRequest = {"directoryId": "dir/1", "audience": "app-web", "organisationId": "org-1"}
BASE = (
    "http://localhost:8080/api/v1/admin/auth-projects/project%2F1/environments/env%2F1"
    "/principals/provider%2Fsubject/audiences"
)


class PrincipalAudienceTests(unittest.TestCase):
    def setup_client(self, response):
        calls = []

        def transport(method, url, payload, headers, timeout):
            calls.append({"method": method, "url": url, "body": payload, "headers": headers})
            return {"status": 200, "body": response}

        return CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport), calls

    def test_list(self):
        response: PrincipalAudiences = {
            "audienceEntitlementMode": "explicit_grants",
            "audiences": [{"audience": "app-web", "granted": True, "managed": True}],
        }
        client, calls = self.setup_client(response)
        self.assertEqual(client.admin.auth_projects.list_principal_audiences(TARGET), response)
        self.assertEqual(calls[0]["method"], "GET")
        self.assertEqual(calls[0]["url"], BASE + "?directoryId=dir%2F1")
        self.assertIsNone(calls[0]["body"])
        self.assertNotIn("Idempotency-Key", calls[0]["headers"])
        self.assertEqual(calls[0]["headers"]["Authorization"], "Bearer token")

    def test_grant_and_revoke_only_named_audience_without_replacement(self):
        for action in ("grant", "revoke"):
            with self.subTest(action=action):
                response = {
                    "principalId": "principal-1", "organisationId": "org-1", "audience": "app-web",
                    "granted": action == "grant", "managed": True,
                }
                client, calls = self.setup_client(response)
                mutate = getattr(client.admin.auth_projects, action + "_principal_audience")
                for options in (None, {"idempotency_key": "   "}):
                    with self.assertRaises(ValueError):
                        mutate(TARGET, BODY, options)
                self.assertEqual(calls, [])
                self.assertEqual(mutate(TARGET, BODY, {"idempotency_key": "audience-key"}), response)
                self.assertEqual(calls[0]["url"], BASE + "/" + action)
                self.assertEqual(calls[0]["method"], "POST")
                self.assertEqual(calls[0]["body"], BODY)
                self.assertEqual(calls[0]["headers"]["Idempotency-Key"], "audience-key")
                self.assertEqual(calls[0]["headers"]["Authorization"], "Bearer token")
