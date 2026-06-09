# Contracts

Generated, single-source-of-truth definitions for the boundary between the
backend (producer) and frontend (consumer). **Nothing here is hand-written on
the consuming side** — the frontend's TypeScript is generated from these.

The rule: when a change crosses the FE/BE edge, update the source of truth here
*first*, regenerate, get a quick schema-only review, and merge the contract
before either side builds behind it.

## What lives where

| Boundary | Source of truth (backend) | Transport | Generated FE types |
|---|---|---|---|
| REST endpoints | FastAPI route models (`app/api/schemas.py`, …) → `GET /openapi.json` | OpenAPI | `services/frontend/src/lib/api-types.gen.ts` |
| SSE chat stream | `app/api/stream_events.py` (`StreamEvent` union) → `stream-events.schema.json` | JSON Schema | `services/frontend/src/lib/stream-events.gen.ts` |

OpenAPI can't describe a `text/event-stream` body, so the streaming events get
their own JSON Schema — same idea, two transports.

## Regenerating

Backend (when stream events change):

```bash
cd services/backend
python scripts/export_stream_schema.py        # -> contracts/stream-events.schema.json
```

Frontend (backend must be running on :8000 for the REST half):

```bash
cd services/frontend
npm run gen:types        # both REST + stream
# or individually: npm run gen:api  /  npm run gen:stream
```

## Stream event shapes

Every event in `stream-events.schema.json` carries a required `type`
discriminant. Use it for exhaustive narrowing on the consumer:

```ts
switch (event.type) {
  case "session":     /* event.session_id */ break;
  case "token":       /* event.delta */ break;
  case "tool":        /* event.id, event.name, event.args */ break;
  case "tool_result": /* event.id, event.name, event.result */ break;
  case "error":       /* event.message */ break;
  case "done":        /* terminal */ break;
}
```

If you add a new event variant in `stream_events.py`, the FE build breaks at
every non-exhaustive `switch` — that is the intended behaviour.

### Invariants the schema cannot encode

These are guarantees the producer makes about the order and pairing of events.
They are not in the JSON Schema (no schema vocabulary can express them); rely on
them, but if you want to be defensive, the rules are:

- `session` is always the first event on a stream.
- `done` is always the last event on a stream — even when an `error` occurs.
- `error` is followed by exactly one `done`, then the stream ends.
- Every `tool` event's `id` is matched by exactly one later `tool_result` with
  the same `id`, **unless** the stream errors before the tool finishes.

### Field-level notes

- `ToolEvent.args` is intentionally untyped (`Record<string, unknown>` in the
  generated TS). The shape depends on the tool; the consumer must guard before
  reading specific keys.
- `ToolResultEvent.result` is a **stringified payload**, not a structured
  object. If a tool returns JSON, it has already been `str()`-coerced
  upstream — parse it on the FE if you need structure.

## Versioning

The top-level `version` field in `stream-events.schema.json` follows semver
against the schema shape (not the app):

- **patch** (`1.0.0` → `1.0.1`) — docs/comments only, no schema diff.
- **minor** (`1.0.0` → `1.1.0`) — additive: new event variant, new optional
  field. Old consumers keep working.
- **major** (`1.0.0` → `2.0.0`) — breaking: renamed/removed/retyped field or
  event. Old consumers will fail to validate or fail to compile against the
  regenerated types.

Bump it in `services/backend/scripts/export_stream_schema.py` (single `VERSION`
constant) in the same commit as the schema change.

## Working on this with two people

When Khusrav (BE) and Vaibhav (FE) both have branches in flight that touch the
stream contract, this is how you keep them in sync without surprises.

### Day-to-day rule

The committed `contracts/stream-events.schema.json` and
`services/frontend/src/lib/stream-events.gen.ts` must always match what the
generators produce from the current source files. CI enforces this via the
`contract:check` job — every push that touches stream events runs both
generators and fails if anything differs from what's committed.

If you change `stream_events.py`, in the same commit you must also:

1. `cd services/backend && python scripts/export_stream_schema.py`
2. `cd services/frontend && npm run gen:stream`
3. Bump `VERSION` in `export_stream_schema.py` per the rule above.
4. Commit the resulting schema and `*.gen.ts` changes alongside your source
   change.

### Merging two branches that both touch the contract

1. Whoever's contract change is bigger merges to `main` first.
2. The other rebases onto `main`, regenerates (`python
   scripts/export_stream_schema.py` then `npm run gen:stream`), and resolves any
   conflict in the regenerated files by **re-running the generators**, never by
   hand-editing the JSON or `.gen.ts`.
3. If the FE build (`npm run build`) fails after rebase, that is a real
   contract conflict — the BE removed or retyped something the FE was using.
   Fix the FE call sites on the branch before merging.

### How to tell what works and what doesn't

| Signal | What it means |
|---|---|
| `contract:check` fails on push | The committed schema or `*.gen.ts` is stale — you forgot to run a generator. |
| `npm run build` fails after pulling main | Schema changed breakingly; the FE has uses of removed/renamed fields. Fix them. |
| `version` bumped to a new **major** in `main` | Treat as a hard sync point: pull main, regenerate, fix anything the compiler shouts about, then continue. |
| `version` bumped to a new **minor** in `main` | Additive; existing FE code keeps working. Use the new event/field when ready. |
| Schema and `*.gen.ts` unchanged on your branch | Your change does not affect the contract. Merge order with the other branch does not matter. |

The point: there is no "we'll find out in staging." If `contract:check` passes
and `npm run build` passes on the rebased branch, the two sides agree.

## TODO

- Move the generators from `npx` into frontend `devDependencies` + lockfile so
  the FE codegen is reproducible without network installs.
- Point `api.ts` at the generated types and delete the hand-written mirrors.
