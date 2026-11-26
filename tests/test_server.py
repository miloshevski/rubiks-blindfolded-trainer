import json
import os
import shutil
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bld import pairs, server


class StaticFiles(unittest.TestCase):
    def test_cannot_leave_dist(self):
        for path in ("/../bld/server.py", "/..%2Fbld%2Fserver.py", "/%2e%2e/RUBIKS_SKILL.md", "/../../etc/passwd"):
            self.assertIsNone(server.static_file(path), path)

    def test_app_routes_serve_index(self):
        index = server.static_file("/")
        for path in server.APP_ROUTES:
            self.assertEqual(server.static_file(path), index, path)
            self.assertEqual(server.static_file(path + "/"), index, path)

    def test_missing_file(self):
        self.assertIsNone(server.static_file("/no-such-file.js"))


class Http(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def get(self, path):
        try:
            with urllib.request.urlopen(self.base + path, timeout=10) as r:
                return r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            with e:     # the error holds the open response: close it
                return e.code, e.headers, e.read()

    def test_api(self):
        status, headers, body = self.get("/api/algs")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(len(json.loads(body)["edges"]), 24)

    def test_api_errors(self):
        status, _, body = self.get("/api/cube?scramble=X+Y")
        self.assertEqual(status, 400)
        self.assertIn("error", json.loads(body))
        self.assertEqual(self.get("/api/nope")[0], 404)

    def post(self, path, body, content_type="application/json"):
        req = urllib.request.Request(self.base + path, data=body if isinstance(body, bytes) else json.dumps(body).encode(),
                                     headers={"Content-Type": content_type}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            with e:
                return e.code, json.loads(e.read())

    def test_edit_pair_word(self):
        # Work on a copy so the real dictionary is never touched.
        tmp = tempfile.mkdtemp()
        copy = os.path.join(tmp, "letter-pairs.json")
        shutil.copy(pairs.PAIRS_FILE, copy)
        original, pairs.PAIRS_FILE = pairs.PAIRS_FILE, copy
        try:
            status, body = self.post("/api/pairs", {"pair": "AB", "word": "  Big   Abacus "})
            self.assertEqual((status, body), (200, {"pair": "AB", "word": "Big Abacus"}))
            status, _, raw = self.get("/api/pairs")
            words = json.loads(raw)
            self.assertEqual((status, words["AB"], len(words)), (200, "Big Abacus", 576))
            with open(copy, encoding="utf-8") as f:
                self.assertEqual(f.read(), json.dumps(words, indent=2, ensure_ascii=False))
            for bad in ({"pair": "ZZ", "word": "x"}, {"pair": "AB", "word": "  "}, {"pair": "AB", "word": "x" * 41}, [1]):
                self.assertEqual(self.post("/api/pairs", bad)[0], 400, bad)
            self.assertEqual(self.post("/api/pairs", b"{", )[0], 400)
            self.assertEqual(self.post("/api/pairs", {"pair": "AB", "word": "x"}, "text/plain")[0], 415)
            self.assertEqual(self.post("/api/nope", {})[0], 404)
        finally:
            pairs.PAIRS_FILE = original
            shutil.rmtree(tmp)

    def test_page(self):
        status, headers, _ = self.get("/")
        if not os.path.isfile(os.path.join(server.DIST_DIR, "index.html")):
            self.assertEqual(status, 503)       # not built: says how to build it
            return
        self.assertEqual(status, 200)
        self.assertTrue(headers["Content-Type"].startswith("text/html"))
        self.assertEqual(headers["Cache-Control"], "no-cache")


if __name__ == "__main__":
    unittest.main()
