import gzip
import http.client
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

from urllib.parse import urlparse

from bld import pairs, seo, server


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


class Seo(unittest.TestCase):
    PAGE = ('<!doctype html><html><head><meta charset="utf-8"><title>Blindfold Trainer</title></head>'
            '<body><div id="root"></div><script src="/x.js"></script></body></html>')

    def test_every_route_has_a_page(self):
        self.assertEqual({"/"} | set(server.APP_ROUTES), set(seo.PAGES))

    def test_head_is_page_specific(self):
        for route, (title, description) in seo.PAGES.items():
            page = seo.render_index(self.PAGE, route)
            self.assertEqual(page.count("<title>"), 1, route)
            self.assertIn(f"<title>{title}</title>", page)
            self.assertIn(f'<link rel="canonical" href="{seo.absolute(route)}">', page)
            self.assertIn(f'<meta property="og:url" content="{seo.absolute(route)}">', page)
            self.assertIn(f'<meta name="description" content="{description}">', page)
            self.assertLessEqual(len(title), 62, route)
            self.assertLessEqual(len(description), 170, route)

    def test_social_preview_tags(self):
        page = seo.render_index(self.PAGE, "/solve")
        for tag in ('property="og:image" content="https://', 'property="og:image:width" content="1200"',
                    'property="og:image:height" content="630"', 'name="twitter:card" content="summary_large_image"',
                    'name="twitter:image" content="https://', 'property="og:image:alt"'):
            self.assertIn(tag, page)
        self.assertTrue(seo.SITE_URL.startswith("https://"))

    def test_structured_data_is_valid_json(self):
        for route in seo.PAGES:
            page = seo.render_index(self.PAGE, route)
            blob = page.split('<script type="application/ld+json">')[1].split("</script>")[0]
            self.assertEqual(json.loads(blob)["@context"], "https://schema.org")

    def test_unknown_path_falls_back_to_home_and_body_gets_a_fallback(self):
        page = seo.render_index(self.PAGE, "/index.html")
        self.assertIn(f'href="{seo.SITE_URL}/"', page)
        self.assertIn("<noscript>", page)
        self.assertLess(page.index('<div id="root"></div>'), page.index("<noscript>"))

    def test_text_is_escaped(self):
        saved = seo.PAGES["/"]
        seo.PAGES["/"] = ('Tom & "Jerry" <b>', 'say "hi" </script><script>alert(1)')
        try:
            page = seo.render_index(self.PAGE, "/")
        finally:
            seo.PAGES["/"] = saved
        self.assertIn("<title>Tom &amp; &quot;Jerry&quot; &lt;b&gt;</title>", page)
        self.assertNotIn("</script><script>alert(1)", page)
        self.assertEqual(page.count("<script"), 2)       # the page's own script and the structured data

    def test_sitemap_lastmod_and_verification(self):
        self.assertIn("<lastmod>2026-11-27</lastmod>", seo.sitemap_xml("2026-11-27"))
        self.assertNotIn("lastmod", seo.sitemap_xml())
        saved = seo.GOOGLE_VERIFICATION
        seo.GOOGLE_VERIFICATION = 'abc"def'
        try:
            home, other = seo.render_index(self.PAGE, "/"), seo.render_index(self.PAGE, "/solve")
        finally:
            seo.GOOGLE_VERIFICATION = saved
        self.assertIn('<meta name="google-site-verification" content="abc&quot;def">', home)
        self.assertNotIn("google-site-verification", other)
        self.assertNotIn("google-site-verification", seo.render_index(self.PAGE, "/"))

    def test_robots_and_sitemap(self):
        self.assertIn(f"Sitemap: {seo.SITE_URL}/sitemap.xml", seo.robots_txt())
        self.assertIn("Disallow: /api/", seo.robots_txt())
        xml = seo.sitemap_xml()
        for route in seo.PAGES:
            self.assertIn(f"<loc>{seo.absolute(route)}</loc>", xml)

    def test_the_preview_image_exists(self):
        path = os.path.join(server.ROOT, "web", "public", "og.png")
        with open(path, "rb") as f:
            head = f.read(24)
        self.assertEqual(head[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual((int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")), seo.OG_IMAGE_SIZE)


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

    def test_head_requests(self):
        for path in ("/", "/tutorial", "/api/algs", "/robots.txt"):
            req = urllib.request.Request(self.base + path, method="HEAD")
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    status, body, length = r.status, r.read(), r.headers["Content-Length"]
            except urllib.error.HTTPError as e:     # an unbuilt app answers 503, still without a body
                with e:
                    status, body, length = e.code, e.read(), e.headers["Content-Length"]
            self.assertIn(status, (200, 503), path)
            self.assertEqual(body, b"", path)
            self.assertTrue(length and int(length) > 0, path)

    def raw(self, path, headers=None, method="GET"):
        """A response without following redirects: (status, headers, body)."""
        conn = http.client.HTTPConnection(*self.httpd.server_address)
        try:
            conn.request(method, path, headers=headers or {})
            r = conn.getresponse()
            return r.status, r, r.read()
        finally:
            conn.close()

    def test_one_address_per_page(self):
        site = urlparse(seo.SITE_URL)
        status, r, _ = self.raw("/solve?s=90a", {"Host": "www." + site.hostname})
        self.assertEqual((status, r.getheader("Location")), (301, f"{seo.SITE_URL}/solve?s=90a"))
        status, r, _ = self.raw("/tutorial/")
        self.assertEqual((status, r.getheader("Location")), (301, "/tutorial"))
        status, r, _ = self.raw("/index.html")
        self.assertEqual((status, r.getheader("Location")), (301, "/"))
        self.assertEqual(self.raw("/")[0] in (200, 503), True)           # no redirect loop
        self.assertEqual(self.raw("/tutorial", {"Host": site.hostname})[0] in (200, 503), True)

    def test_unknown_page_is_a_real_404(self):
        status, r, body = self.raw("/no-such-page")
        if os.path.isfile(os.path.join(server.DIST_DIR, "index.html")):
            self.assertEqual(status, 404)
            self.assertIn(b"noindex", body)
            self.assertIn(b'href="/"', body)
        status, r, body = self.raw("/missing.js")
        self.assertIn(status, (404, 503))

    def test_text_is_gzipped_when_asked(self):
        status, r, body = self.raw("/sitemap.xml", {"Accept-Encoding": "gzip"})
        self.assertEqual(status, 200)
        self.assertEqual(r.getheader("Vary"), None)               # small: not worth compressing
        status, r, body = self.raw("/api/algs", {"Accept-Encoding": "gzip"})
        self.assertEqual((r.getheader("Content-Encoding"), r.getheader("Vary")), ("gzip", "Accept-Encoding"))
        self.assertEqual(len(json.loads(gzip.decompress(body))["edges"]), 24)
        status, r, body = self.raw("/api/algs")                   # a client that does not ask gets plain JSON
        self.assertEqual((r.getheader("Content-Encoding"), len(json.loads(body)["edges"])), (None, 24))

    def test_robots_and_sitemap_endpoints(self):
        status, headers, body = self.get("/robots.txt")
        self.assertEqual((status, headers["Content-Type"].split(";")[0]), (200, "text/plain"))
        self.assertIn(b"Sitemap:", body)
        status, headers, body = self.get("/sitemap.xml")
        self.assertEqual((status, headers["Content-Type"].split(";")[0]), (200, "application/xml"))
        self.assertIn(b"<urlset", body)

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
