"""Tiny stdlib web server: serves web/index.html and a JSON cube API."""
import json
import os
import random
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .constants import DEFAULT_PARITY, PARITY_ALGS
from .cube import apply_alg, random_scramble, solved_state
from .render import facelets
from .solver import format_solution, pair_up, solve, verify

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")


def build_payload(scramble=None, seed=None, parity=DEFAULT_PARITY):
    """Everything the page needs for one scramble.  Raises ValueError on bad input."""
    if parity not in PARITY_ALGS:
        raise ValueError(f"parity must be one of {sorted(PARITY_ALGS)}")
    if not scramble or not scramble.strip():
        scramble = random_scramble(rng=random.Random(seed))
    scramble = " ".join(scramble.split())
    state = apply_alg(solved_state(), scramble)
    solution = solve(state, parity_number=parity)
    return {
        "scramble": scramble,
        "facelets": facelets(state),
        "edge_memo": pair_up(solution.edge_memo),
        "corner_memo": pair_up(solution.corner_memo),
        "solution": format_solution(solution),
        "verified": verify(scramble, solution),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, content_type):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path in ("/", "/index.html"):
            with open(os.path.join(WEB_DIR, "index.html"), "rb") as f:
                self._send(200, f.read(), "text/html; charset=utf-8")
        elif url.path == "/api/cube":
            q = parse_qs(url.query)
            try:
                seed = int(q["seed"][0]) if q.get("seed") and q["seed"][0] else None
                payload = build_payload(q.get("scramble", [None])[0], seed,
                                        int(q.get("parity", [DEFAULT_PARITY])[0]))
            except (ValueError, KeyError) as e:
                self._send(400, json.dumps({"error": str(e)}), "application/json")
                return
            self._send(200, json.dumps(payload), "application/json")
        else:
            self._send(404, "not found", "text/plain")

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
