import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Margem antes da expiração para renovar o token e não usar um já vencido em voo. */
const RENEW_MARGIN_MS = 60_000;

export interface DatabricksProfile {
  name: string;
  host: string;
  authType?: string;
  /** PAT lido do arquivo, quando o perfil usa token estático. */
  token?: string;
}

export class DatabricksAuthError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DatabricksAuthError";
  }
}

/**
 * Resolve credenciais reusando a configuração que a extensão oficial da Databricks
 * já mantém em ~/.databrickscfg. Para perfis OAuth delega ao CLI, que cuida do
 * refresh; para perfis com PAT usa o token do arquivo.
 */
export class DatabricksAuth {
  private cachedToken?: { value: string; expiresAt: number; profile: string };

  constructor(private profileName: string) {}

  get profile(): string {
    return this.profileName;
  }

  setProfile(name: string): void {
    if (name !== this.profileName) {
      this.profileName = name;
      this.cachedToken = undefined;
    }
  }

  static async listProfiles(): Promise<DatabricksProfile[]> {
    const path = join(homedir(), ".databrickscfg");
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch {
      return [];
    }
    return parseDatabricksCfg(raw);
  }

  async resolveProfile(): Promise<DatabricksProfile> {
    const profiles = await DatabricksAuth.listProfiles();
    const target = this.profileName || "DEFAULT";
    const found = profiles.find((p) => p.name === target);
    if (!found) {
      throw new DatabricksAuthError(
        `Perfil "${target}" não encontrado em ~/.databrickscfg. Configure-o na extensão oficial da Databricks ou rode "databricks auth login".`,
      );
    }
    if (!found.host) {
      throw new DatabricksAuthError(`Perfil "${target}" não define um host.`);
    }
    return found;
  }

  async getToken(): Promise<string> {
    const cached = this.cachedToken;
    if (cached && cached.profile === this.profileName && Date.now() < cached.expiresAt - RENEW_MARGIN_MS) {
      return cached.value;
    }

    const profile = await this.resolveProfile();

    try {
      const args = ["auth", "token"];
      if (this.profileName) {
        args.push("--profile", this.profileName);
      }
      const { stdout } = await execFileAsync("databricks", args, { timeout: 120_000 });
      const parsed = JSON.parse(stdout) as { access_token?: string; expiry?: string };
      if (!parsed.access_token) {
        throw new DatabricksAuthError("O CLI da Databricks não retornou um access_token.");
      }
      const expiresAt = parsed.expiry ? Date.parse(parsed.expiry) : Date.now() + 3_600_000;
      this.cachedToken = {
        value: parsed.access_token,
        expiresAt: Number.isNaN(expiresAt) ? Date.now() + 3_600_000 : expiresAt,
        profile: this.profileName,
      };
      return parsed.access_token;
    } catch (err) {
      // Perfis com PAT estático não são suportados por "databricks auth token".
      if (profile.token) {
        this.cachedToken = {
          value: profile.token,
          expiresAt: Number.MAX_SAFE_INTEGER,
          profile: this.profileName,
        };
        return profile.token;
      }
      if (err instanceof DatabricksAuthError) {
        throw err;
      }
      throw new DatabricksAuthError(
        `Não foi possível obter um token para o perfil "${this.profileName || "DEFAULT"}". ` +
          `Verifique se o CLI da Databricks está no PATH e rode "databricks auth login --profile ${this.profileName || "DEFAULT"}".`,
        err,
      );
    }
  }

  /** Chama a REST API do workspace e devolve o corpo já desserializado. */
  async request<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
    const profile = await this.resolveProfile();
    const token = await this.getToken();

    const url = new URL(path, profile.host.endsWith("/") ? profile.host : `${profile.host}/`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new DatabricksAuthError(
        `${init.method ?? "GET"} ${url.pathname} falhou com ${response.status}: ${truncate(detail, 500)}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  /** Envia bytes crus — usado pela Files API para gravar em UC Volumes. */
  async uploadFile(volumePath: string, content: string): Promise<void> {
    const profile = await this.resolveProfile();
    const token = await this.getToken();
    const url = new URL(
      `/api/2.0/fs/files${volumePath}?overwrite=true`,
      profile.host.endsWith("/") ? profile.host : `${profile.host}/`,
    );

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: content,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new DatabricksAuthError(
        `Falha ao gravar em ${volumePath} (${response.status}): ${truncate(detail, 300)}`,
      );
    }
  }

  /** Baixa o corpo cru — usado pela Files API, que devolve o arquivo e não JSON. */
  async requestText(path: string): Promise<string> {
    const profile = await this.resolveProfile();
    const token = await this.getToken();
    const url = new URL(path, profile.host.endsWith("/") ? profile.host : `${profile.host}/`);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const detail = await response.text();
      throw new DatabricksAuthError(`GET ${url.pathname} falhou com ${response.status}: ${truncate(detail, 500)}`);
    }
    return await response.text();
  }
}

export function parseDatabricksCfg(raw: string): DatabricksProfile[] {
  const profiles: DatabricksProfile[] = [];
  let current: DatabricksProfile | undefined;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }
    const section = /^\[(.+)\]$/.exec(trimmed);
    if (section) {
      // __settings__ guarda estado interno do CLI, não é um perfil utilizável.
      current = { name: section[1], host: "" };
      if (current.name !== "__settings__") {
        profiles.push(current);
      }
      continue;
    }
    if (!current) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key === "host") {
      current.host = value.replace(/\/+$/, "");
    } else if (key === "auth_type") {
      current.authType = value;
    } else if (key === "token") {
      current.token = value;
    }
  }

  return profiles.filter((p) => p.name !== "__settings__");
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}
