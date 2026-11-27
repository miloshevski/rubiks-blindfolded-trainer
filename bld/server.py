"""Tiny stdlib web server: the JSON cube API (bld/api.py) and the built web app (web/dist).

Build the app once with ``npm run build`` in web/; during development run ``npm run dev``
there instead, which serves the app with hot reload and forwards /api here.
"""
import gzip
import json
import mimetypes
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse, urlunparse

from . import seo
from .api import API, POST_API

mimetypes.add_type("application/manifest+json", ".webmanifest")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT, "web", "dist")
INDEX_FILE = os.path.realpath(os.path.join(DIST_DIR, "index.html"))

NOT_FOUND = ("<!doctype html><html lang=en><head><meta charset=utf-8><title>Page not found | Blindfold Trainer</title>"
             '<meta name=viewport content="width=device-width, initial-scale=1"><meta name=robots content=noindex>'
             "<style>body{margin:0;background:#0c0d0e;color:#ece9e2;font:15px/1.6 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}"
             "a{color:#f2b33d}main{padding:24px;max-width:480px}</style></head><body><main><h1>Page not found</h1>"
             '<p>There is nothing at this address. <a href="/">Go to the Blindfold Trainer home page</a>.</p></main></body></html>')

# Text that is worth compressing; each compressed static file is kept until the file changes.
COMPRESSIBLE = ("text/", "application/javascript", "application/json", "application/manifest+json", "application/xml", "image/svg+xml")
_gzipped = {}

NOT_BUILT = (b"<!doctype html><meta charset=utf-8><title>Blindfold Trainer</title>"
             b"<p>The web app is not built yet: run <code>npm install && npm run build</code> in web/.")


# Client-side routes of the web app: each one is answered with index.html.
APP_ROUTES = ("/solve", "/letter-drill", "/algorithms", "/pairs", "/timer", "/tutorial")


def static_file(url_path):
    """Path of the built file for a URL path, or None.  Never leaves DIST_DIR."""
    rel = unquote(url_path).lstrip("/") or "index.html"
    if "/" + rel.rstrip("/") in APP_ROUTES:
        rel = "index.html"
    path = os.path.realpath(os.path.join(DIST_DIR, rel))
    if os.path.commonpath([path, os.path.realpath(DIST_DIR)]) != os.path.realpath(DIST_DIR):
        return None
    return path if os.path.isfile(path) else None


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, content_type, cache=None, stamp=None):
        """Sends a response, gzipped when the client accepts it.  ``stamp`` (e.g. a file's mtime)
        lets the compressed copy of a static file be kept until the file changes."""
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        compressible = len(data) > 1024 and content_type.startswith(COMPRESSIBLE)
        encoded = False
        if compressible and "gzip" in self.headers.get("Accept-Encoding", ""):
            key = (self.path, stamp)
            packed = _gzipped.get(key) if stamp is not None else None
            if packed is None:
                packed = gzip.compress(data, 6, mtime=0)
                if stamp is not None:
                    if len(_gzipped) > 64:
                        _gzipped.clear()
                    _gzipped[key] = packed
            data, encoded = packed, True
        self.send_response(code)
        if compressible:
            self.send_header("Vary", "Accept-Encoding")
        if encoded:
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if cache:
            self.send_header("Cache-Control", cache)
        self.end_headers()
        if self.command != "HEAD":          # HEAD gets the same headers, no body
            self.wfile.write(data)

    def _redirect(self, location):
        self.send_response(301)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _redirect_target(self, url):
        """Where a non-canonical address should go (one address per page: Google then indexes only that one), or None."""
        host = self.headers.get("Host", "").split(":")[0].lower()
        site = urlparse(seo.SITE_URL)
        if site.hostname and host == "www." + site.hostname:
            return urlunparse((site.scheme, site.netloc, url.path, "", url.query, ""))
        path = url.path
        if path == "/index.html":
            path = "/"
        elif len(path) > 1 and path.endswith("/") and "/" + path.strip("/") in seo.PAGES:
            path = path.rstrip("/")
        if path != url.path:
            return urlunparse(("", "", path, "", url.query, ""))
        return None

    def _send_json(self, code, obj):
        self._send(code, json.dumps(obj), "application/json")

    def do_GET(self):
        url = urlparse(self.path)
        target = self._redirect_target(url)
        if target:
            self._redirect(target)
            return
        endpoint = API.get(url.path)
        if endpoint is not None:
            query = parse_qs(url.query)
            try:
                payload = endpoint(lambda key, default="": query.get(key, [default])[0])
            except (ValueError, KeyError) as e:
                self._send_json(400, {"error": str(e)})
                return
            self._send_json(200, payload)
            return
        if url.path.startswith("/api/"):
            self._send_json(404, {"error": "unknown endpoint"})
            return
        if url.path == "/robots.txt":
            self._send(200, seo.robots_txt(), "text/plain; charset=utf-8", "public, max-age=3600")
            return
        if url.path == "/sitemap.xml":
            self._send(200, seo.sitemap_xml(self._last_built()), "application/xml; charset=utf-8", "public, max-age=3600")
            return
        self._send_static(url.path)

    def do_POST(self):
        endpoint = POST_API.get(urlparse(self.path).path)
        if endpoint is None:
            self._send_json(404, {"error": "unknown endpoint"})
            return
        # Only JSON: a web page on another site cannot send that to us without a CORS preflight.
        if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
            self._send_json(415, {"error": "send application/json"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if not 0 < length <= 10_000:
                raise ValueError("bad body size")
            self._send_json(200, endpoint(json.loads(self.rfile.read(length))))
        except (ValueError, KeyError) as e:     # JSONDecodeError is a ValueError
            self._send_json(400, {"error": str(e)})

    do_HEAD = do_GET    # link-preview and search crawlers often check with HEAD first

    def _send_static(self, url_path):
        path = static_file(url_path)
        if path is None:
            if not os.path.isfile(os.path.join(DIST_DIR, "index.html")):
                self._send(503, NOT_BUILT, "text/html; charset=utf-8")
            else:
                # an unknown page gets a real 404 with a way home (and noindex); a missing file just a plain one
                if "." in url_path.rsplit("/", 1)[-1]:
                    self._send(404, "not found", "text/plain")
                else:
                    self._send(404, NOT_FOUND, "text/html; charset=utf-8", "no-cache")
            return
        if path == INDEX_FILE:
            # every app page is this file; crawlers and link previews need its head to be page-specific
            with open(path, encoding="utf-8") as f:
                self._send(200, seo.render_index(f.read(), url_path), "text/html; charset=utf-8", "no-cache")
            return
        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in ("application/javascript", "image/svg+xml"):
            content_type += "; charset=utf-8"
        # Vite puts a content hash in every asset name, so those never change; the page must not be cached.
        cache = "public, max-age=31536000, immutable" if "/assets/" in path else "no-cache"
        with open(path, "rb") as f:
            self._send(200, f.read(), content_type, cache, stamp=os.path.getmtime(path))

    @staticmethod
    def _last_built():
        """UTC date the web app was last built (a page's last change, for the sitemap), or None."""
        try:
            return time.strftime("%Y-%m-%d", time.gmtime(os.path.getmtime(INDEX_FILE)))
        except OSError:
            return None

    def log_message(self, *args):
        pass


def run(port=8000):
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving on http://127.0.0.1:{port}  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
