"""Local preview server that never lets the browser cache files,
so edits to styles.css, main.js, or config.js always show up on reload.

Run from this folder:  python3 serve.py   (then open http://localhost:4173)
"""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    print(f"Serving on http://localhost:{PORT}")
    http.server.ThreadingHTTPServer(("", PORT), NoCacheHandler).serve_forever()
