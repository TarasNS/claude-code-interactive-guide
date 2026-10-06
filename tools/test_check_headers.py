#!/usr/bin/env python3
"""Offline tests for tools/check-headers.py. Run: python tools/test_check_headers.py"""

import http.server
import importlib.util
import threading
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("check_headers", Path(__file__).resolve().parent / "check-headers.py")
ch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ch)

GOOD = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


def without(key):
    return {k: v for k, v in GOOD.items() if k != key}


class PureChecks(unittest.TestCase):
    def test_good_headers_pass(self):
        self.assertEqual(ch.check(GOOD), [])

    def test_header_names_are_case_insensitive(self):
        self.assertEqual(ch.check({k.lower(): v for k, v in GOOD.items()}), [])

    def test_each_missing_header_is_reported(self):
        for key in GOOD:
            problems = ch.check(without(key))
            self.assertTrue(problems, key + " should be reported")
            self.assertTrue(any(key.split("-")[0].lower() in p.lower() for p in problems), key)

    def test_hsts_needs_a_year_and_subdomains(self):
        short = dict(GOOD, **{"Strict-Transport-Security": "max-age=100; includeSubDomains"})
        self.assertTrue(any("max-age" in p for p in ch.check(short)))
        nosub = dict(GOOD, **{"Strict-Transport-Security": "max-age=31536000"})
        self.assertTrue(any("includeSubDomains" in p for p in ch.check(nosub)))

    def test_csp_must_hold_every_directive_and_forbid_unsafe(self):
        weak = dict(GOOD, **{"Content-Security-Policy": "default-src 'none'; script-src 'self'"})
        self.assertGreaterEqual(len(ch.check(weak)), 5)
        unsafe = dict(GOOD, **{"Content-Security-Policy": GOOD["Content-Security-Policy"] + "; script-src 'unsafe-inline'"})
        self.assertTrue(any("unsafe" in p for p in ch.check(unsafe)))

    def test_nosniff_and_referrer_values(self):
        self.assertTrue(ch.check(dict(GOOD, **{"X-Content-Type-Options": "sniff"})))
        self.assertTrue(ch.check(dict(GOOD, **{"Referrer-Policy": "origin"})))

    def test_permissions_policy_must_deny_all_three(self):
        partial = dict(GOOD, **{"Permissions-Policy": "camera=(), microphone=()"})
        self.assertTrue(any("geolocation" in p for p in ch.check(partial)))
        allowed = dict(GOOD, **{"Permissions-Policy": "camera=(self), microphone=(), geolocation=()"})
        self.assertTrue(any("camera" in p for p in ch.check(allowed)))

    def test_hsts_is_skipped_over_plain_http(self):
        self.assertEqual(ch.check(without("Strict-Transport-Security"), "http"), [])


mk_spec = importlib.util.spec_from_file_location("make_header_config", Path(__file__).resolve().parent / "make-header-config.py")
mk = importlib.util.module_from_spec(mk_spec)
mk_spec.loader.exec_module(mk)


class SinglePolicy(unittest.TestCase):
    def test_the_policy_file_passes_the_checker(self):
        self.assertEqual(ch.check(mk.POLICY), [])

    def test_the_policy_file_matches_the_test_fixture(self):
        self.assertEqual(mk.POLICY, GOOD)

    def test_every_format_carries_every_header_and_value(self):
        for fmt in ("nginx", "netlify", "azure-swa", "json"):
            out = mk.render(fmt)
            for name, value in mk.POLICY.items():
                self.assertIn(name, out, fmt)
                self.assertIn(value.replace('"', '\\"') if fmt == "nginx" else value.replace('"', '\\"') if fmt in ("azure-swa", "json") else value, out, fmt + " " + name)

    def test_azure_and_json_output_parse_back_to_the_policy(self):
        import json
        self.assertEqual(json.loads(mk.render("azure-swa"))["globalHeaders"], mk.POLICY)
        self.assertEqual(json.loads(mk.render("json")), mk.POLICY)

    def test_unknown_format_is_rejected(self):
        with self.assertRaises(ValueError):
            mk.render("apache")
        self.assertEqual(mk.main(["x", "apache"]), 2)


class Handler(http.server.BaseHTTPRequestHandler):
    headers_to_send = GOOD

    def do_GET(self):
        self.send_response(200)
        for k, v in self.headers_to_send.items():
            self.send_header(k, v)
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *args):
        pass


class Served(unittest.TestCase):
    def serve(self, headers):
        handler = type("H", (Handler,), {"headers_to_send": headers})
        server = http.server.HTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.shutdown)
        return "http://127.0.0.1:%d/" % server.server_address[1]

    def test_cli_passes_good_headers_and_fails_bad_ones(self):
        self.assertEqual(ch.main(["x", self.serve(GOOD), "--allow-http"]), 0)
        self.assertEqual(ch.main(["x", self.serve(without("Content-Security-Policy")), "--allow-http"]), 1)

    def test_cli_refuses_plain_http_by_default(self):
        self.assertEqual(ch.main(["x", self.serve(GOOD)]), 1)

    def test_cli_rejects_other_schemes_and_missing_url(self):
        self.assertEqual(ch.main(["x", "ftp://example.com/"]), 2)
        self.assertEqual(ch.main(["x"]), 2)


if __name__ == "__main__":
    unittest.main(verbosity=1)
