# AGENTS

This project includes the following workflow expectations for agent-driven work:

## Development Process

- Use TDD for feature and bug-fix work: `red -> green -> refactor`.
- Start by adding or updating a test that fails for the intended behavior.
- Implement the smallest change needed to make tests pass.
- Refactor only after tests are green, and keep behavior unchanged.

## Commit Discipline

- Commit early and often.
- Keep commits small and topical.
- Do not mix unrelated changes in the same commit.
- Write clear commit messages that explain intent.

## Fork Change Tracking

- Keep `FORK.md` updated for fork-specific behavior and workflow.
- For every fork-only change, add a short entry with status and commit/issue link.
- If a tracked change is upstreamed or removed, mark it as `retired`.

## Local Desktop Workflow

- Prefer `mise` tasks for repeatable local desktop workflows.
- On macOS, use `mise run desktop-build-install-mac` to build, package, install, ad-hoc sign, and open Delta Chat.
- If `mise` asks for trust, run `mise trust .mise.toml` once in the repo root.
- Use `mise run frontend-test-agent-progress` when touching agent progress parsing/UI behavior.
- Use `mise run fixture-media-view` to open the real-component Apps/Media fixture page in browser target mode.
