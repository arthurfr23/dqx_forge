# DQX Forge

Extensão do VS Code para construir o framework de Data Quality de um Lakehouse Databricks com [DQX](https://github.com/databrickslabs/dqx) — profiling, contratos versionados em Git e jobs de qualidade agendados, sem sair da IDE.

## O que ela faz

- Navega o Unity Catalog e perfila tabelas para propor checks a partir dos dados reais.
- Edita contratos de qualidade num editor visual, versionados como YAML no repositório.
- Roda dry-run de um contrato em compute serverless antes de publicar.
- Gera os recursos do Databricks Asset Bundle (jobs e dashboard) a partir dos contratos.
- Publica no workspace e dispara execuções pelo CLI da Databricks.

## Requisitos

- VS Code 1.95 ou superior.
- [CLI da Databricks](https://docs.databricks.com/dev-tools/cli/) no PATH, com um perfil autenticado em `~/.databrickscfg`.
- Unity Catalog no workspace, com um volume onde a extensão possa gravar.
- Um SQL warehouse, se for usar o agente de IA ou o dashboard de qualidade.

## Configuração

Tudo é configurado pela view **DQX Forge** na Activity Bar — cada linha abre um seletor que lê as opções reais do workspace. Nada exige editar `settings.json` à mão.

| Item | Para que serve |
|---|---|
| Workspace | Perfil do `~/.databrickscfg` usado nas chamadas. |
| Volume de artefatos | Onde os jobs gravam o resultado das execuções. |
| SQL warehouse | Necessário para o agente de IA e para o dashboard. |
| Modelo de IA | Onde a IA roda: servida no Databricks ou na própria IDE. |
| Pasta dos contratos | Onde os contratos são versionados no repositório. |
| Agendamento | Periodicidade dos jobs gerados, por preset ou expressão Quartz. |
| Versão do DQX | Versão do `databricks-labs-dqx` instalada nos jobs. |

## Dados: o que sai do workspace e o que é gravado

Esta seção existe porque a extensão movimenta dados, e você precisa saber onde eles param antes de apontá-la para tabelas sensíveis.

**Credenciais.** A extensão usa o perfil que você já tem no `~/.databrickscfg`, via CLI da Databricks. Ela nunca pede, armazena ou transmite token — e nunca tem acesso além do que o seu usuário já tem no Unity Catalog.

**Onde a extensão grava.**

| Caminho | Conteúdo | Ciclo de vida |
|---|---|---|
| `<volume>/runs/` | Payload de retorno de cada execução interativa (dry-run, profiling, importação, catálogo de checks). O resultado do dry-run **inclui uma amostra das linhas reprovadas**, ou seja, dados reais da tabela. | Apagado pela extensão assim que o resultado é lido. |
| `<volume>/runs/<target>/` | Resultado dos jobs agendados: tabela, modo, destinos e status. Sem linhas de dados. | Sobrescrito a cada execução do job. |
| `/Users/<você>/.dqx_forge/tasks/<hash>/` | Os scripts Python que rodam nos jobs, enviados ao seu diretório no workspace. | Sobrescrito por versão do script. |
| Repositório local | Contratos em YAML e os recursos gerados do bundle. | Versionado por você. |

**Agente de IA.** Se você escolher rodar o modelo *no Databricks*, nenhum dado sai do workspace. Se escolher rodar *na IDE* (Copilot, Claude e afins), amostras dos dados são enviadas ao provedor do modelo da sua assinatura — a escolha é explícita no seletor de modelo e o efeito está descrito nele.

**O que a extensão não faz.** Não envia telemetria, não faz chamadas a servidores do autor e não persiste dados fora do seu workspace Databricks e do seu repositório.

**Sob sua responsabilidade.** Os grants do volume e das tabelas, a escolha de qual volume usar, a retenção do que fica lá e a decisão de despausar jobs em produção. Um volume com grants mais amplos que os das tabelas de origem expõe, a quem tem `READ VOLUME`, o que estiver gravado nele.

## Desenvolvimento

```bash
npm install
npm run compile     # build de dist/
npm run watch       # build incremental
npm run typecheck   # tsc --noEmit
npm run vsix        # empacota dqx-forge.vsix
```

`F5` no VS Code abre um Extension Development Host com a extensão carregada.

Os scripts em `tasks/` são copiados para `dist/tasks/` no build e embarcados no `.vsix`. São o mesmo código que roda nos jobs agendados do bundle.

## Licença

MIT — veja [LICENSE](LICENSE).
