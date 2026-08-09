import * as vscode from "vscode";
import { catalogo, resolverIdioma, type Catalogo, type Idioma } from "./messages";

/**
 * Idioma corrente da extensão. Lê a configuração a cada chamada em vez de
 * cachear, para que trocar o idioma tenha efeito imediato nos textos que a
 * extensão desenha depois disso.
 */
export function idiomaAtual(): Idioma {
  return resolverIdioma(
    vscode.workspace.getConfiguration("dqxForge").get<string>("language", ""),
    vscode.env.language,
  );
}

export function t(): Catalogo {
  return catalogo(idiomaAtual());
}
