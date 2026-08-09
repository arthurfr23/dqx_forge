/**
 * Catálogo de mensagens. O tipo Catalogo obriga cada idioma a definir todas as
 * chaves — uma tradução esquecida vira erro de compilação, não texto faltando
 * na tela do usuário.
 */

export type Idioma = "pt-br" | "en" | "es";

export const IDIOMAS: Array<{ codigo: Idioma; nome: string }> = [
  { codigo: "pt-br", nome: "Português (Brasil)" },
  { codigo: "en", nome: "English" },
  { codigo: "es", nome: "Español" },
];

export interface Catalogo {
  // editor — estrutura
  editor_carregando: string;
  editor_checks: (n: number) => string;
  editor_semChecks: string;
  editor_semChecksDica: string;
  editor_naoSalvo: string;
  editor_salvo: string;

  // editor — modo de saída
  saida_titulo: string;
  saida_anotar: string;
  saida_quarentena: string;
  saida_anotarDica: string;
  saida_quarentenaDica: string;
  saida_tabelaSaida: string;
  saida_tabelaQuarentena: string;
  saida_tabelaMetricas: string;
  saida_tabelaMetricasDica: string;

  // editor — check
  check_criticidade: string;
  check_remover: string;
  check_filtroDica: string;
  check_opcional: (nome: string) => string;

  // editor — catálogo lateral
  catalogo_titulo: string;
  catalogo_buscar: string;
  catalogo_todasDimensoes: string;
  catalogo_sugerida: string;
  catalogo_recomendadas: (dims: string) => string;
  catalogo_semResultado: string;

  // editor — rodapé
  rodape_salvar: string;
  rodape_salvoBotao: string;
  rodape_dryRun: string;
  rodape_verYaml: string;
  rodape_errosImpedem: (n: number) => string;
  rodape_avisos: (n: number) => string;

  // dry-run
  dry_titulo: string;
  dry_executando: string;
  dry_aguarde: string;
  dry_amostraLabel: string;
  dry_amostraDica: string;
  dry_tabelaInteira: string;
  dry_falhou: (motivo: string) => string;
  dry_resumo: (
    avaliadas: string,
    validas: string,
    reprovadas: string,
    avisos: string,
  ) => string;
  dry_semViolacoes: string;
  dry_avisoAmostra: (percentual: string, amostradas: string, total: string) => string;
  dry_colCheck: string;
  dry_colColuna: string;
  dry_colViolacoes: string;
  dry_exemplos: string;


  // configuração (view lateral)
  setup_workspace: string;
  setup_volume: string;
  setup_warehouse: string;
  setup_modelo: string;
  setup_pasta: string;
  setup_agendamento: string;
  setup_idioma: string;
  setup_versao: string;
  setup_ajudaWorkspace: string;
  setup_ajudaVolume: string;
  setup_ajudaWarehouse: string;
  setup_ajudaModelo: string;
  setup_ajudaPasta: string;
  setup_ajudaAgendamento: string;
  setup_ajudaIdioma: string;
  setup_ajudaVersao: string;
  setup_naoConfigurado: string;
  setup_automatico: (idioma: string) => string;

  // agendamento dos jobs
  agenda_titulo: string;
  agenda_placeholder: string;
  agenda_emUso: string;
  agenda_15min: string;
  agenda_30min: string;
  agenda_horaEmHora: string;
  agenda_6h: string;
  agenda_diario6: string;
  agenda_util6: string;
  agenda_semanal: string;
  agenda_manual: string;
  agenda_manualDetalhe: string;
  agenda_personalizado: string;
  agenda_personalizadoDetalhe: string;
  agenda_cronTitulo: string;
  agenda_cronPrompt: string;
  agenda_fusoTitulo: string;
  agenda_fusoPlaceholder: string;
  /** Nomes dos campos Quartz, na ordem em que aparecem na expressão. */
  agenda_campos: string[];
  agenda_erroCampos: (n: number) => string;
  agenda_erroInterrogacao: string;
  agenda_erroUmaInterrogacao: string;
  agenda_erroValor: (campo: string, token: string) => string;
  agenda_erroFaixa: (campo: string, min: number, max: number) => string;

  // seletores
  pick_perfilTitulo: string;
  pick_perfilPlaceholder: string;
  pick_modeloTitulo: string;
  pick_modeloPlaceholder: string;
  pick_modeloNoWorkspace: string;
  pick_modeloNaIde: string;
  pick_modeloDetalheDb: string;
  pick_modeloDetalheIde: string;
  pick_modeloNaoPronto: string;
  pick_warehouseTitulo: string;
  pick_warehousePlaceholder: string;
  pick_warehouseCriar: string;
  pick_warehouseCriarDetalhe: string;
  pick_volumeCatalogo: string;
  pick_volumeSchema: string;
  pick_volumeTitulo: string;
  pick_volumePlaceholder: string;
  pick_idiomaTitulo: string;
  pick_idiomaPlaceholder: string;
  pick_idiomaAuto: string;
  pick_idiomaAutoDetalhe: string;
  pick_targetTitulo: string;
  pick_targetPlaceholder: string;
  pick_tabelaPrompt: string;
  pick_tabelaPlaceholder: string;
  pick_tabelaInvalida: string;

  // mensagens
  msg_contratoSalvo: (caminho: string) => string;
  msg_idiomaAlterado: (idioma: string) => string;
  msg_semPerfis: string;
  msg_semModelos: string;
  msg_semWarehouse: string;
  msg_criarAgora: string;
  msg_verDetalhes: string;
  msg_publicado: (target: string) => string;
  msg_falhaValidacao: string;
  msg_falhaPublicar: (target: string) => string;
  msg_recursosGerados: (arquivos: number, contratos: number) => string;
  msg_agendamentoAplicado: (descricao: string) => string;
  msg_agendamentoDefinido: (descricao: string) => string;
  msg_semContratos: string;

