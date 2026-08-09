const esbuild = require("esbuild");
const { cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Os tasks Python são embarcados no .vsix: a extensão os envia ao workspace nas
// execuções interativas, e o mesmo código roda nos jobs agendados pelo bundle.
const TASKS_SOURCE = join(__dirname, "tasks");
const TASKS_DEST = join(__dirname, "dist", "tasks");

function copyTasks() {
  mkdirSync(TASKS_DEST, { recursive: true });
  cpSync(TASKS_SOURCE, TASKS_DEST, { recursive: true });
}

/** Extensão: Node/CJS, com o módulo vscode resolvido em runtime. */
const extensionConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  outfile: "dist/extension.js",
  external: ["vscode"],
  minify: production,
  sourcemap: !production,
  logLevel: "info",
};

/** Webview: browser/IIFE, React compilado pelo próprio esbuild — sem Vite. */
const webviewConfig = {
  entryPoints: ["webview-ui/main.tsx"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: "dist/webview.js",
  jsx: "automatic",
  minify: production,
  sourcemap: !production,
  logLevel: "info",
  define: { "process.env.NODE_ENV": production ? '"production"' : '"development"' },
};

async function main() {
  copyTasks();

  const contexts = await Promise.all([
    esbuild.context(extensionConfig),
    esbuild.context(webviewConfig),
  ]);

  if (watch) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
  } else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
