import { describe, expect, it } from "vitest";
import {
  buildDefaultWebCoreMarkup,
  buildDefaultWebCoreScript,
  buildDefaultWebCoreStyles,
  ensureWebCoreBaseLinks,
  inlineLinkedScript,
  inlineLinkedStylesheet,
  renameLinkedScript,
  renameLinkedStylesheet,
  resolveWebCoreCssPackageImports,
  removeLinkedScript,
  removeLinkedStylesheet,
} from "@/lib/webcoreWorkspace";

const fileNames = {
  markup: "index.html",
  script: "script.js",
  styles: "style.css",
} as const;

describe("webcore workspace helpers", () => {
  it("builds a compact default starter with linked files", () => {
    const markup = buildDefaultWebCoreMarkup(fileNames);

    expect(markup).toContain('./style.css');
    expect(markup).toContain('./script.js');
    expect(buildDefaultWebCoreStyles()).toContain(".card");
    expect(buildDefaultWebCoreScript()).toContain('document.getElementById("cta")');
  });

  it("adds missing base links to preset markup", () => {
    const markup = ensureWebCoreBaseLinks(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Preset</title>
  </head>
  <body>
    <main>hello</main>
  </body>
</html>`,
      fileNames,
      { script: true, styles: true },
    );

    expect(markup).toContain('<link rel="stylesheet" href="./style.css" />');
    expect(markup).toContain('<script type="module" src="./script.js"></script>');
  });

  it("inlines linked base assets for preview", () => {
    const linkedMarkup = buildDefaultWebCoreMarkup(fileNames);
    const cssResult = inlineLinkedStylesheet(linkedMarkup, fileNames.styles, "body { color: red; }");
    const scriptResult = inlineLinkedScript(cssResult.markup, fileNames.script, 'console.log("ok");', true);

    expect(cssResult.replaced).toBe(true);
    expect(scriptResult.replaced).toBe(true);
    expect(scriptResult.markup).toContain("<style data-codeorbit-file=\"style.css\">");
    expect(scriptResult.markup).toContain("<script type=\"module\" data-codeorbit-file=\"script.js\">");
  });

  it("removes disabled linked assets from preview markup", () => {
    const linkedMarkup = buildDefaultWebCoreMarkup(fileNames);

    const withoutStyles = removeLinkedStylesheet(linkedMarkup, fileNames.styles);
    const withoutScripts = removeLinkedScript(withoutStyles, fileNames.script);

    expect(withoutScripts).not.toContain('./style.css');
    expect(withoutScripts).not.toContain('./script.js');
  });

  it("keeps markup links in sync when base files are renamed", () => {
    const linkedMarkup = buildDefaultWebCoreMarkup(fileNames);
    const renamedStyles = renameLinkedStylesheet(linkedMarkup, "style.css", "app.css");
    const renamedScripts = renameLinkedScript(renamedStyles, "script.js", "main.js");

    expect(renamedScripts).toContain('./app.css');
    expect(renamedScripts).toContain('./main.js');
    expect(renamedScripts).not.toContain('./style.css');
    expect(renamedScripts).not.toContain('./script.js');
  });

  it("resolves package CSS imports through the WebCore package list", () => {
    const css = `@import "bootstrap";
@import "animate.css";
@import "bootstrap/dist/css/bootstrap-grid.min.css";
body { color: white; }`;

    const resolved = resolveWebCoreCssPackageImports(css, [
      { name: "bootstrap", specifier: "bootstrap@5.3.3" },
      { name: "animate.css", specifier: "animate.css@4.1.1" },
    ]);

    expect(resolved).toContain('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');
    expect(resolved).toContain('https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css');
    expect(resolved).toContain('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap-grid.min.css');
  });
});
