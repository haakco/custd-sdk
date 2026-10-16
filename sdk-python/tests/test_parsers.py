import json
import unittest
from typing import Any

from custd import CustdClient


class FakeTransport:
    def __init__(self, body: Any, status: int = 200):
        self.body = body
        self.status = status
        self.calls: list[tuple[str, str, dict[str, Any] | None, dict[str, str], float]] = []

    def __call__(
        self,
        method: str,
        url: str,
        body: dict[str, Any] | None,
        headers: dict[str, str],
        timeout: float,
    ) -> dict[str, Any]:
        self.calls.append((method, url, body, headers, timeout))
        return {"status": self.status, "body": json.dumps(self.body)}


PARSER: dict[str, Any] = {
    "uuid": "11111111-1111-1111-1111-111111111111",
    "code": "nginx-combined",
    "name": "Nginx combined",
    "parserType": "regex",
    "pattern": "^\\S+",
    "timestampFormat": "2006-01-02T15:04:05Z07:00",
    "fieldMapping": {"client_ip": "context.ip"},
    "generatedFields": None,
    "enabled": True,
    "revision": 3,
}

PRESET: dict[str, Any] = {
    "code": "apache-combined",
    "name": "Apache combined",
    "family": "apache",
    "description": "Access log",
    "parserType": "regex",
    "pattern": "^\\S+",
    "timestampFormat": "2006-01-02T15:04:05Z07:00",
    "fieldMapping": {"client_ip": "context.ip"},
    "sample": "127.0.0.1 - -",
    "variants": ["combined"],
}

PREVIEW: dict[str, Any] = {
    "results": [
        {"line": 1, "ok": True, "eventTypeSlug": "access", "payload": {"status": 200}},
        {"line": 2, "ok": False, "error": "no match found"},
    ],
    "parsed": 1,
    "failed": 1,
}


def make_client(transport: FakeTransport) -> CustdClient:
    return CustdClient(base_url="http://localhost:8080", token="token", admin_transport=transport)


class ParserClientTest(unittest.TestCase):
    def test_list_presets_uses_the_schema_registry_route(self) -> None:
        transport = FakeTransport({"presets": [PRESET]})
        preset_list = make_client(transport).parsers.list_presets()

        self.assertEqual(transport.calls[0][1], "http://localhost:8080/api/v1/parsers/presets")
        self.assertEqual(preset_list["presets"][0]["code"], "apache-combined")
        self.assertEqual(preset_list["presets"][0]["variants"], ["combined"])

    def test_list_wraps_the_bare_array_response(self) -> None:
        transport = FakeTransport([PARSER])
        parser_list = make_client(transport).parsers.list()

        self.assertEqual(transport.calls[0][1], "http://localhost:8080/api/v1/parsers")
        self.assertEqual(parser_list["parsers"][0]["code"], "nginx-combined")
        # Newer optional fields carry the server's value when present.
        self.assertIs(parser_list["parsers"][0]["enabled"], True)
        self.assertEqual(parser_list["parsers"][0]["revision"], 3)

    def test_list_rejects_a_non_array_response(self) -> None:
        transport = FakeTransport({"parsers": [PARSER]})
        with self.assertRaises(ValueError):
            make_client(transport).parsers.list()

    def test_create_omits_an_unset_enabled(self) -> None:
        transport = FakeTransport(PARSER, status=201)
        make_client(transport).parsers.create(
            {
                "code": "nginx-combined",
                "name": "Nginx combined",
                "parserType": "regex",
                "pattern": "^\\S+",
                "timestampFormat": "2006-01-02T15:04:05Z07:00",
                "fieldMapping": {"client_ip": "context.ip"},
            }
        )

        method, url, body, _, _ = transport.calls[0]
        self.assertEqual((method, url), ("POST", "http://localhost:8080/api/v1/parsers"))
        assert body is not None
        self.assertNotIn("enabled", body)
        self.assertEqual(body["code"], "nginx-combined")

    def test_update_and_delete_address_the_explicit_uuid(self) -> None:
        uuid = "11111111-1111-1111-1111-111111111111"

        update_transport = FakeTransport(PARSER)
        make_client(update_transport).parsers.update(
            uuid,
            {
                "code": "nginx-combined",
                "name": "Nginx combined",
                "parserType": "regex",
                "pattern": "^\\S+",
                "timestampFormat": "2006-01-02T15:04:05Z07:00",
                "fieldMapping": {},
                "enabled": False,
            },
        )
        method, url, body, _, _ = update_transport.calls[0]
        self.assertEqual((method, url), ("PUT", f"http://localhost:8080/api/v1/parsers/{uuid}"))
        assert body is not None
        self.assertIs(body["enabled"], False)

        delete_transport = FakeTransport({"deleted": True})
        deleted = make_client(delete_transport).parsers.delete(uuid)
        self.assertEqual(
            (delete_transport.calls[0][0], delete_transport.calls[0][1]),
            ("DELETE", f"http://localhost:8080/api/v1/parsers/{uuid}"),
        )
        self.assertIs(deleted["deleted"], True)

    def test_preview_posts_the_bounded_request_without_enabled(self) -> None:
        transport = FakeTransport(PREVIEW)
        result = make_client(transport).parsers.preview(
            {
                "parser": {
                    "code": "nginx-combined",
                    "name": "Nginx combined",
                    "parserType": "regex",
                    "pattern": "^\\S+",
                    "timestampFormat": "2006-01-02T15:04:05Z07:00",
                    "fieldMapping": {"client_ip": "context.ip"},
                },
                "sample": "127.0.0.1",
                "maxLines": 20,
            }
        )

        method, url, body, _, _ = transport.calls[0]
        self.assertEqual((method, url), ("POST", "http://localhost:8080/api/v1/parser-preview"))
        assert body is not None
        self.assertNotIn("enabled", body["parser"])
        self.assertEqual(body["maxLines"], 20)
        self.assertEqual(result["parsed"], 1)
        self.assertEqual(result["failed"], 1)
        self.assertEqual(result["results"][1]["error"], "no match found")


