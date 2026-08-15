# Security

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/arthurfr23/dqx_forge/security/advisories/new)
rather than opening a public issue. Include what an attacker could achieve and how to
reproduce it. You will get an acknowledgement within a few days.

## Security model

Understanding what the extension can and cannot do makes it easier to judge a finding.

### Credentials

DQX Forge does not handle credentials itself. It shells out to the Databricks CLI to
obtain a token for the profile you selected in `~/.databrickscfg`, and uses that token
for REST calls during the session. It never prompts for, stores, logs or transmits a
token, and there is no configuration field that holds one.

Consequence: **the extension can never reach anything your own Unity Catalog
permissions do not already allow.** It acts as you, with your grants.

### What leaves your workspace

Nothing, with one explicit exception: if you choose to run the AI agent on an *IDE*
model (GitHub Copilot, Claude, and similar) rather than a Databricks serving endpoint,
samples of your data are sent to that model provider under your own subscription. The
choice is presented in the model picker with that trade-off stated. Selecting a model
served on Databricks keeps everything inside the workspace.

The extension sends no telemetry and makes no network calls to any infrastructure
operated by its author.

### Data written to your workspace

Interactive runs return their payload through a Unity Catalog volume, because a
serverless job cannot hand a data structure back to the IDE any other way. **The
dry-run payload includes a sample of the rows that failed a check** — real data from
your table.

Those artifacts are deleted as soon as the extension has read them, including when
the underlying job fails, so they do not outlive the session and do not accumulate.
Results of *scheduled* jobs are metadata only — table names, mode, destinations,
status — and no data rows.

The volume you point the extension at is a security boundary you control. If its
grants are broader than those of the source tables, anything written there is visible
to holders of `READ VOLUME` who may not be able to query the tables themselves. Choose
a volume whose access matches the sensitivity of the tables you validate.

### Code that runs on your compute

The extension uploads the Python scripts in `tasks/` to `/Users/<you>/.dqx_forge/tasks/`
in your workspace and runs them as serverless jobs. They are plain, readable files
shipped inside the `.vsix`, and they install `databricks-labs-dqx` at the version you
configured. Nothing is fetched from a third-party location at run time.

`apply_task.py` is additionally written into your repository during resource
generation, so the code your scheduled job runs is versioned alongside your contracts
and reviewable in a pull request.

## Supported versions

The project is pre-1.0. Fixes land on the latest release only.
