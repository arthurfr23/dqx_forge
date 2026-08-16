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
  msg_semHostParaBundle: string;
  msg_bundleCriado: string;
  msg_falhaCriarVolume: (schema: string, detalhe: string) => string;
  msg_falhaCriarWarehouse: (detalhe: string) => string;
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
  dim_completeness: string;
  dim_validity: string;
  dim_accuracy: string;
  dim_uniqueness: string;
  dim_consistency: string;
  dim_timeliness: string;

  // execução de jobs
  job_enviandoScript: string;
  job_iniciando: string;
  job_aguardandoCompute: string;
  job_executandoNoDatabricks: string;
  job_finalizando: string;
  job_executando: string;
  job_estado: (estado: string) => string;
  job_lendoResultado: string;
  job_falhou: (detalhe: string) => string;
  job_cancelado: string;

  // bundle e CLI
  bundle_validando: string;
  bundle_publicando: (target: string) => string;
  bundle_disparando: (job: string) => string;
  bundle_lendoEstado: string;
  bundle_semArquivo: string;
  bundle_naoIniciou: (detalhe: string) => string;

  // catálogo de checks
  cat_lendo: string;
  cat_naoLeu: string;
  cat_versaoDivergente: (instalada: string, configurada: string) => string;

  // árvore do Unity Catalog
  arvore_semCatalogoFiltro: string;
  arvore_semCatalogo: string;
  arvore_falhaConectar: string;
  arvore_erroCatalogo: string;
  arvore_selecionarPerfil: string;

  // contratos: leitura, validação e importação
  ctr_abraPastaParaSalvar: string;
  ctr_semWarehouse: string;
  ctr_semListaDeChecks: string;
  ctr_formatoDesconhecido: string;
  ctr_nenhumCheckValido: string;
  ctr_semMetaTable: string;
  ctr_semChecks: string;
  ctr_funcaoObrigatoria: string;
  ctr_tabelaSemLinhas: (tabela: string) => string;
  ctr_nenhumCheckEm: (tabela: string) => string;
  ctr_itemNaoObjeto: (indice: number) => string;
  ctr_itemSemFuncao: (indice: number) => string;
  ctr_nomeTabelaInvalido: (nome: string) => string;

  // autenticação
  auth_semAccessToken: string;
  auth_falhaGravar: (caminho: string, status: number, detalhe: string) => string;
  auth_falhaRequisicao: (metodo: string, caminho: string, status: number, detalhe: string) => string;

  // importação
  imp_titulo: string;
  imp_placeholder: string;
  imp_arquivo: string;
  imp_arquivoDescricao: string;
  imp_arquivoDetalhe: string;
  imp_odcsDetalhe: string;
  imp_tabela: string;
  imp_tabelaDescricao: string;
  imp_tabelaDetalhe: string;
  imp_tabelaChecksTitulo: string;
  imp_tabelaChecksPrompt: string;
  imp_semTabela: string;
  imp_semArquivo: string;
  imp_arquivoTitulo: string;
  imp_odcsTitulo: string;
  imp_convertendo: (nome: string) => string;
  imp_semChecksNoContrato: string;
  imp_aQualTabela: string;
  imp_falhou: (detalhe: string) => string;
  imp_nenhumAprovado: string;
  imp_comObservacao: (n: number) => string;
  imp_origemArquivo: string;
  imp_origemOdcs: string;
  imp_origemTabela: string;

  // mensagens de erro das ações
  erro_profiling: (detalhe: string) => string;
  erro_agente: (detalhe: string) => string;
  erro_gerarRecursos: (detalhe: string) => string;
  erro_lerCatalogo: (detalhe: string) => string;
  erro_alvoInvalido: string;
  erro_informeCaminho: string;
  erro_informeNome: string;
  msg_copiado: (nome: string) => string;
  msg_criandoWarehouse: string;
  msg_nomeWarehouse: string;
  msg_profilingFalhou: string;
  msg_erroDesconhecido: string;

  // log do canal de saída
  log_agente: (tabela: string, provider: string) => string;
  log_erro: (mensagem: string) => string;
  log_semTexto: string;
  log_descartadas: (n: number) => string;
  log_resumoGeracao: string;
  log_resumoLinha: (tabela: string, aceitos: number, rejeitados: number) => string;
  log_profiling: (tabela: string, checks: number, segundos: string) => string;
  log_dryRun: (tabela: string, checks: number, percentual: number) => string;
  log_dryRunResumo: (erro: string, total: string, segundos: string) => string;
  log_importacao: (fonte: string, tabela: string, aceitos: number, rejeitados: number) => string;
  log_respostaModelo: (texto: string) => string;
  log_semRegra: (tabela: string, motivo: string) => string;
  log_dryRunFalhou: (motivo: string) => string;
  msg_warehouseCriado: (nome: string) => string;
  dry_escopoAmostra: (percentual: number) => string;
  dry_titulo_progresso: (tabela: string, escopo: string) => string;
  msg_motivoDesconhecido: string;

  /** Código de localidade usado para formatar números nas explicações. */
  locale: string;
  perfil_semNulos: (total: string) => string;
  perfil_percentualNulos: (percentual: string) => string;
  perfil_faixa: (min: string, max: string) => string;
  perfil_distintos: (distintos: string, total: string) => string;
  /** Instrução acrescentada ao prompt do agente, para ele responder no idioma da interface. */
  ia_idiomaDaResposta: string;
  ia_justificativaLm: string;
  ia_passoListando: (schema: string) => string;
  ia_passoDescrevendo: (tabela: string) => string;
  ia_passoAmostrando: (tabela: string) => string;
  ia_passoAnalisando: (coluna: string, tabela: string) => string;
  ia_passoSql: string;
  ia_passoRegistrando: string;
  ia_passoFechando: string;
  ia_passoGenerico: (nome: string) => string;
  dash_semContrato: string;
  status_tooltip: string;
  auth_perfilNaoEncontrado: (perfil: string) => string;
  auth_perfilSemHost: (perfil: string) => string;
  ctr_argumentoDesconhecido: (funcao: string, argumento: string) => string;
  msg_perfilando: (tabela: string) => string;
  msg_modeloDefinido: (rotulo: string) => string;
  arvore_semSchema: string;
  arvore_semColuna: string;
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
  msg_semHostParaBundle:
    "Este projeto ainda não tem databricks.yml e eu preciso do host do workspace para criá-lo. Escolha o perfil do Databricks.",
  msg_bundleCriado: " O databricks.yml foi criado na raiz do projeto — revise os targets antes de publicar.",
  msg_falhaCriarVolume: (schema, detalhe) =>
    `Não foi possível criar o volume em ${schema}. É preciso CREATE VOLUME no schema — peça ao administrador ou escolha um volume existente. Detalhe: ${detalhe}`,
  msg_falhaCriarWarehouse: (detalhe) =>
    `Não foi possível criar o warehouse. Criar SQL warehouse costuma exigir permissão de administrador — peça acesso ou escolha um existente. Detalhe: ${detalhe}`,
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

  dim_completeness: "completude",
  dim_validity: "validade",
  dim_accuracy: "acurácia",
  dim_uniqueness: "unicidade",
  dim_consistency: "consistência",
  dim_timeliness: "atualidade",

  job_enviandoScript: "Enviando o script para o workspace…",
  job_iniciando: "Iniciando o job serverless…",
  job_aguardandoCompute: "Aguardando o compute serverless…",
  job_executandoNoDatabricks: "Executando no Databricks…",
  job_finalizando: "Finalizando…",
  job_executando: "Executando…",
  job_estado: (estado) => `Estado: ${estado}`,
  job_lendoResultado: "Lendo o resultado…",
  job_falhou: (detalhe) => `O job falhou: ${detalhe}`,
  job_cancelado: "Execução cancelada.",

  bundle_validando: "Validando o bundle…",
  bundle_publicando: (target) => `Publicando no target ${target}…`,
  bundle_disparando: (job) => `Disparando ${job}…`,
  bundle_lendoEstado: "Lendo o estado do bundle…",
  bundle_semArquivo: "Não encontrei o databricks.yml. Abra a pasta do projeto.",
  bundle_naoIniciou: (detalhe) => `Não foi possível iniciar: ${detalhe}`,

  cat_lendo: "Lendo os checks do DQX",
  cat_naoLeu: "Não foi possível ler o catálogo de checks.",
  cat_versaoDivergente: (instalada, configurada) =>
    `O workspace rodou o DQX ${instalada}, mas a configuração fixa ${configurada}.`,

  arvore_semCatalogoFiltro: "Nenhum catálogo corresponde ao filtro",
  arvore_semCatalogo: "Nenhum catálogo acessível",
  arvore_falhaConectar: "Falha ao conectar no workspace",
  arvore_erroCatalogo: "Erro ao ler o catálogo",
  arvore_selecionarPerfil: "Selecionar perfil",

  ctr_abraPastaParaSalvar: "Abra a pasta do projeto para salvar contratos versionados.",
  ctr_semWarehouse:
    "Ler uma tabela de checks exige um SQL warehouse. Escolha um em Configuração.",
  ctr_semListaDeChecks:
    "Não encontrei uma lista de checks. Esperado um array de checks ou um objeto com a chave 'checks'.",
  ctr_formatoDesconhecido: "Formato não reconhecido.",
  ctr_nenhumCheckValido: "Nenhum check válido foi encontrado no arquivo.",
  ctr_semMetaTable: "Contrato sem meta.table — a extensão não sabe a que tabela ele pertence.",
  ctr_semChecks: "Contrato sem lista de checks.",
  ctr_funcaoObrigatoria: "check.function é obrigatório.",
  ctr_tabelaSemLinhas: (tabela) => `A tabela ${tabela} não tem linhas.`,
  ctr_nenhumCheckEm: (tabela) => `Nenhum check válido em ${tabela}.`,
  ctr_itemNaoObjeto: (indice) => `Item ${indice} ignorado: não é um objeto.`,
  ctr_itemSemFuncao: (indice) => `Item ${indice} ignorado: não tem check.function.`,
  ctr_nomeTabelaInvalido: (nome) => `Nome de tabela inválido: ${nome}`,

  auth_semAccessToken: "O CLI da Databricks não retornou um access_token.",
  auth_falhaGravar: (caminho, status, detalhe) =>
    `Falha ao gravar em ${caminho} (${status}): ${detalhe}`,
  auth_falhaRequisicao: (metodo, caminho, status, detalhe) =>
    `${metodo} ${caminho} falhou com ${status}: ${detalhe}`,

  imp_titulo: "De onde vêm os checks?",
  imp_placeholder: "Escolha a origem",
  imp_arquivo: "Arquivo de checks do DQX",
  imp_arquivoDescricao: "YAML ou JSON",
  imp_arquivoDetalhe:
    "Uma lista de checks no formato do DQX, ou um contrato já exportado pelo DQX Forge.",
  imp_odcsDetalhe:
    "O DQX deriva as regras do schema e da seção quality do contrato. Roda no Databricks.",
  imp_tabela: "Tabela de checks no Unity Catalog",
  imp_tabelaDescricao: "migração de quem já usa DQX",
  imp_tabelaDetalhe: "Lê a tabela Delta onde as regras estão hoje e traz para o repositório.",
  imp_tabelaChecksTitulo: "Tabela de checks",
  imp_tabelaChecksPrompt: "Tabela Delta onde as regras estão hoje",
  imp_semTabela: "Nenhuma tabela informada.",
  imp_semArquivo: "Nenhum arquivo escolhido.",
  imp_arquivoTitulo: "Arquivo de checks",
  imp_odcsTitulo: "Contrato ODCS",
  imp_convertendo: (nome) => `Convertendo ${nome}`,
  imp_semChecksNoContrato: "O contrato não gerou nenhum check.",
  imp_aQualTabela: "A que tabela estes checks se aplicam?",
  imp_falhou: (detalhe) => `Não foi possível importar: ${detalhe}`,
  imp_nenhumAprovado: "Nenhum check importado passou na validação. Veja o log para os motivos.",
  imp_comObservacao: (n) => ` (${n} item(ns) com observação).`,
  imp_origemArquivo: "Importado de um arquivo de checks.",
  imp_origemOdcs: "Derivado de um data contract ODCS pelo DQX.",
  imp_origemTabela: "Importado de uma tabela de checks do Unity Catalog.",

  erro_profiling: (detalhe) => `Profiling falhou: ${detalhe}`,
  erro_agente: (detalhe) => `O agente falhou: ${detalhe}`,
  erro_gerarRecursos: (detalhe) => `Não foi possível gerar os recursos: ${detalhe}`,
  erro_lerCatalogo: (detalhe) => `Não foi possível ler o catálogo: ${detalhe}`,
  erro_alvoInvalido: "Informe catalog.schema ou catalog.schema.tabela.",
  erro_informeCaminho: "Informe um caminho",
  erro_informeNome: "Informe um nome",
  msg_copiado: (nome) => `Copiado: ${nome}`,
  msg_criandoWarehouse: "Criando o warehouse…",
  msg_nomeWarehouse: "Nome do warehouse",
  msg_profilingFalhou: "O profiling falhou.",
  msg_erroDesconhecido: "erro desconhecido",

  log_agente: (tabela, provider) => `\n=== agente de IA em ${tabela} (${provider}) ===`,
  log_erro: (mensagem) => `  erro: ${mensagem}`,
  log_semTexto: "\n  o modelo não devolveu texto nenhum",
  log_descartadas: (n) => `\n${n} proposta(s) descartada(s) na validação:`,
  log_resumoGeracao: "\n=== resumo da geração ===",
  log_resumoLinha: (tabela, aceitos, rejeitados) =>
    `  ${tabela}: ${aceitos} regras (${rejeitados} descartadas)`,
  log_profiling: (tabela, checks, segundos) =>
    `\n=== ${tabela} — ${checks} checks em ${segundos}s`,
  log_dryRun: (tabela, checks, percentual) =>
    `\n=== dry-run em ${tabela} · ${checks} checks · ${percentual}% ===`,
  log_dryRunResumo: (erro, total, segundos) =>
    `  ${erro} de ${total} linhas reprovadas em ${segundos}s`,
  log_importacao: (fonte, tabela, aceitos, rejeitados) =>
    `\n=== importação (${fonte}) para ${tabela}: ${aceitos} aceitos, ${rejeitados} rejeitados ===`,
  log_respostaModelo: (texto) => `\n  resposta do modelo:\n${texto}`,
  log_semRegra: (tabela, motivo) => `  ${tabela}: nenhuma regra — ${motivo}`,
  log_dryRunFalhou: (motivo) => `  falhou: ${motivo}`,
  msg_warehouseCriado: (nome) => `Warehouse "${nome}" criado.`,
  dry_escopoAmostra: (percentual) => `amostra de ${percentual}%`,
  dry_titulo_progresso: (tabela, escopo) => `Dry-run em ${tabela} (${escopo})`,
  msg_motivoDesconhecido: "motivo desconhecido",

  locale: "pt-BR",
  perfil_semNulos: (total) => `Nenhum nulo em ${total} linhas amostradas.`,
  perfil_percentualNulos: (percentual) => `${percentual}% de nulos na amostra.`,
  perfil_faixa: (min, max) => `Faixa observada: ${min} a ${max}.`,
  perfil_distintos: (distintos, total) => `${distintos} valores distintos em ${total} linhas.`,
  ia_idiomaDaResposta:
    "Escreva em português do Brasil todo texto destinado a pessoas: a justificativa de cada regra e o resumo final.",
  ia_justificativaLm: "Gerar regras de qualidade de dados a partir do seu Lakehouse.",
  ia_passoListando: (schema) => `Listando tabelas de ${schema}…`,
  ia_passoDescrevendo: (tabela) => `Lendo o schema de ${tabela}…`,
  ia_passoAmostrando: (tabela) => `Amostrando ${tabela}…`,
  ia_passoAnalisando: (coluna, tabela) => `Analisando a coluna ${coluna} de ${tabela}…`,
  ia_passoSql: "Confirmando uma hipótese com SQL…",
  ia_passoRegistrando: "Registrando as regras propostas…",
  ia_passoFechando: "Pedindo ao modelo que feche com as regras que já tem…",
  ia_passoGenerico: (nome) => `Executando ${nome}…`,
  dash_semContrato: "Nenhum contrato disponível para configurar o dashboard.",
  status_tooltip: "Perfil do Databricks usado pelo DQX Forge — clique para trocar",
  auth_perfilNaoEncontrado: (perfil) =>
    `Perfil "${perfil}" não encontrado em ~/.databrickscfg. Configure-o na extensão oficial da Databricks ou rode "databricks auth login".`,
  auth_perfilSemHost: (perfil) => `Perfil "${perfil}" não define um host.`,
  ctr_argumentoDesconhecido: (funcao, argumento) =>
    `"${funcao}" não recebe o argumento "${argumento}".`,
  msg_perfilando: (tabela) => `Perfilando ${tabela}`,
  msg_modeloDefinido: (rotulo) => `Modelo de IA: ${rotulo}.`,
  arvore_semSchema: "Nenhum schema acessível",
  arvore_semColuna: "Nenhuma coluna",
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
  msg_semHostParaBundle:
    "This project has no databricks.yml yet, and I need the workspace host to create one. Pick the Databricks profile.",
  msg_bundleCriado: " databricks.yml was created at the project root — review the targets before deploying.",
  msg_falhaCriarVolume: (schema, detalhe) =>
    `Could not create the volume in ${schema}. It requires CREATE VOLUME on the schema — ask your administrator or pick an existing volume. Detail: ${detalhe}`,
  msg_falhaCriarWarehouse: (detalhe) =>
    `Could not create the warehouse. Creating a SQL warehouse usually requires admin permission — request access or pick an existing one. Detail: ${detalhe}`,
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

  dim_completeness: "completeness",
  dim_validity: "validity",
  dim_accuracy: "accuracy",
  dim_uniqueness: "uniqueness",
  dim_consistency: "consistency",
  dim_timeliness: "timeliness",

  job_enviandoScript: "Uploading the script to the workspace…",
  job_iniciando: "Starting the serverless job…",
  job_aguardandoCompute: "Waiting for serverless compute…",
  job_executandoNoDatabricks: "Running on Databricks…",
  job_finalizando: "Finishing…",
  job_executando: "Running…",
  job_estado: (estado) => `State: ${estado}`,
  job_lendoResultado: "Reading the result…",
  job_falhou: (detalhe) => `The job failed: ${detalhe}`,
  job_cancelado: "Run cancelled.",

  bundle_validando: "Validating the bundle…",
  bundle_publicando: (target) => `Deploying to target ${target}…`,
  bundle_disparando: (job) => `Triggering ${job}…`,
  bundle_lendoEstado: "Reading the bundle state…",
  bundle_semArquivo: "No databricks.yml found. Open the project folder.",
  bundle_naoIniciou: (detalhe) => `Could not start: ${detalhe}`,

  cat_lendo: "Reading the DQX checks",
  cat_naoLeu: "Could not read the check catalog.",
  cat_versaoDivergente: (instalada, configurada) =>
    `The workspace ran DQX ${instalada}, but the configuration pins ${configurada}.`,

  arvore_semCatalogoFiltro: "No catalog matches the filter",
  arvore_semCatalogo: "No accessible catalog",
  arvore_falhaConectar: "Failed to connect to the workspace",
  arvore_erroCatalogo: "Error reading the catalog",
  arvore_selecionarPerfil: "Select profile",

  ctr_abraPastaParaSalvar: "Open the project folder to save versioned contracts.",
  ctr_semWarehouse: "Reading a checks table requires a SQL warehouse. Pick one under Setup.",
  ctr_semListaDeChecks:
    "No list of checks found. Expected an array of checks or an object with a 'checks' key.",
  ctr_formatoDesconhecido: "Unrecognised format.",
  ctr_nenhumCheckValido: "No valid check was found in the file.",
  ctr_semMetaTable: "Contract without meta.table — the extension cannot tell which table it belongs to.",
  ctr_semChecks: "Contract without a list of checks.",
  ctr_funcaoObrigatoria: "check.function is required.",
  ctr_tabelaSemLinhas: (tabela) => `Table ${tabela} has no rows.`,
  ctr_nenhumCheckEm: (tabela) => `No valid check in ${tabela}.`,
  ctr_itemNaoObjeto: (indice) => `Item ${indice} skipped: not an object.`,
  ctr_itemSemFuncao: (indice) => `Item ${indice} skipped: no check.function.`,
  ctr_nomeTabelaInvalido: (nome) => `Invalid table name: ${nome}`,

  auth_semAccessToken: "The Databricks CLI did not return an access_token.",
  auth_falhaGravar: (caminho, status, detalhe) =>
    `Failed to write to ${caminho} (${status}): ${detalhe}`,
  auth_falhaRequisicao: (metodo, caminho, status, detalhe) =>
    `${metodo} ${caminho} failed with ${status}: ${detalhe}`,

  imp_titulo: "Where do the checks come from?",
  imp_placeholder: "Choose the source",
  imp_arquivo: "DQX checks file",
  imp_arquivoDescricao: "YAML or JSON",
  imp_arquivoDetalhe: "A list of checks in the DQX format, or a contract exported by DQX Forge.",
  imp_odcsDetalhe:
    "DQX derives the rules from the contract schema and its quality section. Runs on Databricks.",
  imp_tabela: "Checks table in Unity Catalog",
  imp_tabelaDescricao: "migration path for existing DQX users",
  imp_tabelaDetalhe: "Reads the Delta table where the rules live today and brings them into the repository.",
  imp_tabelaChecksTitulo: "Checks table",
  imp_tabelaChecksPrompt: "Delta table where the rules live today",
  imp_semTabela: "No table provided.",
  imp_semArquivo: "No file chosen.",
  imp_arquivoTitulo: "Checks file",
  imp_odcsTitulo: "ODCS contract",
  imp_convertendo: (nome) => `Converting ${nome}`,
  imp_semChecksNoContrato: "The contract produced no checks.",
  imp_aQualTabela: "Which table do these checks apply to?",
  imp_falhou: (detalhe) => `Could not import: ${detalhe}`,
  imp_nenhumAprovado: "No imported check passed validation. See the log for the reasons.",
  imp_comObservacao: (n) => ` (${n} item(s) with remarks).`,
  imp_origemArquivo: "Imported from a checks file.",
  imp_origemOdcs: "Derived from an ODCS data contract by DQX.",
  imp_origemTabela: "Imported from a checks table in Unity Catalog.",

  erro_profiling: (detalhe) => `Profiling failed: ${detalhe}`,
  erro_agente: (detalhe) => `The agent failed: ${detalhe}`,
  erro_gerarRecursos: (detalhe) => `Could not generate the resources: ${detalhe}`,
  erro_lerCatalogo: (detalhe) => `Could not read the catalog: ${detalhe}`,
  erro_alvoInvalido: "Provide catalog.schema or catalog.schema.table.",
  erro_informeCaminho: "Provide a path",
  erro_informeNome: "Provide a name",
  msg_copiado: (nome) => `Copied: ${nome}`,
  msg_criandoWarehouse: "Creating the warehouse…",
  msg_nomeWarehouse: "Warehouse name",
  msg_profilingFalhou: "Profiling failed.",
  msg_erroDesconhecido: "unknown error",

  log_agente: (tabela, provider) => `\n=== AI agent on ${tabela} (${provider}) ===`,
  log_erro: (mensagem) => `  error: ${mensagem}`,
  log_semTexto: "\n  the model returned no text at all",
  log_descartadas: (n) => `\n${n} proposal(s) discarded during validation:`,
  log_resumoGeracao: "\n=== generation summary ===",
  log_resumoLinha: (tabela, aceitos, rejeitados) =>
    `  ${tabela}: ${aceitos} rules (${rejeitados} discarded)`,
  log_profiling: (tabela, checks, segundos) => `\n=== ${tabela} — ${checks} checks in ${segundos}s`,
  log_dryRun: (tabela, checks, percentual) =>
    `\n=== dry run on ${tabela} · ${checks} checks · ${percentual}% ===`,
  log_dryRunResumo: (erro, total, segundos) =>
    `  ${erro} of ${total} rows rejected in ${segundos}s`,
  log_importacao: (fonte, tabela, aceitos, rejeitados) =>
    `\n=== import (${fonte}) into ${tabela}: ${aceitos} accepted, ${rejeitados} rejected ===`,
  log_respostaModelo: (texto) => `\n  model response:\n${texto}`,
  log_semRegra: (tabela, motivo) => `  ${tabela}: no rules — ${motivo}`,
  log_dryRunFalhou: (motivo) => `  failed: ${motivo}`,
  msg_warehouseCriado: (nome) => `Warehouse "${nome}" created.`,
  dry_escopoAmostra: (percentual) => `${percentual}% sample`,
  dry_titulo_progresso: (tabela, escopo) => `Dry run on ${tabela} (${escopo})`,
  msg_motivoDesconhecido: "unknown reason",

  locale: "en-US",
  perfil_semNulos: (total) => `No nulls across ${total} sampled rows.`,
  perfil_percentualNulos: (percentual) => `${percentual}% nulls in the sample.`,
  perfil_faixa: (min, max) => `Observed range: ${min} to ${max}.`,
  perfil_distintos: (distintos, total) => `${distintos} distinct values across ${total} rows.`,
  ia_idiomaDaResposta:
    "Write every human-facing text in English: the justification of each rule and the final summary.",
  ia_justificativaLm: "Generate data quality rules from your Lakehouse.",
  ia_passoListando: (schema) => `Listing tables in ${schema}…`,
  ia_passoDescrevendo: (tabela) => `Reading the schema of ${tabela}…`,
  ia_passoAmostrando: (tabela) => `Sampling ${tabela}…`,
  ia_passoAnalisando: (coluna, tabela) => `Analysing column ${coluna} of ${tabela}…`,
  ia_passoSql: "Confirming a hypothesis with SQL…",
  ia_passoRegistrando: "Recording the proposed rules…",
  ia_passoFechando: "Asking the model to wrap up with the rules it already has…",
  ia_passoGenerico: (nome) => `Running ${nome}…`,
  dash_semContrato: "No contract available to configure the dashboard.",
  status_tooltip: "Databricks profile used by DQX Forge — click to switch",
  auth_perfilNaoEncontrado: (perfil) =>
    `Profile "${perfil}" not found in ~/.databrickscfg. Configure it in the official Databricks extension or run "databricks auth login".`,
  auth_perfilSemHost: (perfil) => `Profile "${perfil}" does not define a host.`,
  ctr_argumentoDesconhecido: (funcao, argumento) =>
    `"${funcao}" does not take the argument "${argumento}".`,
  msg_perfilando: (tabela) => `Profiling ${tabela}`,
  msg_modeloDefinido: (rotulo) => `AI model: ${rotulo}.`,
  arvore_semSchema: "No accessible schema",
  arvore_semColuna: "No column",
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
  msg_semHostParaBundle:
    "Este proyecto aún no tiene databricks.yml y necesito el host del workspace para crearlo. Elige el perfil de Databricks.",
  msg_bundleCriado: " Se creó el databricks.yml en la raíz del proyecto — revisa los targets antes de publicar.",
  msg_falhaCriarVolume: (schema, detalhe) =>
    `No se pudo crear el volumen en ${schema}. Hace falta CREATE VOLUME en el schema — pídelo al administrador o elige un volumen existente. Detalle: ${detalhe}`,
  msg_falhaCriarWarehouse: (detalhe) =>
    `No se pudo crear el warehouse. Crear un SQL warehouse suele requerir permiso de administrador — solicita acceso o elige uno existente. Detalle: ${detalhe}`,
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

  dim_completeness: "completitud",
  dim_validity: "validez",
  dim_accuracy: "exactitud",
  dim_uniqueness: "unicidad",
  dim_consistency: "consistencia",
  dim_timeliness: "actualidad",

  job_enviandoScript: "Enviando el script al workspace…",
  job_iniciando: "Iniciando el job serverless…",
  job_aguardandoCompute: "Esperando el compute serverless…",
  job_executandoNoDatabricks: "Ejecutando en Databricks…",
  job_finalizando: "Finalizando…",
  job_executando: "Ejecutando…",
  job_estado: (estado) => `Estado: ${estado}`,
  job_lendoResultado: "Leyendo el resultado…",
  job_falhou: (detalhe) => `El job falló: ${detalhe}`,
  job_cancelado: "Ejecución cancelada.",

  bundle_validando: "Validando el bundle…",
  bundle_publicando: (target) => `Publicando en el target ${target}…`,
  bundle_disparando: (job) => `Lanzando ${job}…`,
  bundle_lendoEstado: "Leyendo el estado del bundle…",
  bundle_semArquivo: "No encontré el databricks.yml. Abre la carpeta del proyecto.",
  bundle_naoIniciou: (detalhe) => `No se pudo iniciar: ${detalhe}`,

  cat_lendo: "Leyendo los checks de DQX",
  cat_naoLeu: "No se pudo leer el catálogo de checks.",
  cat_versaoDivergente: (instalada, configurada) =>
    `El workspace ejecutó DQX ${instalada}, pero la configuración fija ${configurada}.`,

  arvore_semCatalogoFiltro: "Ningún catálogo coincide con el filtro",
  arvore_semCatalogo: "Ningún catálogo accesible",
  arvore_falhaConectar: "Error al conectar con el workspace",
  arvore_erroCatalogo: "Error al leer el catálogo",
  arvore_selecionarPerfil: "Seleccionar perfil",

  ctr_abraPastaParaSalvar: "Abre la carpeta del proyecto para guardar contratos versionados.",
  ctr_semWarehouse:
    "Leer una tabla de checks requiere un SQL warehouse. Elige uno en Configuración.",
  ctr_semListaDeChecks:
    "No encontré una lista de checks. Se esperaba un array de checks o un objeto con la clave 'checks'.",
  ctr_formatoDesconhecido: "Formato no reconocido.",
  ctr_nenhumCheckValido: "No se encontró ningún check válido en el archivo.",
  ctr_semMetaTable: "Contrato sin meta.table — la extensión no sabe a qué tabla pertenece.",
  ctr_semChecks: "Contrato sin lista de checks.",
  ctr_funcaoObrigatoria: "check.function es obligatorio.",
  ctr_tabelaSemLinhas: (tabela) => `La tabla ${tabela} no tiene filas.`,
  ctr_nenhumCheckEm: (tabela) => `Ningún check válido en ${tabela}.`,
  ctr_itemNaoObjeto: (indice) => `Ítem ${indice} ignorado: no es un objeto.`,
  ctr_itemSemFuncao: (indice) => `Ítem ${indice} ignorado: no tiene check.function.`,
  ctr_nomeTabelaInvalido: (nome) => `Nombre de tabla inválido: ${nome}`,

  auth_semAccessToken: "El CLI de Databricks no devolvió un access_token.",
  auth_falhaGravar: (caminho, status, detalhe) =>
    `Error al escribir en ${caminho} (${status}): ${detalhe}`,
  auth_falhaRequisicao: (metodo, caminho, status, detalhe) =>
    `${metodo} ${caminho} falló con ${status}: ${detalhe}`,

  imp_titulo: "¿De dónde vienen los checks?",
  imp_placeholder: "Elige el origen",
  imp_arquivo: "Archivo de checks de DQX",
  imp_arquivoDescricao: "YAML o JSON",
  imp_arquivoDetalhe:
    "Una lista de checks en el formato de DQX, o un contrato ya exportado por DQX Forge.",
  imp_odcsDetalhe:
    "DQX deriva las reglas del schema y de la sección quality del contrato. Se ejecuta en Databricks.",
  imp_tabela: "Tabla de checks en Unity Catalog",
  imp_tabelaDescricao: "migración para quien ya usa DQX",
  imp_tabelaDetalhe: "Lee la tabla Delta donde están hoy las reglas y las trae al repositorio.",
  imp_tabelaChecksTitulo: "Tabla de checks",
  imp_tabelaChecksPrompt: "Tabla Delta donde están hoy las reglas",
  imp_semTabela: "No se indicó ninguna tabla.",
  imp_semArquivo: "No se eligió ningún archivo.",
  imp_arquivoTitulo: "Archivo de checks",
  imp_odcsTitulo: "Contrato ODCS",
  imp_convertendo: (nome) => `Convirtiendo ${nome}`,
  imp_semChecksNoContrato: "El contrato no generó ningún check.",
  imp_aQualTabela: "¿A qué tabla se aplican estos checks?",
  imp_falhou: (detalhe) => `No se pudo importar: ${detalhe}`,
  imp_nenhumAprovado: "Ningún check importado pasó la validación. Revisa el registro para ver por qué.",
  imp_comObservacao: (n) => ` (${n} ítem(s) con observación).`,
  imp_origemArquivo: "Importado de un archivo de checks.",
  imp_origemOdcs: "Derivado de un data contract ODCS por DQX.",
  imp_origemTabela: "Importado de una tabla de checks de Unity Catalog.",

  erro_profiling: (detalhe) => `El profiling falló: ${detalhe}`,
  erro_agente: (detalhe) => `El agente falló: ${detalhe}`,
  erro_gerarRecursos: (detalhe) => `No se pudieron generar los recursos: ${detalhe}`,
  erro_lerCatalogo: (detalhe) => `No se pudo leer el catálogo: ${detalhe}`,
  erro_alvoInvalido: "Indica catalog.schema o catalog.schema.tabla.",
  erro_informeCaminho: "Indica una ruta",
  erro_informeNome: "Indica un nombre",
  msg_copiado: (nome) => `Copiado: ${nome}`,
  msg_criandoWarehouse: "Creando el warehouse…",
  msg_nomeWarehouse: "Nombre del warehouse",
  msg_profilingFalhou: "El profiling falló.",
  msg_erroDesconhecido: "error desconocido",

  log_agente: (tabela, provider) => `\n=== agente de IA en ${tabela} (${provider}) ===`,
  log_erro: (mensagem) => `  error: ${mensagem}`,
  log_semTexto: "\n  el modelo no devolvió ningún texto",
  log_descartadas: (n) => `\n${n} propuesta(s) descartada(s) en la validación:`,
  log_resumoGeracao: "\n=== resumen de la generación ===",
  log_resumoLinha: (tabela, aceitos, rejeitados) =>
    `  ${tabela}: ${aceitos} reglas (${rejeitados} descartadas)`,
  log_profiling: (tabela, checks, segundos) =>
    `\n=== ${tabela} — ${checks} checks en ${segundos}s`,
  log_dryRun: (tabela, checks, percentual) =>
    `\n=== dry run en ${tabela} · ${checks} checks · ${percentual}% ===`,
  log_dryRunResumo: (erro, total, segundos) =>
    `  ${erro} de ${total} filas rechazadas en ${segundos}s`,
  log_importacao: (fonte, tabela, aceitos, rejeitados) =>
    `\n=== importación (${fonte}) en ${tabela}: ${aceitos} aceptados, ${rejeitados} rechazados ===`,
  log_respostaModelo: (texto) => `\n  respuesta del modelo:\n${texto}`,
  log_semRegra: (tabela, motivo) => `  ${tabela}: ninguna regla — ${motivo}`,
  log_dryRunFalhou: (motivo) => `  falló: ${motivo}`,
  msg_warehouseCriado: (nome) => `Warehouse "${nome}" creado.`,
  dry_escopoAmostra: (percentual) => `muestra del ${percentual}%`,
  dry_titulo_progresso: (tabela, escopo) => `Dry run en ${tabela} (${escopo})`,
  msg_motivoDesconhecido: "motivo desconocido",

  locale: "es-ES",
  perfil_semNulos: (total) => `Ningún nulo en ${total} filas muestreadas.`,
  perfil_percentualNulos: (percentual) => `${percentual}% de nulos en la muestra.`,
  perfil_faixa: (min, max) => `Rango observado: de ${min} a ${max}.`,
  perfil_distintos: (distintos, total) => `${distintos} valores distintos en ${total} filas.`,
  ia_idiomaDaResposta:
    "Escribe en español todo el texto dirigido a personas: la justificación de cada regla y el resumen final.",
  ia_justificativaLm: "Generar reglas de calidad de datos a partir de tu Lakehouse.",
  ia_passoListando: (schema) => `Listando tablas de ${schema}…`,
  ia_passoDescrevendo: (tabela) => `Leyendo el schema de ${tabela}…`,
  ia_passoAmostrando: (tabela) => `Muestreando ${tabela}…`,
  ia_passoAnalisando: (coluna, tabela) => `Analizando la columna ${coluna} de ${tabela}…`,
  ia_passoSql: "Confirmando una hipótesis con SQL…",
  ia_passoRegistrando: "Registrando las reglas propuestas…",
  ia_passoFechando: "Pidiendo al modelo que cierre con las reglas que ya tiene…",
  ia_passoGenerico: (nome) => `Ejecutando ${nome}…`,
  dash_semContrato: "Ningún contrato disponible para configurar el dashboard.",
  status_tooltip: "Perfil de Databricks usado por DQX Forge — haz clic para cambiar",
  auth_perfilNaoEncontrado: (perfil) =>
    `Perfil "${perfil}" no encontrado en ~/.databrickscfg. Configúralo en la extensión oficial de Databricks o ejecuta "databricks auth login".`,
  auth_perfilSemHost: (perfil) => `El perfil "${perfil}" no define un host.`,
  ctr_argumentoDesconhecido: (funcao, argumento) =>
    `"${funcao}" no acepta el argumento "${argumento}".`,
  msg_perfilando: (tabela) => `Perfilando ${tabela}`,
  msg_modeloDefinido: (rotulo) => `Modelo de IA: ${rotulo}.`,
  arvore_semSchema: "Ningún schema accesible",
  arvore_semColuna: "Ninguna columna",
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