  // ações e títulos
  acao_perfilarTitulo: string;
  acao_novoContratoTitulo: string;
  acao_iaTitulo: string;
  acao_pastaTitulo: string;
  acao_pastaPrompt: string;
  acao_versaoTitulo: string;
  acao_versaoPrompt: string;
  acao_versaoInvalida: string;
  acao_executarTitulo: string;
  acao_executarPlaceholder: string;
  acao_abrirDatabricks: string;
  acao_abrirArquivo: (nome: string) => string;
  acao_verRecursos: string;
  acao_comoConfigurar: string;
  acao_contextoTitulo: string;
  acao_contextoPrompt: string;
  acao_contextoPlaceholder: string;
  msg_dryRunSemChecks: string;
  msg_dryRunPreparando: string;
  msg_execucaoIniciada: (tabela: string) => string;
  msg_precisaWarehouse: string;
  msg_precisaVolume: string;
  msg_abrirConfig: string;
  msg_abraPasta: string;
  msg_dashboardNaoEncontrado: string;
  msg_dashboardPulado: string;
  msg_catalogoRecarregado: (n: number) => string;
  msg_checksImportados: (n: number, tabela: string) => string;
  msg_iaPropos: (n: number, tabela: string) => string;

  // agente de IA em lote
  ia_titulo: (n: number) => string;
  ia_progresso: (atual: number, total: number, tabela: string) => string;
  ia_escolherTabelasTitulo: (schema: string) => string;
  ia_escolherTabelasPlaceholder: string;
  ia_confirmarLote: (n: number, minutos: number) => string;
  ia_confirmarLoteAcao: string;
  ia_semTabelas: (schema: string) => string;
  ia_semPropostas: string;
  ia_limiteAtingido: string;
  ia_nenhumContrato: string;
  ia_resumoLote: (regras: number, tabelas: number) => string;
  ia_semRegrasEm: (n: number) => string;
  ia_tabelaDerivada: string;
  msg_semCatalogoChecks: string;
  msg_semModelosIde: string;

  // dimensões
  dim_completude: string;
  dim_validade: string;
  dim_acuracia: string;
  dim_unicidade: string;
  dim_consistencia: string;
  dim_atualidade: string;
}

