# Changelog

All notable changes to DQX Forge are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] — 2026-08-16

### Fixed

- Todo texto que aparece na tela passa a seguir o idioma escolhido. Mensagens de
  progresso, erros, seletores, a árvore do Unity Catalog e o log do canal de
  saída estavam fixos em português, independente da configuração.
- As justificativas geradas pelo agente de IA saíam sempre em português, porque
  o prompt nunca informava o idioma da interface. A instrução agora acompanha a
  configuração e é reforçada no fim do prompt, onde o modelo de fato a respeita.
- As explicações vindas do profiling (faixa observada, percentual de nulos,
  valores distintos) eram montadas com texto fixo e formatação numérica pt-BR.
  Agora seguem o idioma e o locale correspondente.

### Changed

- `t()` deixou de depender de `vscode`: o idioma resolvido é definido na
  ativação e a cada troca de configuração. Isso permite que os módulos que
  conversam com o Databricks traduzam suas mensagens sem quebrar a regra de
  mantê-los testáveis fora do host da extensão.

## [0.0.1] — 2026-08-14

First public release.

### Added

- **Unity Catalog browser** in the Activity Bar, scoped by an optional catalog filter.
- **Profiling** — run DQX profiling on a table with serverless compute and turn the
  result into a proposed contract.
- **Visual contract editor** with a searchable catalog of DQX check functions,
  per-check criticality, optional row filters, and validation against both the
  table schema and the installed DQX version.
- **Dry run** — apply a contract to a sample and see violations per check plus
  sample failing rows, before anything is written.
- **AI-assisted authoring** — let a model investigate the data and propose rules,
  running either on a Databricks serving endpoint or on your IDE subscription.
- **Import** of existing rules from a DQX checks file, an ODCS v3.x data contract,
  or a checks table in Unity Catalog.
- **Bundle generation** — turns contracts into a Databricks Asset Bundle: jobs, a
  quality dashboard, a scaffolded `databricks.yml` when the project has none, and
  the runner script the job executes.
- **Scheduling** — pick a periodicity from presets or write a Quartz expression,
  validated as you type, with a time zone picker.
- **Deploy and run** the bundle through the Databricks CLI without leaving the IDE.
- **Interface in English, Português (Brasil) and Español**, following the VS Code
  language by default.

### Notes

- Generated jobs are created paused, so that enabling a production schedule is an
  explicit decision made during review.
- Artifacts written to the Unity Catalog volume during interactive runs are deleted
  as soon as the extension reads them; dry-run payloads contain real table rows and
  are not left behind.

[Unreleased]: https://github.com/arthurfr23/dqx_forge/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/arthurfr23/dqx_forge/releases/tag/v0.0.2
[0.0.1]: https://github.com/arthurfr23/dqx_forge/releases/tag/v0.0.1
