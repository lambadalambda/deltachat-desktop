# Fork-specific Changes

This file tracks behavior and workflow that intentionally differs in
`lambadalambda/deltachat-desktop`.

## How to maintain this file

- Add an entry when a change is fork-specific or user-visible.
- Link to the implementing commit (or PR) and related issue.
- Keep each entry short and focused on the why.
- Use status values: `planned`, `in-progress`, `shipped`, `retired`.

## Feature register

### Shipped

- `shipped` UI/messages: inline HTML message expansion in chat for long HTML-only messages.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/859d47a6a
- `shipped` UI/reactions: quick react action on reaction chips.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/f7e4969ea
- `shipped` UI/reactions: quick react controls shown on hover to reduce clutter.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/f428e610a
- `shipped` UI/messages: inline bot tool progress renderer with expandable call list.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/d38544f80
- `shipped` UI/messages: agent progress fixes for active animation and collapsed call visibility.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/d7bc9a2eb
- `shipped` workflow: `mise` tasks for macOS build, package, install, ad-hoc signing, and launch.
  - commit: https://github.com/lambadalambda/deltachat-desktop/commit/d7bc9a2eb

### Planned

- `planned` UI/media browser: refactor Apps/Media with a mixed `Recent` view and consistent ordering.
  - issue: https://github.com/lambadalambda/deltachat-desktop/issues/2
- `planned` UI/composer: emoji autocomplete from `:query` in the composer.
  - issue: https://github.com/lambadalambda/deltachat-desktop/issues/3

### In-progress

- `in-progress` workflow: browser fixture page for quick visual checks of Apps/Media layout.
  - issue: https://github.com/lambadalambda/deltachat-desktop/issues/2