const ptBr: Catalogo = {
  editor_carregando: "Carregando o contrato…",
  editor_checks: (n) => `Checks (${n})`,
  editor_semChecks: "Este contrato ainda não tem checks.",
  editor_semChecksDica: "Escolha um no painel à direita para começar.",
  editor_naoSalvo: "não salvo",
  editor_salvo: "salvo",

  saida_titulo: "O que fazer com as linhas reprovadas",
  saida_anotar: "Anotar",
  saida_quarentena: "Quarentena",
  saida_anotarDica:
    "Mantém uma tabela só e anexa as colunas _errors e _warnings. Nada é barrado — útil para observar antes de agir.",
  saida_quarentenaDica:
    "Separa as linhas válidas das reprovadas em tabelas distintas. As reprovadas não seguem para o consumo.",
  saida_tabelaSaida: "tabela de saída",
  saida_tabelaQuarentena: "tabela de quarentena",
  saida_tabelaMetricas: "tabela de métricas",
  saida_tabelaMetricasDica: "opcional — alimenta o dashboard do DQX",

  check_criticidade: "Criticidade",
  check_remover: "remover",
  check_filtroDica: "SQL opcional — restringe as linhas avaliadas",
  check_opcional: (nome) => `${nome} (opcional)`,

  catalogo_titulo: "Adicionar check",
  catalogo_buscar: "Buscar por nome ou descrição",
  catalogo_todasDimensoes: "Todas as dimensões",
  catalogo_sugerida: "sugerida",
  catalogo_recomendadas: (dims) => `Para esta camada, o recomendado é cobrir ${dims}.`,
  catalogo_semResultado: "Nenhum check corresponde à busca.",

  rodape_salvar: "Salvar no repositório",
  rodape_salvoBotao: "Salvo",
  rodape_dryRun: "Dry-run",
  rodape_verYaml: "Ver YAML",
  rodape_errosImpedem: (n) => (n === 1 ? "1 erro impede salvar" : `${n} erros impedem salvar`),
  rodape_avisos: (n) => `${n} aviso(s)`,

  dry_titulo: "Resultado do dry-run",
  dry_executando: "Executando…",
  dry_aguarde: "Aplicando os checks no Databricks. Leva alguns minutos na primeira vez, porque o compute serverless sobe do zero.",
  dry_amostraLabel: "Amostra",
  dry_amostraDica:
    "Percentual da tabela a avaliar, sorteado aleatoriamente. Quanto maior, mais confiável — e mais demorado.",
  dry_tabelaInteira: "tabela inteira",
  dry_falhou: (motivo) => `O dry-run falhou: ${motivo}`,
  dry_resumo: (avaliadas, validas, reprovadas, avisos) =>
    `${avaliadas} linhas avaliadas · ${validas} passaram · ${reprovadas} reprovadas por checks error · ${avisos} com aviso`,
  dry_semViolacoes: "Nenhum check foi violado nesta amostra.",
  dry_avisoAmostra: (percentual, amostradas, total) =>
    `Esta amostra cobre ${percentual}% da tabela (${amostradas} de ${total} linhas). Checks de faixa e de lista gerados por profiling herdam os limites do que foi amostrado e podem reprovar dados válidos no restante — revise min_limit, max_limit e listas de valores antes de publicar.`,
  dry_colCheck: "Check",
  dry_colColuna: "Coluna",
  dry_colViolacoes: "Violações",
  dry_exemplos: "Linhas reprovadas (amostra)",


  setup_workspace: "Workspace",
  setup_volume: "Volume de artefatos",
  setup_warehouse: "SQL warehouse",
  setup_modelo: "Modelo de IA",
  setup_pasta: "Pasta dos contratos",
  setup_agendamento: "Agendamento",
  setup_idioma: "Idioma",
  setup_versao: "Versão do DQX",
  setup_ajudaWorkspace: "Perfil do ~/.databrickscfg usado para conectar.",
  setup_ajudaVolume: "Onde os jobs gravam os resultados intermediários.",
  setup_ajudaWarehouse: "Necessário para o agente de IA e para o dashboard.",
  setup_ajudaModelo: "Qual modelo investiga os dados e propõe as regras.",
  setup_ajudaPasta: "Onde os contratos são versionados no repositório.",
  setup_ajudaAgendamento: "Periodicidade com que os jobs de qualidade rodam.",
  setup_ajudaIdioma: "Idioma da interface do DQX Forge.",
  setup_ajudaVersao: "Versão instalada nos jobs serverless.",
  setup_naoConfigurado: "não configurado",
  setup_automatico: (idioma) => `automático · ${idioma}`,

  agenda_titulo: "Agendamento dos jobs",
  agenda_placeholder: "Com que frequência os checks devem rodar",
  agenda_emUso: "em uso",
  agenda_15min: "A cada 15 minutos",
  agenda_30min: "A cada 30 minutos",
  agenda_horaEmHora: "De hora em hora",
  agenda_6h: "A cada 6 horas",
  agenda_diario6: "Todo dia às 6h",
  agenda_util6: "Dias úteis às 6h",
  agenda_semanal: "Toda segunda-feira às 6h",
  agenda_manual: "Sem agendamento",
  agenda_manualDetalhe: "o job sobe sem schedule e roda só quando disparado",
  agenda_personalizado: "Expressão Quartz…",
  agenda_personalizadoDetalhe: "escreva o cron no formato do Databricks",
  agenda_cronTitulo: "Expressão Quartz",
  agenda_cronPrompt: "6 ou 7 campos: seg min hora dia mês dia-da-semana [ano]",
  agenda_fusoTitulo: "Fuso horário do agendamento",
  agenda_fusoPlaceholder: "Fuso em que o cron é interpretado",
  agenda_campos: [
    "segundos",
    "minutos",
    "horas",
    "dia do mês",
    "mês",
    "dia da semana",
    "ano",
  ],
  agenda_erroCampos: (n) =>
    `O Quartz usa 6 ou 7 campos separados por espaço, e você informou ${n}. O primeiro campo é segundos — o cron Unix de 5 campos não vale aqui.`,
  agenda_erroInterrogacao: "O '?' só vale em dia do mês ou dia da semana.",
  agenda_erroUmaInterrogacao:
    "Use '?' em exatamente um entre dia do mês e dia da semana; o outro recebe o valor.",
  agenda_erroValor: (campo, token) => `Valor inválido em ${campo}: "${token}".`,
  agenda_erroFaixa: (campo, min, max) => `O campo ${campo} aceita valores de ${min} a ${max}.`,

  pick_perfilTitulo: "Perfil do Databricks",
  pick_perfilPlaceholder: "Selecione o workspace",
  pick_modeloTitulo: "Modelo para gerar contratos com IA",
  pick_modeloPlaceholder: "Escolha onde a IA deve rodar",
  pick_modeloNoWorkspace: "No workspace (Databricks)",
  pick_modeloNaIde: "Na IDE",
  pick_modeloDetalheDb: "Roda no Databricks — nenhum dado sai do workspace. Consome DBUs.",
  pick_modeloDetalheIde:
    "Usa sua assinatura na IDE, sem custo no Databricks. Amostras dos dados saem do workspace.",
  pick_modeloNaoPronto: "Endpoint não está pronto no momento.",
  pick_warehouseTitulo: "SQL warehouse",
  pick_warehousePlaceholder: "Usado pelo agente de IA e pelo dashboard",
  pick_warehouseCriar: "Criar um novo warehouse",
  pick_warehouseCriarDetalhe: "2X-Small serverless, desliga sozinho em 10 min",
  pick_volumeCatalogo: "Catálogo",
  pick_volumeSchema: "Schema",
  pick_volumeTitulo: "Volume",
  pick_volumePlaceholder: "Onde os jobs gravam os resultados",
  pick_idiomaTitulo: "Idioma da interface",
  pick_idiomaPlaceholder: "Escolha o idioma",
  pick_idiomaAuto: "Automático",
  pick_idiomaAutoDetalhe: "Segue o idioma do VS Code",
  pick_targetTitulo: "Target do bundle",
  pick_targetPlaceholder: "Ambiente de destino",
  pick_tabelaPrompt: "Nome completo da tabela",
  pick_tabelaPlaceholder: "catalog.schema.tabela",
  pick_tabelaInvalida: "Use catalog.schema.tabela",

  msg_contratoSalvo: (caminho) => `Contrato salvo em ${caminho}.`,
  msg_idiomaAlterado: (idioma) => `Idioma: ${idioma}.`,
  msg_semPerfis: "Nenhum perfil encontrado em ~/.databrickscfg.",
  msg_semModelos:
    "Nenhum modelo disponível. Verifique o acesso às Foundation Model APIs do workspace ou ative o Copilot na IDE.",
  msg_semWarehouse:
    "Nenhum SQL warehouse no workspace. O agente de IA e o dashboard precisam de um.",
  msg_criarAgora: "Criar um agora",
  msg_verDetalhes: "Ver detalhes",
  msg_publicado: (target) => `Bundle publicado no target ${target}.`,
  msg_falhaValidacao: "O bundle não passou na validação. Nada foi publicado.",
  msg_falhaPublicar: (target) => `Falha ao publicar no target ${target}.`,
  msg_recursosGerados: (arquivos, contratos) =>
    `${arquivos} arquivo(s) gerado(s) para ${contratos} contrato(s).`,
  msg_agendamentoAplicado: (descricao) => ` Agendamento: ${descricao}.`,
  msg_agendamentoDefinido: (descricao) =>
    `Agendamento: ${descricao}. Gere os recursos do bundle para aplicar.`,
  msg_semContratos: "Nenhum contrato encontrado.",


  acao_perfilarTitulo: "Perfilar tabela",
  acao_novoContratoTitulo: "Novo contrato",
  acao_iaTitulo: "Gerar contrato com IA",
  acao_pastaTitulo: "Pasta dos contratos",
  acao_pastaPrompt: "Caminho relativo à raiz do repositório",
  acao_versaoTitulo: "Versão do databricks-labs-dqx",
  acao_versaoPrompt: "Versão instalada nos jobs serverless",
  acao_versaoInvalida: "Use o formato X.Y.Z",
  acao_executarTitulo: "Executar checks de qualidade",
  acao_executarPlaceholder: "Escolha o contrato",
  acao_abrirDatabricks: "Abrir no Databricks",
  acao_abrirArquivo: (nome) => `Abrir ${nome}`,
  acao_verRecursos: "Ver recursos",
  acao_comoConfigurar: "Como configurar",
  acao_contextoTitulo: "Contexto de negócio (opcional)",
  acao_contextoPrompt: "O que o time sabe sobre estes dados e que o modelo não descobriria sozinho?",
  acao_contextoPlaceholder: "ex.: vendas do varejo, valores em BRL, CPF obrigatório em pedido faturado",
  msg_dryRunSemChecks: "Adicione ao menos um check antes do dry-run.",
  msg_dryRunPreparando: "Preparando o dry-run…",
  msg_execucaoIniciada: (tabela) => `Execução iniciada para ${tabela}.`,
  msg_precisaWarehouse:
    "O agente precisa de um SQL warehouse para consultar os dados. Escolha um em Configuração.",
  msg_precisaVolume:
    "Escolha o volume de artefatos antes de gerar os recursos: é nele que os jobs gravam o resultado.",
  msg_abrirConfig: "Escolher agora",
  msg_abraPasta: "Abra a pasta do projeto para gerar os recursos do bundle.",
  msg_dashboardNaoEncontrado:
    "O arquivo do dashboard não foi encontrado em dq/dashboard/. Os filtros ficarão nos valores padrão.",
  msg_dashboardPulado: " O dashboard foi pulado: escolha um SQL warehouse para incluí-lo.",
  msg_catalogoRecarregado: (n) => `${n} check functions carregadas do DQX instalado.`,
  msg_checksImportados: (n, tabela) => `${n} checks importados para ${tabela}`,
  msg_iaPropos: (n, tabela) => `O agente propôs ${n} regras para ${tabela}`,


  ia_titulo: (n) => (n === 1 ? "Investigando os dados" : `Investigando ${n} tabelas`),
  ia_progresso: (atual, total, tabela) => `${atual} de ${total} · ${tabela}`,
  ia_escolherTabelasTitulo: (schema) => `Tabelas de ${schema}`,
  ia_escolherTabelasPlaceholder:
    "Cada tabela recebe o seu próprio contrato. Desmarque as que não quer analisar.",
  ia_confirmarLote: (n, minutos) =>
    `Analisar ${n} tabelas leva cerca de ${minutos} minutos, porque o agente investiga cada uma separadamente. Quer continuar?`,
  ia_confirmarLoteAcao: "Analisar tudo",
  ia_semTabelas: (schema) => `Nenhuma tabela analisável em ${schema}.`,
  ia_semPropostas: "o agente não propôs nenhuma regra",
  ia_limiteAtingido: "o agente atingiu o limite de passos",
  ia_nenhumContrato:
    "Nenhum contrato foi gerado. Veja o log para entender o que o agente encontrou.",
  ia_resumoLote: (regras, tabelas) =>
    `${regras} regras propostas em ${tabelas} tabelas. Revise cada aba antes de salvar.`,
  ia_semRegrasEm: (n) => `${n} tabela(s) ficaram sem regras.`,
  ia_tabelaDerivada: "gerada pelo DQX Forge",
  msg_semCatalogoChecks:
    "Não foi possível carregar o catálogo de checks do DQX. Rode 'DQX Forge: Recarregar catálogo de checks'.",
  msg_semModelosIde:
    "Nenhum modelo de linguagem disponível na IDE. Escolha um modelo do workspace em Configuração.",

  dim_completude: "completude",
  dim_validade: "validade",
  dim_acuracia: "acurácia",
  dim_unicidade: "unicidade",
  dim_consistencia: "consistência",
  dim_atualidade: "atualidade",
};