class ParserFramingTest(unittest.TestCase):
    def test_create_carries_the_revision_pinned_framing(self) -> None:
        transport = FakeTransport(
            {**PARSER, "framing": {"type": "docker-json", "maxRecordBytes": 262144, "maxLines": 200}}
        )
        parser = make_client(transport).parsers.create(
            {
                "code": "docker",
                "name": "Docker",
                "parserType": "json",
                "pattern": None,
                "timestampFormat": "2006-01-02T15:04:05Z07:00",
                "fieldMapping": {},
                "framing": {"type": "docker-json", "maxRecordBytes": 262144, "maxLines": 200},
            }
        )

        body = transport.calls[0][2]
        assert body is not None
        self.assertEqual(body["framing"], {"type": "docker-json", "maxRecordBytes": 262144, "maxLines": 200})
        self.assertEqual(parser["framing"], {"type": "docker-json", "maxRecordBytes": 262144, "maxLines": 200})

    def test_preview_carries_the_same_framing_without_enabled(self) -> None:
        transport = FakeTransport(PREVIEW)
        make_client(transport).parsers.preview(
            {
                "parser": {
                    "code": "php",
                    "name": "PHP",
                    "parserType": "regex",
                    "pattern": "^\\S+",
                    "timestampFormat": "2006-01-02T15:04:05Z07:00",
                    "fieldMapping": {},
                    "framing": {"type": "php-multiline", "maxLines": 200},
                },
                "sample": "line",
                "maxLines": 20,
            }
        )

        body = transport.calls[0][2]
        assert body is not None
        self.assertEqual(body["parser"]["framing"], {"type": "php-multiline", "maxLines": 200})
        self.assertNotIn("enabled", body["parser"])

    def test_rejects_an_unsupported_framing_type_before_sending(self) -> None:
        transport = FakeTransport(PARSER, status=201)
        with self.assertRaises(ValueError):
            make_client(transport).parsers.create(
                {
                    "code": "x",
                    "name": "x",
                    "parserType": "json",
                    "pattern": None,
                    "timestampFormat": "t",
                    "fieldMapping": {},
                    "framing": {"type": "idle"},
                }
            )
        self.assertEqual([], transport.calls)


class ParserFramingOutcomeTest(unittest.TestCase):
    def test_preview_decodes_the_framing_outcome(self) -> None:
        transport = FakeTransport(
            {
                "results": [
                    {"line": 1, "ok": True, "framing": "complete", "payload": {}},
                    {"line": 2, "ok": False, "framing": "oversize", "error": "record exceeds the framing bound"},
                ],
                "parsed": 1,
                "failed": 1,
            }
        )
        result = make_client(transport).parsers.preview(
            {
                "parser": {
                    "code": "php",
                    "name": "PHP",
                    "parserType": "regex",
                    "pattern": "^\\S+",
                    "timestampFormat": "2006-01-02T15:04:05Z07:00",
                    "fieldMapping": {},
                    "framing": {"type": "php-multiline"},
                },
                "sample": "line",
                "maxLines": 5,
            }
        )
        self.assertEqual(result["results"][0]["framing"], "complete")
        self.assertEqual(result["results"][1]["framing"], "oversize")

    def test_rejects_out_of_range_framing_bounds(self) -> None:
        from custd.parsers import MAX_PARSER_FRAMING_LINES, MAX_PARSER_FRAMING_RECORD_BYTES

        cases = [
            {"type": "docker-json", "maxRecordBytes": -1},
            {"type": "docker-json", "maxRecordBytes": MAX_PARSER_FRAMING_RECORD_BYTES + 1},
            {"type": "php-multiline", "maxLines": -1},
            {"type": "php-multiline", "maxLines": MAX_PARSER_FRAMING_LINES + 1},
        ]
        for framing in cases:
            transport = FakeTransport(PARSER, status=201)
            with self.assertRaises(ValueError):
                make_client(transport).parsers.create(
                    {
                        "code": "x",
                        "name": "x",
                        "parserType": "json",
                        "pattern": None,
                        "timestampFormat": "t",
                        "fieldMapping": {},
                        "framing": framing,
                    }
                )
            self.assertEqual([], transport.calls)


if __name__ == "__main__":
    unittest.main()
