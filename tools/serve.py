from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


build_directory = Path(__file__).resolve().parents[1] / "build" / "web"
if not (build_directory / "index.html").exists():
    raise SystemExit("Export the Web preset to build/web/index.html first.")

handler = partial(SimpleHTTPRequestHandler, directory=str(build_directory))
server = ThreadingHTTPServer(("127.0.0.1", 8060), handler)
print("ECHOES is ready at http://127.0.0.1:8060 — Ctrl+C to stop.", flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