const en: Catalogo = {
  editor_carregando: "Loading contract…",
  editor_checks: (n) => `Checks (${n})`,
  editor_semChecks: "This contract has no checks yet.",
  editor_semChecksDica: "Pick one from the panel on the right to get started.",
  editor_naoSalvo: "unsaved",
  editor_salvo: "saved",

  saida_titulo: "What to do with failing rows",
  saida_anotar: "Annotate",
  saida_quarentena: "Quarantine",
  saida_anotarDica:
    "Keeps a single table and appends the _errors and _warnings columns. Nothing is blocked — useful to observe before acting.",
  saida_quarentenaDica:
    "Splits valid and failing rows into separate tables. Failing rows do not reach consumers.",
  saida_tabelaSaida: "output table",
  saida_tabelaQuarentena: "quarantine table",
  saida_tabelaMetricas: "metrics table",
  saida_tabelaMetricasDica: "optional — feeds the DQX dashboard",

  check_criticidade: "Criticality",
  check_remover: "remove",
  check_filtroDica: "Optional SQL — narrows the rows evaluated",
  check_opcional: (nome) => `${nome} (optional)`,

  catalogo_titulo: "Add check",
  catalogo_buscar: "Search by name or description",
  catalogo_todasDimensoes: "All dimensions",
  catalogo_sugerida: "suggested",
  catalogo_recomendadas: (dims) => `For this layer, we recommend covering ${dims}.`,
  catalogo_semResultado: "No check matches your search.",

  rodape_salvar: "Save to repository",
  rodape_salvoBotao: "Saved",
  rodape_dryRun: "Dry run",
  rodape_verYaml: "View YAML",
  rodape_errosImpedem: (n) =>
    n === 1 ? "1 error blocks saving" : `${n} errors block saving`,
  rodape_avisos: (n) => `${n} warning(s)`,

  dry_titulo: "Dry run results",
  dry_executando: "Running…",
  dry_aguarde: "Applying the checks on Databricks. It takes a few minutes the first time, since serverless compute starts from scratch.",
  dry_amostraLabel: "Sample",
  dry_amostraDica:
    "Percentage of the table to evaluate, sampled at random. Higher is more reliable — and slower.",
  dry_tabelaInteira: "entire table",
  dry_falhou: (motivo) => `Dry run failed: ${motivo}`,
  dry_resumo: (avaliadas, validas, reprovadas, avisos) =>
    `${avaliadas} rows evaluated · ${validas} passed · ${reprovadas} failed on error checks · ${avisos} with warnings`,
  dry_semViolacoes: "No check was violated in this sample.",
  dry_avisoAmostra: (percentual, amostradas, total) =>
    `This sample covers ${percentual}% of the table (${amostradas} of ${total} rows). Range and list checks generated by profiling inherit the limits of what was sampled and may reject valid data elsewhere — review min_limit, max_limit and value lists before publishing.`,
  dry_colCheck: "Check",
  dry_colColuna: "Column",
  dry_colViolacoes: "Violations",
  dry_exemplos: "Failing rows (sample)",


  setup_workspace: "Workspace",
  setup_volume: "Artifacts volume",
  setup_warehouse: "SQL warehouse",
  setup_modelo: "AI model",
  setup_pasta: "Contracts folder",
  setup_agendamento: "Schedule",
  setup_idioma: "Language",
  setup_versao: "DQX version",
  setup_ajudaWorkspace: "Profile from ~/.databrickscfg used to connect.",
  setup_ajudaVolume: "Where jobs write intermediate results.",
  setup_ajudaWarehouse: "Required by the AI agent and the dashboard.",
  setup_ajudaModelo: "Which model investigates the data and proposes the rules.",
  setup_ajudaPasta: "Where contracts are versioned in the repository.",
  setup_ajudaAgendamento: "How often the quality jobs run.",
  setup_ajudaIdioma: "DQX Forge interface language.",
  setup_ajudaVersao: "Version installed on the serverless jobs.",
  setup_naoConfigurado: "not configured",
  setup_automatico: (idioma) => `automatic · ${idioma}`,

  agenda_titulo: "Job schedule",
  agenda_placeholder: "How often the checks should run",
  agenda_emUso: "in use",
  agenda_15min: "Every 15 minutes",
  agenda_30min: "Every 30 minutes",
  agenda_horaEmHora: "Hourly",
  agenda_6h: "Every 6 hours",
  agenda_diario6: "Daily at 6am",
  agenda_util6: "Weekdays at 6am",
  agenda_semanal: "Every Monday at 6am",
  agenda_manual: "No schedule",
  agenda_manualDetalhe: "the job is deployed without a schedule and only runs when triggered",
  agenda_personalizado: "Quartz expression…",
  agenda_personalizadoDetalhe: "write the cron in the Databricks format",
  agenda_cronTitulo: "Quartz expression",
  agenda_cronPrompt: "6 or 7 fields: sec min hour day month day-of-week [year]",
  agenda_fusoTitulo: "Schedule time zone",
  agenda_fusoPlaceholder: "Time zone the cron is interpreted in",
  agenda_campos: [
    "seconds",
    "minutes",
    "hours",
    "day of month",
    "month",
    "day of week",
    "year",
  ],
  agenda_erroCampos: (n) =>
    `Quartz uses 6 or 7 space-separated fields, and you provided ${n}. The first field is seconds — the 5-field Unix cron does not apply here.`,
  agenda_erroInterrogacao: "'?' is only valid in day of month or day of week.",
  agenda_erroUmaInterrogacao:
    "Use '?' in exactly one of day of month and day of week; the other takes the value.",
  agenda_erroValor: (campo, token) => `Invalid value in ${campo}: "${token}".`,
  agenda_erroFaixa: (campo, min, max) => `The ${campo} field accepts values from ${min} to ${max}.`,

  pick_perfilTitulo: "Databricks profile",
  pick_perfilPlaceholder: "Select the workspace",
  pick_modeloTitulo: "Model for generating contracts with AI",
  pick_modeloPlaceholder: "Choose where the AI should run",
  pick_modeloNoWorkspace: "In the workspace (Databricks)",
  pick_modeloNaIde: "In the IDE",
  pick_modeloDetalheDb: "Runs on Databricks — no data leaves the workspace. Consumes DBUs.",
  pick_modeloDetalheIde:
    "Uses your IDE subscription, no Databricks cost. Data samples leave the workspace.",
  pick_modeloNaoPronto: "Endpoint is not ready right now.",
  pick_warehouseTitulo: "SQL warehouse",
  pick_warehousePlaceholder: "Used by the AI agent and the dashboard",
  pick_warehouseCriar: "Create a new warehouse",
  pick_warehouseCriarDetalhe: "2X-Small serverless, auto-stops after 10 min",
  pick_volumeCatalogo: "Catalog",
  pick_volumeSchema: "Schema",
  pick_volumeTitulo: "Volume",
  pick_volumePlaceholder: "Where jobs write their results",
  pick_idiomaTitulo: "Interface language",
  pick_idiomaPlaceholder: "Choose the language",
  pick_idiomaAuto: "Automatic",
  pick_idiomaAutoDetalhe: "Follows the VS Code language",
  pick_targetTitulo: "Bundle target",
  pick_targetPlaceholder: "Destination environment",
  pick_tabelaPrompt: "Full table name",
  pick_tabelaPlaceholder: "catalog.schema.table",
  pick_tabelaInvalida: "Use catalog.schema.table",

  msg_contratoSalvo: (caminho) => `Contract saved to ${caminho}.`,
  msg_idiomaAlterado: (idioma) => `Language: ${idioma}.`,
  msg_semPerfis: "No profile found in ~/.databrickscfg.",
  msg_semModelos:
    "No model available. Check your access to the workspace Foundation Model APIs, or enable Copilot in the IDE.",
  msg_semWarehouse:
    "No SQL warehouse in the workspace. The AI agent and the dashboard need one.",
  msg_criarAgora: "Create one now",
  msg_verDetalhes: "View details",
  msg_publicado: (target) => `Bundle deployed to target ${target}.`,
  msg_falhaValidacao: "The bundle failed validation. Nothing was deployed.",
  msg_falhaPublicar: (target) => `Failed to deploy to target ${target}.`,
  msg_recursosGerados: (arquivos, contratos) =>
    `${arquivos} file(s) generated for ${contratos} contract(s).`,
  msg_agendamentoAplicado: (descricao) => ` Schedule: ${descricao}.`,
  msg_agendamentoDefinido: (descricao) =>
    `Schedule: ${descricao}. Generate the bundle resources to apply it.`,
  msg_semContratos: "No contract found.",


  acao_perfilarTitulo: "Profile table",
  acao_novoContratoTitulo: "New contract",
  acao_iaTitulo: "Generate contract with AI",
  acao_pastaTitulo: "Contracts folder",
  acao_pastaPrompt: "Path relative to the repository root",
  acao_versaoTitulo: "databricks-labs-dqx version",
  acao_versaoPrompt: "Version installed on the serverless jobs",
  acao_versaoInvalida: "Use the format X.Y.Z",
  acao_executarTitulo: "Run quality checks",
  acao_executarPlaceholder: "Choose the contract",
  acao_abrirDatabricks: "Open in Databricks",
  acao_abrirArquivo: (nome) => `Open ${nome}`,
  acao_verRecursos: "View resources",
  acao_comoConfigurar: "How to set up",
  acao_contextoTitulo: "Business context (optional)",
  acao_contextoPrompt: "What does your team know about this data that the model would not find on its own?",
  acao_contextoPlaceholder: "e.g. retail sales, amounts in BRL, tax ID required on invoiced orders",
  msg_dryRunSemChecks: "Add at least one check before running a dry run.",
  msg_dryRunPreparando: "Preparing the dry run…",
  msg_execucaoIniciada: (tabela) => `Run started for ${tabela}.`,
  msg_precisaWarehouse:
    "The agent needs a SQL warehouse to query the data. Pick one under Setup.",
  msg_precisaVolume:
    "Pick the artifacts volume before generating the resources: that is where the jobs write their results.",
  msg_abrirConfig: "Choose now",
  msg_abraPasta: "Open the project folder to generate the bundle resources.",
  msg_dashboardNaoEncontrado:
    "The dashboard file was not found in dq/dashboard/. Filters will keep their default values.",
  msg_dashboardPulado: " The dashboard was skipped: pick a SQL warehouse to include it.",
  msg_catalogoRecarregado: (n) => `${n} check functions loaded from the installed DQX.`,
  msg_checksImportados: (n, tabela) => `${n} checks imported into ${tabela}`,
  msg_iaPropos: (n, tabela) => `The agent proposed ${n} rules for ${tabela}`,


  ia_titulo: (n) => (n === 1 ? "Investigating the data" : `Investigating ${n} tables`),
  ia_progresso: (atual, total, tabela) => `${atual} of ${total} · ${tabela}`,
  ia_escolherTabelasTitulo: (schema) => `Tables in ${schema}`,
  ia_escolherTabelasPlaceholder:
    "Each table gets its own contract. Uncheck the ones you don't want analysed.",
  ia_confirmarLote: (n, minutos) =>
    `Analysing ${n} tables takes around ${minutos} minutes, since the agent investigates each one separately. Continue?`,
  ia_confirmarLoteAcao: "Analyse all",
  ia_semTabelas: (schema) => `No analysable table in ${schema}.`,
  ia_semPropostas: "the agent proposed no rules",
  ia_limiteAtingido: "the agent hit its step limit",
  ia_nenhumContrato: "No contract was generated. Check the log to see what the agent found.",
  ia_resumoLote: (regras, tabelas) =>
    `${regras} rules proposed across ${tabelas} tables. Review each tab before saving.`,
  ia_semRegrasEm: (n) => `${n} table(s) ended up with no rules.`,
  ia_tabelaDerivada: "generated by DQX Forge",
  msg_semCatalogoChecks:
    "Could not load the DQX check catalog. Run 'DQX Forge: Reload DQX check catalog'.",
  msg_semModelosIde:
    "No language model available in the IDE. Pick a workspace model under Setup.",

  dim_completude: "completeness",
  dim_validade: "validity",
  dim_acuracia: "accuracy",
  dim_unicidade: "uniqueness",
  dim_consistencia: "consistency",
  dim_atualidade: "timeliness",
};

