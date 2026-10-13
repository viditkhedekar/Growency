"""Preview the static site locally with Vercel-style clean page URLs."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
PAGES = {
    "/" if path.name == "index.html" else "/" + path.relative_to(ROOT).with_suffix("").as_posix():
    "/" + path.relative_to(ROOT).as_posix()
    for path in [*ROOT.glob("*.html"), *ROOT.glob("compare/*.html")]
}
LEGACY_URLS = {file: route for route, file in PAGES.items()}
LEGACY_URLS["/index"] = "/"


class PreviewHandler(SimpleHTTPRequestHandler):
    def serve_page(self, head=False):
        request = urlsplit(self.path)
        canonical = LEGACY_URLS.get(request.path)
        if canonical is None and request.path != "/" and request.path.endswith("/"):
            if request.path.rstrip("/") in PAGES:
                canonical = request.path.rstrip("/")
        if canonical is not None:
            location = canonical + ("?" + request.query if request.query else "")
            self.send_response(308)
            self.send_header("Location", location)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        original_path = self.path
        if request.path in PAGES:
            self.path = PAGES[request.path] + ("?" + request.query if request.query else "")
        try:
            if head:
                super().do_HEAD()
            else:
                super().do_GET()
        finally:
            self.path = original_path

    def do_GET(self):
        self.serve_page()

    def do_HEAD(self):
        self.serve_page(head=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", type=int, nargs="?", default=4341)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f"Serving Growency at http://127.0.0.1:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
