"""Tiny stdlib web server: the JSON cube API (bld/api.py) and the built web app (web/dist).

Build the app once with ``npm run build`` in web/; during development run ``npm run dev``
there instead, which serves the app with hot reload and forwards /api here.
"""
import json
import mimetypes
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

from .api import API

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT, "web", "dist")

NOT_BUILT = (b"<!doctype html><meta charset=utf-8><title>Blindfold Trainer</title>"
             b"<p>The web app is not built yet: run <code>npm install && npm run build</code> in web/.")


# Client-side routes of the web app: each one is answered with index.html.
APP_ROUTES = ("/solve", "/letter-drill", "/algorithms", "/pairs")


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
    def _send(self, code, body, content_type, cache=None):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if cache:
            self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, code, obj):
        self._send(code, json.dumps(obj), "application/json")

    def do_GET(self):
        url = urlparse(self.path)
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
        self._send_static(url.path)

    def _send_static(self, url_path):
        path = static_file(url_path)
        if path is None:
            if not os.path.isfile(os.path.join(DIST_DIR, "index.html")):
                self._send(503, NOT_BUILT, "text/html; charset=utf-8")
            else:
                self._send(404, "not found", "text/plain")
            return
        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in ("application/javascript", "image/svg+xml"):
            content_type += "; charset=utf-8"
        # Vite puts a content hash in every asset name, so those never change; the page must not be cached.
        cache = "public, max-age=31536000, immutable" if "/assets/" in path else "no-cache"
        with open(path, "rb") as f:
            self._send(200, f.read(), content_type, cache)

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
