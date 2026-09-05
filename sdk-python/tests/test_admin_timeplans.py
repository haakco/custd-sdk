import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from custd import CustdClient
from custd.admin_timeplans import (
    TimePlanAnnotationInput,
    TimePlanAnnotationSchema,
    TimePlanCommandRequest,
    TimePlanDefinition,
    TimePlanRedactionRequest,
    TimePlanRunRequest,
    TimePlanThresholdCue,
    _body,
)


class Transport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, method, url, payload, headers, timeout):
        self.calls.append((method, url, payload))
        return self.responses.pop(0)


class TimePlanAdminClientTest(unittest.TestCase):
    def test_correction_request_uses_transition_uuid(self):
        payload = _body(
            TimePlanCommandRequest(
                "command-1", "correction-1", 1, "append_correction", supersedesTransitionUuid="transition-1"
            )
        )

        self.assertEqual("transition-1", payload["supersedesTransitionUuid"])
        self.assertNotIn("supersedesTransitionId", payload)

    def test_request_dtos_omit_unset_optional_timestamps(self):
        run_payload = _body(TimePlanRunRequest(planUuid="plan-1"))
        command_payload = _body(TimePlanCommandRequest("command-1", "retry-1", 0, "start_run"))
        annotation_payload = _body(TimePlanAnnotationInput(type="note", text="hello"))

        self.assertEqual({"planUuid": "plan-1"}, run_payload)
        self.assertNotIn("clientOccurredAt", command_payload)
        self.assertNotIn("boundaryEndsAt", command_payload)
        self.assertNotIn("scheduledStartsAt", command_payload)
        self.assertNotIn("scheduledEndsAt", command_payload)
        self.assertNotIn("dueDate", annotation_payload)

    def test_list_rejects_legacy_bare_array_response(self):
        transport = Transport([{"status": 200, "body": [{"uuid": "plan-1"}]}])
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        with self.assertRaises(ValueError):
            client.admin.time_plans.list("acme")

    def test_definition_uses_typed_annotation_schema_and_threshold_cues(self):
        definition = TimePlanDefinition(
            horizonMs=60000,
            redistributionMode="proportional_current",
            autoAdvance=False,
            annotationSchema=TimePlanAnnotationSchema(allowedTypes=["note"], fields=["text"]),
            thresholdCues=[TimePlanThresholdCue(remainingMs=5000, severity="warning")],
            blocks=[],
        )

        self.assertEqual(
            {
                "horizonMs": 60000,
                "redistributionMode": "proportional_current",
                "autoAdvance": False,
                "annotationSchema": {"allowedTypes": ["note"], "fields": ["text"]},
                "thresholdCues": [{"remainingMs": 5000, "severity": "warning"}],
                "blocks": [],
            },
            _body(definition),
        )

    def test_threshold_cue_validation_rejects_untyped_or_ambiguous_values(self):
        with self.assertRaises(ValueError):
            TimePlanThresholdCue(remainingMs=5000, remainingFractionBps=100, severity="warning")
        with self.assertRaises(ValueError):
            TimePlanAnnotationSchema(allowedTypes=["unsupported"])
        with self.assertRaises(ValueError):
            TimePlanDefinition(
                horizonMs=60000,
                thresholdCues=[
                    TimePlanThresholdCue(remainingMs=5000, severity="warning"),
                    TimePlanThresholdCue(remainingMs=5000, severity="critical"),
                ],
            )
        with self.assertRaises(ValueError):
            TimePlanDefinition(
                horizonMs=60000,
                thresholdCues=[TimePlanThresholdCue(remainingMs=value, severity="warning") for value in range(17)],
            )

    def test_lifecycle_history_and_annotation_routes_are_tenant_scoped(self):
        transport = Transport(
            [
                {
                    "status": 200,
                    "body": {
                        "plans": [
                            {
                                "uuid": "plan-1",
                                "planKey": "focus",
                                "name": "Focus",
                                "description": "",
                                "status": "ready",
                                "draftRevision": 1,
                                "definition": {
                                    "horizonMs": 60000,
                                    "redistributionMode": "proportional_current",
                                    "autoAdvance": False,
                                    "blocks": [],
                                },
                                "updatedAt": "2026-09-02T12:00:00Z",
                            }
                        ],
                    },
                },
                {
                    "status": 200,
                    "body": {
                        "transitions": [
                            {
                                "uuid": "transition-1",
                                "runUuid": "run-1",
                                "streamVersion": 1,
                                "commandId": "command-1",
                                "type": "start_run",
                                "actorKind": "human",
                                "actorRef": "user-1",
                                "serverReceivedAt": "2026-09-02T12:00:00Z",
                                "currentStatus": "running",
                                "allocatorVersion": "largest-remainder.v1",
                                "schemaVersion": "time-plan.transition.v1",
                                "receipt": {
                                    "allocatorVersion": "",
                                    "reason": "",
                                    "summary": "",
                                    "source": [],
                                    "result": [],
                                    "changes": [],
                                },
                            }
                        ]
                    },
                },
                {
                    "status": 201,
                    "body": {
                        "uuid": "annotation-1",
                        "runUuid": "run-1",
                        "type": "note",
                        "recordedAt": "2026-09-02T12:00:00Z",
                        "actorKind": "human",
                        "actorRef": "user-1",
                    },
                },
                {"status": 204, "body": None},
            ]
        )
        client = CustdClient(base_url="http://localhost:8080", token="admin-token", admin_transport=transport)

        plans = client.admin.time_plans.list("acme", 25)
        history = client.admin.time_plans.history("acme", "run-1", 10)
        annotation = client.admin.time_plans.create_annotation(
            "acme", "run-1", TimePlanAnnotationInput(type="note", text="hello")
        )
        client.admin.time_plans.redact_annotation(
            "acme", "run-1", "annotation-1", TimePlanRedactionRequest("privacy request")
        )

        self.assertEqual("plan-1", plans.plans[0].uuid)
        self.assertEqual("start_run", history.transitions[0].type)
        self.assertEqual("annotation-1", annotation.uuid)
        self.assertEqual(
            [
                ("GET", "http://localhost:8080/api/v1/admin/time-plans?companySlug=acme&limit=25"),
                ("GET", "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/history?companySlug=acme&limit=10"),
                ("POST", "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations?companySlug=acme"),
                (
                    "POST",
                    "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations/annotation-1/redact?companySlug=acme",
                ),
            ],
            [(call[0], call[1]) for call in transport.calls],
        )
