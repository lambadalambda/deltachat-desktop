# Agent Progress Messages

This document describes the `v1` text format used for bot/agent tool-call
progress in Delta Chat Desktop.

## Goals

- Let bots show live progress while they are working.
- Keep the wire format compatible with clients that do not support rich UI.
- Avoid leaking sensitive tool arguments and results by default.

## Wire Format (v1)

Agent progress is sent as a regular text message and updated with message edits.

```text
Agent progress (v1, run=R42): running web.search
Calls:
1. ok fs.read_file - read input file
2. run web.search - search docs
```

### Header

Header line format:

```text
Agent progress (v1, run=<id>): <state> <current-tool>
```

Supported states:

- `thinking`
- `running`
- `done`
- `failed`
- `cancelled`

`run=<id>` and `<current-tool>` are optional.

### Calls Section

`Calls:` is optional but recommended.

Each call line format:

```text
<seq>. <status> <tool> - <safe-label>
```

Supported statuses:

- `run` (or `running`)
- `ok` (or `done`)
- `err` (or `error` / `fail`)
- `cancel` (or `cancelled` / `canceled`)

`<safe-label>` is optional and should not contain secrets.

## Client Behavior

### Supporting clients (Desktop)

- Parse the message if it matches the `Agent progress` format.
- Parsing is strict: unknown non-empty lines invalidate the format and the
  message is rendered as regular plain text.
- While state is `thinking` or `running`:
  - show only the current tool call
  - show a local animation
- After state is `done`, `failed`, or `cancelled`:
  - show only the last tool call
  - no animation
- If more than one call is present, allow expanding to view all tool calls.

### Non-supporting clients

- Display the same message as plain text.
- If edits are shown as separate messages, the timeline remains readable.

## Privacy and Safety

- Do not include raw tool arguments, tool outputs, tokens, file paths, or URLs
  unless explicitly intended for users.
- Prefer short safe labels, for example: `search docs`.
- Keep updates coarse-grained (tool start/finish/fail), not token-level.

## Recommended Update Strategy

- Send one progress message per agent run.
- Update it in place when the state changes or when a new tool starts.
- If edits are unavailable, send additional plain text progress messages in the
  same format.
