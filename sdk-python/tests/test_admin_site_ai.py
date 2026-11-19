"""Replay Site Insights AI billing and settings against the shared wire fixtures."""

import unittest

from test_admin_site_insights_operations import API, fixture, site_domains

AI = fixture("site-ai.json")


class SiteAITest(unittest.TestCase):
    def test_policy_and_consent(self) -> None:
        domains, transport = site_domains(200, AI["settings"])
        settings = domains.get_ai_settings()
        self.assertTrue(settings["keyRefused"])
        self.assertNotIn("apiKey", settings)

        domains.set_ai_settings({"aiMode": "own-key", "monthlyCapUsdMicros": 10_000_000, "apiKey": "test-only-key"})
        domains.set_ai_settings({"aiMode": "own-key", "monthlyCapUsdMicros": 10_000_000})
        domains.set_ai_consent({"action": "grant", "termsVersion": "terms-v1"})
        transport.body = AI["revoked"]
        revoked = domains.set_ai_consent({"action": "revoke"})
        self.assertFalse(revoked["keyConfigured"])
        self.assertNotIn("keyRefused", revoked)
        path = API + "/site-domains/ai-settings"
        self.assertEqual([
            ("GET", path, None),
            ("PUT", path, {"aiMode": "own-key", "monthlyCapUsdMicros": 10_000_000, "apiKey": "test-only-key"}),
            ("PUT", path, {"aiMode": "own-key", "monthlyCapUsdMicros": 10_000_000}),
            ("PUT", path + "/consent", {"action": "grant", "termsVersion": "terms-v1"}),
            ("PUT", path + "/consent", {"action": "revoke"}),
        ], transport.calls)

    def test_usage_preserves_billing_window_and_optional_attribution(self) -> None:
        domains, transport = site_domains(200, AI["tenantUsage"])
        usage = domains.get_ai_usage()
        self.assertNotIn("samplingProduct", usage["rows"][0])
        transport.body = AI["platformUsage"]
        platform = domains.get_platform_ai_usage("previous-month")
        self.assertEqual("previous-month", platform["period"])
        self.assertEqual(10_000_000, platform["samplingMonthlyCapUsdMicros"])
        row = platform["rows"][0]
        self.assertEqual("hosting", row["samplingProduct"])
        self.assertEqual((13, 27, 61), (
            row["confirmedCostUsdMicros"], row["estimatedCostUsdMicros"], row["capAccountedUsdMicros"],
        ))
        domains.get_platform_ai_usage()
        self.assertEqual([
            ("GET", API + "/site-domains/ai-usage", None),
            ("GET", API + "/admin/site-insights/ai-usage?period=previous-month", None),
            ("GET", API + "/admin/site-insights/ai-usage", None),
        ], transport.calls)
