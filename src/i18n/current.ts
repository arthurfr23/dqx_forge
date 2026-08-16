import { catalogo, type Catalogo, type Idioma } from "./messages";

/**
 * Idioma corrente da extensão, mantido aqui em vez de lido da configuração a
 * cada chamada: assim `t()` não depende de `vscode` e pode ser usado também
 * pelos módulos que conversam com o Databricks, que precisam continuar
 * testáveis fora do host da extensão.
 *
 * Quem resolve a configuração é o extension.ts, na ativação e a cada troca.
 */
let idioma: Idioma = "en";

export function definirIdioma(novo: Idioma): void {
  idioma = novo;
}

export function idiomaAtual(): Idioma {
  return idioma;
}

export function t(): Catalogo {
  return catalogo(idioma);
}
