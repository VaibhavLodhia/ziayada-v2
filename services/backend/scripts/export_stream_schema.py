"""Export the SSE stream-event contract as JSON Schema.

The single source of truth is `app/api/stream_events.py`. The frontend generates
its TypeScript from the emitted schema — it is never hand-written. CI runs this
and fails if the committed schema is stale (see `.gitlab-ci.yml: contract:check`).

Run from `services/backend/`:

    python scripts/export_stream_schema.py

Writes: <repo-root>/contracts/stream-events.schema.json

Bump VERSION below on any contract change. Suggested policy:
  - patch (1.0.0 -> 1.0.1) — docs/comments only, no schema diff
  - minor (1.0.0 -> 1.1.0) — additive (new event variant, new optional field)
  - major (1.0.0 -> 2.0.0) — breaking (renamed/removed/retyped field or event)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# services/backend/scripts/export_stream_schema.py -> services/backend/ is parents[1]
# pytest configures `pythonpath = ["."]`, but standalone script runs don't.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api.stream_events import StreamEventAdapter  # noqa: E402

VERSION = "1.0.0"
SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"

# services/backend/scripts/export_stream_schema.py -> repo root is parents[3]
REPO_ROOT = Path(__file__).resolve().parents[3]
OUT = REPO_ROOT / "contracts" / "stream-events.schema.json"


def main() -> None:
    schema = StreamEventAdapter.json_schema()
    # Prepend metadata so the dialect + version sit at the top of the file.
    schema = {"$schema": SCHEMA_DIALECT, "version": VERSION, **schema}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(schema, indent=2) + "\n")
    print(f"wrote {OUT.relative_to(REPO_ROOT)} (version {VERSION})")


if __name__ == "__main__":
    main()
