export type WebCoreBaseFileNames = {
  markup: string;
  script: string;
  styles: string;
};

export type WebCoreBaseFileState = {
  script: boolean;
  styles: boolean;
};

export type WebCoreWorkspacePackageRef = {
  name: string;
  specifier: string;
};

const defaultStyles = `:root {
  color-scheme: dark;
  --bg: #060816;
  --panel: rgba(15, 23, 42, 0.82);
  --line: rgba(148, 163, 184, 0.18);
  --text: #e5eefc;
  --muted: #94a3b8;
  --accent: #38bdf8;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 26%),
    linear-gradient(160deg, #0f172a, var(--bg) 70%);
}

.card {
  width: min(560px, 100%);
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  color: #bae6fd;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 16px 0 10px;
  font-size: clamp(2rem, 6vw, 3.2rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

button {
  margin-top: 20px;
  border: 0;
  border-radius: 999px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 700;
  color: #03111c;
  background: linear-gradient(135deg, var(--accent), #67e8f9);
  cursor: pointer;
}`;

const defaultScript = `const cta = document.getElementById("cta");

if (cta) {
  cta.addEventListener("click", () => {
    cta.textContent = cta.textContent === "Interaction Ready" ? "Run Interaction" : "Interaction Ready";
  });
}`;

const knownCssPackageEntryPoints: Record<string, string> = {
  "animate.css": "animate.min.css",
  bootstrap: "dist/css/bootstrap.min.css",
  bulma: "css/bulma.min.css",
  "@picocss/pico": "css/pico.min.css",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildStylesheetLinkTag(fileName: string) {
  return `  <link rel="stylesheet" href="./${fileName}" />`;
}

function buildScriptTag(fileName: string) {
  return `  <script type="module" src="./${fileName}"></script>`;
}

function hasLocalStylesheetReference(markup: string, fileName: string) {
  const escaped = escapeRegExp(fileName);
  return new RegExp(`<link[^>]*href=["'](?:\\./)?${escaped}["'][^>]*>`, "i").test(markup);
}

function hasLocalScriptReference(markup: string, fileName: string) {
  const escaped = escapeRegExp(fileName);
  return new RegExp(`<script[^>]*src=["'](?:\\./)?${escaped}["'][^>]*>\\s*</script>`, "i").test(markup);
}

export function buildDefaultWebCoreMarkup(fileNames: WebCoreBaseFileNames) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit WebCore</title>
    <link rel="stylesheet" href="./${fileNames.styles}" />
  </head>
  <body>
    <main class="card">
      <span class="badge">WebCore</span>
      <h1>Build fast, preview instantly.</h1>
      <p>Edit ${fileNames.markup}, ${fileNames.styles}, and ${fileNames.script} together.</p>
      <button id="cta" type="button">Run Interaction</button>
    </main>
    <script type="module" src="./${fileNames.script}"></script>
  </body>
</html>`;
}

export function buildDefaultWebCoreStyles() {
  return defaultStyles;
}

export function buildDefaultWebCoreScript() {
  return defaultScript;
}

export function ensureWebCoreBaseLinks(
  markup: string,
  fileNames: WebCoreBaseFileNames,
  enabled: WebCoreBaseFileState,
) {
  let nextMarkup = markup;

  if (enabled.styles && !hasLocalStylesheetReference(nextMarkup, fileNames.styles)) {
    const linkTag = buildStylesheetLinkTag(fileNames.styles);
    if (/<\/head>/i.test(nextMarkup)) {
      nextMarkup = nextMarkup.replace(/<\/head>/i, `${linkTag}\n  </head>`);
    }
  }

  if (enabled.script && !hasLocalScriptReference(nextMarkup, fileNames.script)) {
    const scriptTag = buildScriptTag(fileNames.script);
    if (/<\/body>/i.test(nextMarkup)) {
      nextMarkup = nextMarkup.replace(/<\/body>/i, `${scriptTag}\n  </body>`);
    }
  }

  return nextMarkup;
}

export function inlineLinkedStylesheet(markup: string, fileName: string, content: string) {
  const escaped = escapeRegExp(fileName);
  const pattern = new RegExp(`<link[^>]*href=["'](?:\\./)?${escaped}["'][^>]*>`, "i");

  if (!pattern.test(markup)) {
    return { markup, replaced: false };
  }

  return {
    markup: markup.replace(pattern, `<style data-codeorbit-file="${fileName}">\n${content}\n</style>`),
    replaced: true,
  };
}

export function inlineLinkedScript(markup: string, fileName: string, content: string, useModule = false) {
  const escaped = escapeRegExp(fileName);
  const pattern = new RegExp(`<script([^>]*?)\\s+src=["'](?:\\./)?${escaped}["']([^>]*)>\\s*</script>`, "i");

  if (!pattern.test(markup)) {
    return { markup, replaced: false };
  }

  return {
    markup: markup.replace(pattern, (_match, before = "", after = "") => {
      const attributes = `${before}${after}`;
      const needsModuleType = useModule && !/\btype\s*=/i.test(attributes);
      const normalizedAttributes = `${attributes}${needsModuleType ? ' type="module"' : ""}`;
      return `<script${normalizedAttributes} data-codeorbit-file="${fileName}">\n${content}\n</script>`;
    }),
    replaced: true,
  };
}

export function removeLinkedStylesheet(markup: string, fileName: string) {
  const escaped = escapeRegExp(fileName);
  return markup.replace(new RegExp(`\\s*<link[^>]*href=["'](?:\\./)?${escaped}["'][^>]*>\\s*`, "i"), "\n");
}

export function removeLinkedScript(markup: string, fileName: string) {
  const escaped = escapeRegExp(fileName);
  return markup.replace(
    new RegExp(`\\s*<script[^>]*src=["'](?:\\./)?${escaped}["'][^>]*>\\s*</script>\\s*`, "i"),
    "\n",
  );
}

export function renameLinkedStylesheet(markup: string, previousName: string, nextName: string) {
  const escaped = escapeRegExp(previousName);
  return markup.replace(
    new RegExp(`(<link[^>]*href=["'])(?:\\./)?${escaped}(["'][^>]*>)`, "i"),
    `$1./${nextName}$2`,
  );
}

export function renameLinkedScript(markup: string, previousName: string, nextName: string) {
  const escaped = escapeRegExp(previousName);
  return markup.replace(
    new RegExp(`(<script[^>]*src=["'])(?:\\./)?${escaped}(["'][^>]*>\\s*</script>)`, "i"),
    `$1./${nextName}$2`,
  );
}

function isStaticCssImportTarget(value: string) {
  return /^(?:[a-z]+:|#|\.{1,2}\/|\/)/i.test(value);
}

function resolveWebCoreCssImportTarget(target: string, packages: WebCoreWorkspacePackageRef[]) {
  const normalizedTarget = target.trim().replace(/^npm:/i, "");

  if (!normalizedTarget || isStaticCssImportTarget(normalizedTarget)) {
    return null;
  }

  for (const pkg of packages) {
    if (normalizedTarget === pkg.name) {
      const cssEntryPoint = knownCssPackageEntryPoints[pkg.name];
      return cssEntryPoint ? `https://cdn.jsdelivr.net/npm/${pkg.specifier}/${cssEntryPoint}` : null;
    }

    if (normalizedTarget.startsWith(`${pkg.name}/`)) {
      const relativePath = normalizedTarget.slice(pkg.name.length + 1);
      return `https://cdn.jsdelivr.net/npm/${pkg.specifier}/${relativePath}`;
    }
  }

  return null;
}

export function resolveWebCoreCssPackageImports(css: string, packages: WebCoreWorkspacePackageRef[]) {
  if (!css.trim() || packages.length === 0) {
    return css;
  }

  const replaceImportTarget = (target: string) => resolveWebCoreCssImportTarget(target, packages) ?? target;

  const withUrlImports = css.replace(
    /@import\s+url\(\s*(["']?)([^"')]+)\1\s*\)([^;]*);/gi,
    (_match, _quote = "", target = "", suffix = "") => {
      const resolvedTarget = replaceImportTarget(target);
      return `@import url("${resolvedTarget}")${suffix};`;
    },
  );

  return withUrlImports.replace(
    /@import\s+(["'])([^"']+)\1([^;]*);/gi,
    (_match, _quote = "", target = "", suffix = "") => {
      const resolvedTarget = replaceImportTarget(target);
      return `@import url("${resolvedTarget}")${suffix};`;
    },
  );
}
