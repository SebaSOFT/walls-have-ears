# AGENTS.md

Tooling and workflow reference for AI agents working in this repo. Project structure, build
commands, and code conventions live in `GEMINI.md` — read that too. This file covers *how* to use
the CLIs/skills available in this environment.

## rtk (Rust Token Killer)

Token-optimized proxy — a shell hook rewrites plain commands (`git status` → `rtk git status`,
`gh pr view` → `rtk gh pr view`, etc.) transparently, so normally nothing needs to be typed
differently. Use `rtk <cmd>` directly when composing something the hook won't catch (pipes, one-off
scripts).

- `rtk gain` / `rtk gain --history` — token savings analytics for this session/history.
- `rtk discover` — mines Claude Code history for missed optimization opportunities.
- `rtk proxy <cmd>` — run a command through rtk without filtering, for debugging a filter.
- `rtk grep` / `rtk rg` — compact grep/ripgrep output.
- `rtk read` — filtered file reads.
- Subcommands exist for git, gh, glab, npm/pnpm, jest/vitest, tsc, eslint/prettier, docker,
  kubectl, and most common dev CLIs — full list via `rtk --help`.
- If `rtk gain` fails with "command not found," check for a name collision with a different `rtk`
  binary (`which rtk`).

## CodeGraph MCP (`mcp__codegraph__codegraph_explore`)

SQLite-backed knowledge graph of symbols/edges/files, queried per-project. **This repo has no
`.codegraph/` directory** — indexing is the user's decision, not something to run unprompted. Until
one exists here, use Read/Grep/Glob for this codebase.

- Where an index does exist (this project or another), `codegraph_explore` is the **first** move for
  understanding/locating code — one call returns verbatim source of relevant symbols plus call paths
  and blast radius, replacing a grep+Read loop.
- Pass `projectPath` to point at a specific project's root (or any path inside it); the tool resolves
  the nearest `.codegraph/` above that path.
- Shell equivalent: `codegraph explore "<symbols or question>"`.
- To enable here: user runs `codegraph init` in the repo — index updates are picked up live, no
  restart needed.

## Tavily (`tvly` CLI)

Replaces all built-in web/browsing tools (WebFetch, WebSearch) per global instructions — use Tavily
for *any* URL fetch, web search, research, or documentation read.

- `tvly search <query>` — web search.
- `tvly extract <url...>` — pull content from specific URLs.
- `tvly crawl <url>` / `tvly map <url>` — crawl a site / discover URLs without extracting content.
- `tvly research run|status|poll` — deep/async research jobs.
- `tvly auth` / `tvly login --api-key ...` — auth status/setup (or `TAVILY_API_KEY` env var).
- `--json` on the top-level command for machine-readable output.
- Invoke via the `tavily` skill rather than raw `tvly` when the task is research-shaped — it carries
  the "always prefer this over WebFetch/WebSearch" instruction.

## feature-delivery skill

SebaSOFT's standing end-to-end protocol for shipping a feature/fix, shared across projects (found at
`~/dev/git-repo/sebasoft/.claude/skills/feature-delivery/SKILL.md`, symlinked/mirrored into
`.agent/.claude/.codex/.opencode` skill dirs). Defaults assume OpenSpec for planning — this repo
doesn't currently use OpenSpec for active changes (`openspec list` → none), so treat that part of the
skill as available-but-idle. Key shape:

1. **Investigate first** — CodeGraph if indexed, otherwise targeted grep/Read; never assert a fact
   about the codebase without just having verified it.
2. **Design philosophy** — reuse over invention, decision-support over silent automation, explicit
   Non-Goals, ask only for real product/privacy decisions (not things answerable by reading code).
3. **Pipeline, one change per branch**: propose (OpenSpec, if used) → confirm scope → branch → 
   implement → verify locally (full gate suite) → commit/push, open PR → watch CI to green → **wait
   for explicit merge approval, every time** → after merge: sync integration branch, delete local
   feature branch, archive+promote the OpenSpec change if one was used.
4. **Gap-analysis mode** — for open-ended "what's missing" surveys, report a dependency-ordered list
   first, let the user pick order, before drafting any proposal.

## git & GitHub CLI (`gh`)

Standard tools, both routed through `rtk` transparently via hook. Repo conventions:

- Branch: `feature/v14-364-echoes` (current). Recent commit style: Conventional Commits
  (`feat(scope): ...`, `fix: ...`).
- Main/integration branch: `main`.
- Always create new commits rather than amending; never force-push or skip hooks without explicit
  user instruction (see global git-safety rules).
- Use `gh` for PRs/issues/checks (`gh pr create`, `gh pr checks`, `gh api ...`).

## Agent-browser CLI

Fast CDP-based browser automation (no Playwright/Puppeteer dep). Not yet used in this project's
workflow, but available. Core loop:

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix task)"
agent-browser open <url>
agent-browser snapshot -i       # interactive-elements-only accessibility tree, @eN refs
agent-browser click @e3         # act on a ref
agent-browser snapshot -i       # re-snapshot after any page change — refs go stale
agent-browser close
```

- Always set a named session (`AGENT_BROWSER_SESSION`) before use — the default session is shared
  across every agent on the machine.
- `agent-browser read [url]` — docs-friendly markdown/text fetch without a full rendered snapshot;
  supports `--filter`, `--outline`, `--llms index|full`.
- `get`/`is`/`find` subcommands for reading state (`text`, `html`, `value`, `attr`, `count`, etc.)
  and locating elements without refs.
- `agent-browser skills get core --full` — full command reference; specialized skills exist for
  Electron, Slack, protected Vercel deploys, cloud browser providers.
- Since this project is a FoundryVTT module (no standalone web UI of its own to drive), agent-browser
  would only apply if testing against a running Foundry instance in a browser.

## OpenSpec CLI

Spec-driven change-management tool. This repo is OpenSpec-initialized (`openspec/` root resolves,
schema = `spec-driven`: proposal → specs → design → tasks) but has **no active changes** right now.

- `openspec list` — list changes (default) or `--specs` for specs.
- `openspec change` / `openspec spec` — manage change proposals / specs.
- `openspec validate <change> --strict` — must pass clean before a proposal is considered done.
- `openspec archive <change> --yes` — archive a completed change and promote spec deltas into the
  accepted baseline.
- `openspec context` — print working root/context (already confirmed: root is this repo, no
  cross-project references).
- `openspec view` — interactive dashboard of specs/changes.
- Repo also has matching `.agent/skills/openspec-*` skills (`explore`, `propose`, `apply-change`,
  `sync-specs`, `archive-change`) and `.agent/workflows/opsx-*.md` — these are the concrete
  implementations feature-delivery's pipeline steps 1/3/4/9 delegate to in this project.