const es: Catalogo = {
  editor_carregando: "Cargando el contrato…",
  editor_checks: (n) => `Checks (${n})`,
  editor_semChecks: "Este contrato aún no tiene checks.",
  editor_semChecksDica: "Elige uno en el panel de la derecha para empezar.",
  editor_naoSalvo: "sin guardar",
  editor_salvo: "guardado",

  saida_titulo: "Qué hacer con las filas rechazadas",
  saida_anotar: "Anotar",
  saida_quarentena: "Cuarentena",
  saida_anotarDica:
    "Mantiene una sola tabla y añade las columnas _errors y _warnings. No se bloquea nada — útil para observar antes de actuar.",
  saida_quarentenaDica:
    "Separa las filas válidas de las rechazadas en tablas distintas. Las rechazadas no llegan al consumo.",
  saida_tabelaSaida: "tabla de salida",
  saida_tabelaQuarentena: "tabla de cuarentena",
  saida_tabelaMetricas: "tabla de métricas",
  saida_tabelaMetricasDica: "opcional — alimenta el panel de DQX",

  check_criticidade: "Criticidad",
  check_remover: "quitar",
  check_filtroDica: "SQL opcional — restringe las filas evaluadas",
  check_opcional: (nome) => `${nome} (opcional)`,

  catalogo_titulo: "Añadir check",
  catalogo_buscar: "Buscar por nombre o descripción",
  catalogo_todasDimensoes: "Todas las dimensiones",
  catalogo_sugerida: "sugerida",
  catalogo_recomendadas: (dims) => `Para esta capa, se recomienda cubrir ${dims}.`,
  catalogo_semResultado: "Ningún check coincide con la búsqueda.",

  rodape_salvar: "Guardar en el repositorio",
  rodape_salvoBotao: "Guardado",
  rodape_dryRun: "Dry run",
  rodape_verYaml: "Ver YAML",
  rodape_errosImpedem: (n) =>
    n === 1 ? "1 error impide guardar" : `${n} errores impiden guardar`,
  rodape_avisos: (n) => `${n} aviso(s)`,

  dry_titulo: "Resultado del dry run",
  dry_executando: "Ejecutando…",
  dry_aguarde: "Aplicando los checks en Databricks. Tarda unos minutos la primera vez, porque el compute serverless arranca desde cero.",
  dry_amostraLabel: "Muestra",
  dry_amostraDica:
    "Porcentaje de la tabla a evaluar, tomado al azar. Cuanto mayor, más fiable — y más lento.",
  dry_tabelaInteira: "tabla completa",
  dry_falhou: (motivo) => `El dry run falló: ${motivo}`,
  dry_resumo: (avaliadas, validas, reprovadas, avisos) =>
    `${avaliadas} filas evaluadas · ${validas} aprobadas · ${reprovadas} rechazadas por checks error · ${avisos} con aviso`,
  dry_semViolacoes: "Ningún check fue violado en esta muestra.",
  dry_avisoAmostra: (percentual, amostradas, total) =>
    `Esta muestra cubre el ${percentual}% de la tabla (${amostradas} de ${total} filas). Los checks de rango y de lista generados por profiling heredan los límites de lo muestreado y pueden rechazar datos válidos en el resto — revisa min_limit, max_limit y las listas de valores antes de publicar.`,
  dry_colCheck: "Check",
  dry_colColuna: "Columna",
  dry_colViolacoes: "Violaciones",
  dry_exemplos: "Filas rechazadas (muestra)",


  setup_workspace: "Workspace",
  setup_volume: "Volumen de artefactos",
  setup_warehouse: "SQL warehouse",
  setup_modelo: "Modelo de IA",
  setup_pasta: "Carpeta de contratos",
  setup_agendamento: "Programación",
  setup_idioma: "Idioma",
  setup_versao: "Versión de DQX",
  setup_ajudaWorkspace: "Perfil de ~/.databrickscfg usado para conectar.",
  setup_ajudaVolume: "Donde los jobs escriben los resultados intermedios.",
  setup_ajudaWarehouse: "Necesario para el agente de IA y para el panel.",
  setup_ajudaModelo: "Qué modelo investiga los datos y propone las reglas.",
  setup_ajudaPasta: "Donde se versionan los contratos en el repositorio.",
  setup_ajudaAgendamento: "Con qué frecuencia se ejecutan los jobs de calidad.",
  setup_ajudaIdioma: "Idioma de la interfaz de DQX Forge.",
  setup_ajudaVersao: "Versión instalada en los jobs serverless.",
  setup_naoConfigurado: "sin configurar",
  setup_automatico: (idioma) => `automático · ${idioma}`,

  agenda_titulo: "Programación de los jobs",
  agenda_placeholder: "Con qué frecuencia deben ejecutarse los checks",
  agenda_emUso: "en uso",
  agenda_15min: "Cada 15 minutos",
  agenda_30min: "Cada 30 minutos",
  agenda_horaEmHora: "Cada hora",
  agenda_6h: "Cada 6 horas",
  agenda_diario6: "Todos los días a las 6h",
  agenda_util6: "Días laborables a las 6h",
  agenda_semanal: "Todos los lunes a las 6h",
  agenda_manual: "Sin programación",
  agenda_manualDetalhe: "el job se publica sin schedule y solo se ejecuta al dispararlo",
  agenda_personalizado: "Expresión Quartz…",
  agenda_personalizadoDetalhe: "escribe el cron en el formato de Databricks",
  agenda_cronTitulo: "Expresión Quartz",
  agenda_cronPrompt: "6 o 7 campos: seg min hora día mes día-de-la-semana [año]",
  agenda_fusoTitulo: "Zona horaria de la programación",
  agenda_fusoPlaceholder: "Zona en la que se interpreta el cron",
  agenda_campos: [
    "segundos",
    "minutos",
    "horas",
    "día del mes",
    "mes",
    "día de la semana",
    "año",
  ],
  agenda_erroCampos: (n) =>
    `Quartz usa 6 o 7 campos separados por espacios, e indicaste ${n}. El primer campo es segundos — el cron Unix de 5 campos no sirve aquí.`,
  agenda_erroInterrogacao: "El '?' solo vale en día del mes o día de la semana.",
  agenda_erroUmaInterrogacao:
    "Usa '?' en exactamente uno entre día del mes y día de la semana; el otro recibe el valor.",
  agenda_erroValor: (campo, token) => `Valor inválido en ${campo}: "${token}".`,
  agenda_erroFaixa: (campo, min, max) => `El campo ${campo} acepta valores de ${min} a ${max}.`,

  pick_perfilTitulo: "Perfil de Databricks",
  pick_perfilPlaceholder: "Selecciona el workspace",
  pick_modeloTitulo: "Modelo para generar contratos con IA",
  pick_modeloPlaceholder: "Elige dónde se ejecuta la IA",
  pick_modeloNoWorkspace: "En el workspace (Databricks)",
  pick_modeloNaIde: "En el IDE",
  pick_modeloDetalheDb: "Se ejecuta en Databricks — ningún dato sale del workspace. Consume DBUs.",
  pick_modeloDetalheIde:
    "Usa tu suscripción del IDE, sin coste en Databricks. Las muestras de datos salen del workspace.",
  pick_modeloNaoPronto: "El endpoint no está listo en este momento.",
  pick_warehouseTitulo: "SQL warehouse",
  pick_warehousePlaceholder: "Usado por el agente de IA y el panel",
  pick_warehouseCriar: "Crear un nuevo warehouse",
  pick_warehouseCriarDetalhe: "2X-Small serverless, se apaga solo en 10 min",
  pick_volumeCatalogo: "Catálogo",
  pick_volumeSchema: "Schema",
  pick_volumeTitulo: "Volumen",
  pick_volumePlaceholder: "Donde los jobs escriben sus resultados",
  pick_idiomaTitulo: "Idioma de la interfaz",
  pick_idiomaPlaceholder: "Elige el idioma",
  pick_idiomaAuto: "Automático",
  pick_idiomaAutoDetalhe: "Sigue el idioma de VS Code",
  pick_targetTitulo: "Target del bundle",
  pick_targetPlaceholder: "Entorno de destino",
  pick_tabelaPrompt: "Nombre completo de la tabla",
  pick_tabelaPlaceholder: "catalog.schema.tabla",
  pick_tabelaInvalida: "Usa catalog.schema.tabla",

  msg_contratoSalvo: (caminho) => `Contrato guardado en ${caminho}.`,
  msg_idiomaAlterado: (idioma) => `Idioma: ${idioma}.`,
  msg_semPerfis: "No se encontró ningún perfil en ~/.databrickscfg.",
  msg_semModelos:
    "Ningún modelo disponible. Revisa tu acceso a las Foundation Model APIs del workspace o activa Copilot en el IDE.",
  msg_semWarehouse:
    "No hay ningún SQL warehouse en el workspace. El agente de IA y el panel necesitan uno.",
  msg_criarAgora: "Crear uno ahora",
  msg_verDetalhes: "Ver detalles",
  msg_publicado: (target) => `Bundle publicado en el target ${target}.`,
  msg_falhaValidacao: "El bundle no pasó la validación. No se publicó nada.",
  msg_falhaPublicar: (target) => `Error al publicar en el target ${target}.`,
  msg_recursosGerados: (arquivos, contratos) =>
    `${arquivos} archivo(s) generado(s) para ${contratos} contrato(s).`,
  msg_agendamentoAplicado: (descricao) => ` Programación: ${descricao}.`,
  msg_agendamentoDefinido: (descricao) =>
    `Programación: ${descricao}. Genera los recursos del bundle para aplicarla.`,
  msg_semContratos: "No se encontró ningún contrato.",


  acao_perfilarTitulo: "Perfilar tabla",
  acao_novoContratoTitulo: "Nuevo contrato",
  acao_iaTitulo: "Generar contrato con IA",
  acao_pastaTitulo: "Carpeta de contratos",
  acao_pastaPrompt: "Ruta relativa a la raíz del repositorio",
  acao_versaoTitulo: "Versión de databricks-labs-dqx",
  acao_versaoPrompt: "Versión instalada en los jobs serverless",
  acao_versaoInvalida: "Usa el formato X.Y.Z",
  acao_executarTitulo: "Ejecutar checks de calidad",
  acao_executarPlaceholder: "Elige el contrato",
  acao_abrirDatabricks: "Abrir en Databricks",
  acao_abrirArquivo: (nome) => `Abrir ${nome}`,
  acao_verRecursos: "Ver recursos",
  acao_comoConfigurar: "Cómo configurar",
  acao_contextoTitulo: "Contexto de negocio (opcional)",
  acao_contextoPrompt: "¿Qué sabe el equipo sobre estos datos que el modelo no descubriría solo?",
  acao_contextoPlaceholder: "ej.: ventas minoristas, importes en BRL, CPF obligatorio en pedido facturado",
  msg_dryRunSemChecks: "Añade al menos un check antes del dry run.",
  msg_dryRunPreparando: "Preparando el dry run…",
  msg_execucaoIniciada: (tabela) => `Ejecución iniciada para ${tabela}.`,
  msg_precisaWarehouse:
    "El agente necesita un SQL warehouse para consultar los datos. Elige uno en Configuración.",
  msg_precisaVolume:
    "Elige el volumen de artefactos antes de generar los recursos: es donde los jobs escriben su resultado.",
  msg_abrirConfig: "Elegir ahora",
  msg_abraPasta: "Abre la carpeta del proyecto para generar los recursos del bundle.",
  msg_dashboardNaoEncontrado:
    "No se encontró el archivo del panel en dq/dashboard/. Los filtros mantendrán sus valores por defecto.",
  msg_dashboardPulado: " Se omitió el panel: elige un SQL warehouse para incluirlo.",
  msg_catalogoRecarregado: (n) => `${n} check functions cargadas del DQX instalado.`,
  msg_checksImportados: (n, tabela) => `${n} checks importados en ${tabela}`,
  msg_iaPropos: (n, tabela) => `El agente propuso ${n} reglas para ${tabela}`,


  ia_titulo: (n) => (n === 1 ? "Investigando los datos" : `Investigando ${n} tablas`),
  ia_progresso: (atual, total, tabela) => `${atual} de ${total} · ${tabela}`,
  ia_escolherTabelasTitulo: (schema) => `Tablas de ${schema}`,
  ia_escolherTabelasPlaceholder:
    "Cada tabla recibe su propio contrato. Desmarca las que no quieras analizar.",
  ia_confirmarLote: (n, minutos) =>
    `Analizar ${n} tablas tarda unos ${minutos} minutos, porque el agente investiga cada una por separado. ¿Continuar?`,
  ia_confirmarLoteAcao: "Analizar todo",
  ia_semTabelas: (schema) => `Ninguna tabla analizable en ${schema}.`,
  ia_semPropostas: "el agente no propuso ninguna regla",
  ia_limiteAtingido: "el agente alcanzó el límite de pasos",
  ia_nenhumContrato:
    "No se generó ningún contrato. Revisa el registro para ver qué encontró el agente.",
  ia_resumoLote: (regras, tabelas) =>
    `${regras} reglas propuestas en ${tabelas} tablas. Revisa cada pestaña antes de guardar.`,
  ia_semRegrasEm: (n) => `${n} tabla(s) quedaron sin reglas.`,
  ia_tabelaDerivada: "generada por DQX Forge",
  msg_semCatalogoChecks:
    "No se pudo cargar el catálogo de checks de DQX. Ejecuta 'DQX Forge: Recargar catálogo de checks de DQX'.",
  msg_semModelosIde:
    "Ningún modelo de lenguaje disponible en el IDE. Elige un modelo del workspace en Configuración.",

  dim_completude: "completitud",
  dim_validade: "validez",
  dim_acuracia: "exactitud",
  dim_unicidade: "unicidad",
  dim_consistencia: "consistencia",
  dim_atualidade: "actualidad",
};

const CATALOGOS: Record<Idioma, Catalogo> = { "pt-br": ptBr, en, es };

export function catalogo(idioma: Idioma): Catalogo {
  return CATALOGOS[idioma] ?? ptBr;
}

/** Traduz o código de idioma da IDE para um dos suportados. */
export function resolverIdioma(preferido: string, idiomaDaIde: string): Idioma {
  if (preferido === "pt-br" || preferido === "en" || preferido === "es") {
    return preferido;
  }
  const base = idiomaDaIde.toLowerCase();
  if (base.startsWith("pt")) {
    return "pt-br";
  }
  if (base.startsWith("es")) {
    return "es";
  }
  return "en";
}
