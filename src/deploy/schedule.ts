import { t } from "../i18n/current";

/**
 * Periodicidades oferecidas no seletor. O que fica gravado na configuração é a
 * própria expressão Quartz, não o id do preset: assim um cron digitado à mão
 * sobrevive ao round-trip e a lista abaixo pode mudar sem migrar configuração.
 * Cron vazio significa "sem schedule" — o job sobe só para execução manual.
 */
export interface PresetAgendamento {
  cron: string;
  rotulo: () => string;
}

export const PRESETS_AGENDAMENTO: PresetAgendamento[] = [
  { cron: "0 0/15 * * * ?", rotulo: () => t().agenda_15min },
  { cron: "0 0/30 * * * ?", rotulo: () => t().agenda_30min },
  { cron: "0 0 * * * ?", rotulo: () => t().agenda_horaEmHora },
  { cron: "0 0 0/6 * * ?", rotulo: () => t().agenda_6h },
  { cron: "0 0 6 * * ?", rotulo: () => t().agenda_diario6 },
  { cron: "0 0 6 ? * MON-FRI", rotulo: () => t().agenda_util6 },
  { cron: "0 0 6 ? * MON", rotulo: () => t().agenda_semanal },
  { cron: "", rotulo: () => t().agenda_manual },
];

export function descreverAgendamento(cron: string): string {
  return PRESETS_AGENDAMENTO.find((preset) => preset.cron === cron)?.rotulo() ?? cron;
}

const MESES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DIAS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const LIMITES: Array<{ min: number; max: number; nomes?: readonly string[] }> = [
  { min: 0, max: 59 },
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12, nomes: MESES },
  { min: 1, max: 7, nomes: DIAS },
  { min: 1970, max: 2099 },
];

const DIA_DO_MES = 3;
const DIA_DA_SEMANA = 5;

/**
 * Valida a expressão antes de gravá-la, porque o erro só apareceria muito
 * depois — no deploy do bundle, com uma mensagem da API difícil de conectar ao
 * que foi digitado. Cobre os enganos frequentes: contagem de campos (cron Unix
 * tem 5, Quartz tem 6), uso do '?' e valores fora de faixa.
 */
export function validarQuartz(expressao: string): string | undefined {
  const campos = expressao.trim().split(/\s+/).filter(Boolean);
  if (campos.length !== 6 && campos.length !== 7) {
    return t().agenda_erroCampos(campos.length);
  }

  const nomes = t().agenda_campos;

  const foraDeLugar = campos.some(
    (campo, i) => campo.includes("?") && i !== DIA_DO_MES && i !== DIA_DA_SEMANA,
  );
  if (foraDeLugar) {
    return t().agenda_erroInterrogacao;
  }
  if ((campos[DIA_DO_MES] === "?") === (campos[DIA_DA_SEMANA] === "?")) {
    return t().agenda_erroUmaInterrogacao;
  }

  for (const [i, campo] of campos.entries()) {
    const erro = validarCampo(campo, LIMITES[i], nomes[i] ?? "");
    if (erro) {
      return erro;
    }
  }
  return undefined;
}

function validarCampo(
  campo: string,
  limite: { min: number; max: number; nomes?: readonly string[] },
  nome: string,
): string | undefined {
  for (const token of campo.split(",")) {
    if (!token) {
      return t().agenda_erroValor(nome, campo);
    }
    if (token === "*" || token === "?") {
      continue;
    }
    // L, W e # têm semântica própria (último dia, dia útil mais próximo,
    // n-ésima ocorrência no mês). Deixamos esses casos para o Databricks.
    if (/[LW#]/i.test(token)) {
      continue;
    }

    const [base, passo, ...excedente] = token.split("/");
    if (excedente.length || (passo !== undefined && !/^\d+$/.test(passo))) {
      return t().agenda_erroValor(nome, token);
    }
    if (base === "*") {
      continue;
    }

    for (const parte of base.split("-")) {
      const valor = numero(parte, limite.nomes);
      if (valor === undefined) {
        return t().agenda_erroValor(nome, token);
      }
      if (valor < limite.min || valor > limite.max) {
        return t().agenda_erroFaixa(nome, limite.min, limite.max);
      }
    }
  }
  return undefined;
}

function numero(parte: string, nomes?: readonly string[]): number | undefined {
  if (/^\d+$/.test(parte)) {
    return Number(parte);
  }
  const indice = nomes?.indexOf(parte.toUpperCase()) ?? -1;
  return indice < 0 ? undefined : indice + 1;
}
