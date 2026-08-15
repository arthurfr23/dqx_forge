# Contributing to DQX Forge

Thanks for taking the time. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an [issue](https://github.com/arthurfr23/dqx_forge/issues) with:

- What you did, what you expected, what happened instead.
- The output of `DQX Forge: Show log` around the failure — it carries the CLI and
  API exchange and is usually enough to identify the cause.
- Your VS Code version, `databricks --version`, and the DQX version configured in Setup.

**Never paste tokens, workspace URLs you consider sensitive, or real data rows.**
Dry-run output contains rows from your tables; redact before sharing.

## Development setup

```bash
git clone https://github.com/arthurfr23/dqx_forge.git
cd dqx_forge
npm install
npm run compile
```

Press `F5` to launch an Extension Development Host with the extension loaded. The
`preLaunchTask` compiles first, so a fresh clone works immediately.

You will need a Databricks workspace with Unity Catalog and serverless compute to
exercise anything that talks to the platform.

```bash
npm run typecheck    # tsc --noEmit — must pass before a PR
npm run watch        # incremental build while developing
npm run vsix         # package a .vsix to install locally
```

## Project layout

```
src/
  auth/          Databricks authentication over the CLI's profiles
  remote/        Workspace clients: jobs, SQL, serving, Unity Catalog
  contracts/     Contract schema, parsing, validation, importers
  domain/        Check catalog, profiling types, layer profiles
  deploy/        Bundle generation and the Databricks CLI wrapper
  commands/      One module per user-facing command
  webview/       Panel host and the message protocol
  views/         Activity Bar tree providers
  i18n/          Message catalogue — one entry per language, typed
webview-ui/      React editor rendered inside the webview
tasks/           Python tasks that run on Databricks
resources/       Icon and the quality dashboard template
```

Modules under `auth/`, `remote/`, `contracts/` and `deploy/` deliberately do **not**
import `vscode`. That keeps the code that talks to Databricks testable outside the
extension host — please keep it that way.

## Conventions

- **TypeScript, strict.** `npm run typecheck` must pass.
- **Comments explain why, not what.** The code says what it does; a comment earns its
  place by recording a constraint or a decision that is not obvious from reading it.
- **Every user-facing string goes through `i18n/messages.ts`.** The `Catalogo` type
  forces all three languages to define every key, so a missing translation is a
  compile error rather than a blank in someone's UI.
- **Generated files carry a header** saying they are generated and should not be
  edited by hand. If you add one, follow the same pattern.
- **Never write a user's data anywhere it can outlive the session.** Artifacts on the
  Unity Catalog volume are the return channel for a job, and are deleted once read.

## Pull requests

- One concern per pull request.
- Describe how you verified the change. For anything touching bundle generation or a
  Python task, "ran it against a real workspace and it deployed / the job succeeded"
  is the bar — these paths fail in ways that unit tests do not catch.
- Update `CHANGELOG.md` under `## [Unreleased]`.
- If you change behaviour that the README documents, update the README in the same PR.

## Releasing

1. Bump `version` in `package.json`.
2. Move the `## [Unreleased]` entries into a new version section in `CHANGELOG.md`.
3. `npm run vsix`.
4. Tag the commit and attach the `.vsix` to a GitHub release.
