import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient


class Transport:
    def __init__(self):
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append((method, url.removeprefix("http://localhost:8080"), payload))
        if method == "GET" and url.endswith("/data-labels"):
            return {"status": 200, "body": {"definitions": []}}
        if method == "GET" and "/catalogue" in url:
            return {
                "status": 200,
                "body": {"catalogue": {"labels": []}, "assignments": [], "reportingPacks": [], "fingerprint": "sha256"},
            }
        if method == "GET" and url.endswith("/usage"):
            return {"status": 200, "body": {"usage": []}}
        if method == "GET" and url.endswith("/data-label-assignments"):
            return {"status": 200, "body": {"eventTypeDefaults": [], "schemaFieldAssignments": []}}
        return {"status": 204, "body": ""}


class DataLabelAdminClientTest(unittest.TestCase):
    def test_routes_vocabulary_values_assignments_and_catalogue(self):
        transport = Transport()
        client = CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)
        labels = client.admin.data_labels
        create = {
            "key": "app.plan",
            "displayName": "Plan",
            "description": "Plan",
            "allowedScopes": ["event"],
            "sensitivity": "internal",
            "intendedUse": "Reporting",
            "synonyms": [],
            "propagationPolicy": "none",
        }
        update = {key: value for key, value in create.items() if key != "key"}
        labels.list(True)
        labels.catalogue(True)
        labels.get("definition/1", True)
        labels.create(create)
        labels.update("definition/1", update)
        labels.disable("definition/1")
        labels.create_value("definition/1", {"value": "paid", "displayName": "Paid", "description": "Paid"})
        labels.update_value("value/1", {"displayName": "Paid", "description": "Updated"})
        labels.disable_value("value/1")
        labels.list_usage()
        labels.list_assignments()
        labels.set_event_type_default("page/view", "definition/1", {"valueUuid": "value-1"})
        labels.remove_event_type_default("page/view", "definition/1")
        labels.set_schema_field_assignment(
            "schema/1", {"fieldPath": "/user/id", "definitionUuid": "definition-1", "valueUuid": "value-1"}
        )
        labels.remove_schema_field_assignment("assignment/1")
        self.assertEqual(
            [
                ("GET", "/api/v1/admin/data-labels?includeDisabled=true"),
                ("GET", "/api/v1/admin/data-labels/catalogue?includeDisabled=true"),
                ("GET", "/api/v1/admin/data-labels/definition%2F1?includeDisabled=true"),
                ("POST", "/api/v1/admin/data-labels"),
                ("PATCH", "/api/v1/admin/data-labels/definition%2F1"),
                ("POST", "/api/v1/admin/data-labels/definition%2F1/disable"),
                ("POST", "/api/v1/admin/data-labels/definition%2F1/values"),
                ("PATCH", "/api/v1/admin/data-label-values/value%2F1"),
                ("POST", "/api/v1/admin/data-label-values/value%2F1/disable"),
                ("GET", "/api/v1/admin/data-labels/usage"),
                ("GET", "/api/v1/admin/data-label-assignments"),
                ("PUT", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"),
                ("DELETE", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"),
                ("PUT", "/api/v1/admin/event-schemas/schema%2F1/field-data-labels"),
                ("DELETE", "/api/v1/admin/data-label-assignments/schema-fields/assignment%2F1"),
            ],
            [(method, path) for method, path, _ in transport.calls],
        )


if __name__ == "__main__":
    unittest.main()
