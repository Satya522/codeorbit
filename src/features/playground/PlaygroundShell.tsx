"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FileCode2,
  Keyboard,
  LoaderCircle,
  Maximize2,
  Menu,
  Minimize2,
  PencilLine,
  Play,
  Plus,
  RotateCcw,
  TerminalSquare,
  X,
} from "lucide-react";
import MonacoEditor from "@/components/shared/MonacoEditor";
import { usePlatformShell } from "@/components/layout/PlatformShell";
import { configurePlaygroundMonaco } from "@/lib/playgroundMonaco";
import type { SqlResultTable } from "@/lib/sqlRunner";
import { Group, Panel, Separator } from "react-resizable-panels";

type LanguageId = "java" | "python" | "javascript" | "cpp" | "go" | "html" | "sql";

type LanguageOption = {
  id: LanguageId;
  label: string;
  icon: string;
  iconPath?: string;
  monaco: string;
  filename: string;
  description: string;
  starter: string;
  runtime: string;
  accentRgb: string;
  engineLanguage?: string;
};

type SandboxFontId = "jetbrains-mono" | "fira-code" | "hack" | "cascadia-code";

type SandboxFontOption = {
  id: SandboxFontId;
  label: string;
  stack: string;
  preview: string;
};

type HtmlWorkspaceFileId = "markup" | "styles" | "script";
type HtmlWorkspaceCustomKind = "html" | "css" | "javascript";

type HtmlWorkspaceCustomFile = {
  id: string;
  kind: HtmlWorkspaceCustomKind;
  name: string;
  content: string;
  includeInPreview: boolean;
};

type HtmlWorkspacePackage = {
  id: string;
  name: string;
  specifier: string;
};

type HtmlWorkspaceState = {
  activeFile: string;
  enabled: {
    script: boolean;
    styles: boolean;
  };
  fileNames: Record<HtmlWorkspaceFileId, string>;
  files: Record<HtmlWorkspaceFileId, string>;
  customFiles: HtmlWorkspaceCustomFile[];
  packages: HtmlWorkspacePackage[];
};

const remoteExecutionLanguages: LanguageId[] = ["java", "python", "cpp", "javascript", "go"];

const languageOptions: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    icon: "☕",
    iconPath: "/icons/languages/java.png",
    monaco: "java",
    filename: "Main.java",
    description: "JDK compilation with stdin support, runtime feedback, and auto-added common imports.",
    runtime: "Remote JDK 17",
    accentRgb: "249,115,22",
    engineLanguage: "java",
    starter: `public class Main {
    public static void main(String[] args) {
      System.out.println("Hello CodeOrbit");
    }
  }`,
  },
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    iconPath: "/icons/languages/python.png",
    monaco: "python",
    filename: "main.py",
    description: "Remote Python execution with stdin, stdout, and stderr support.",
    runtime: "Remote Python",
    accentRgb: "52,211,153",
    engineLanguage: "python",
    starter: `print("Hello CodeOrbit")`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    icon: "⚡",
    iconPath: "/icons/languages/javascript.png",
    monaco: "javascript",
    filename: "main.js",
    description: "Node-style remote JavaScript execution with Input-tab prompts. Browser npm packages belong in WebCore.",
    runtime: "Remote Node",
    accentRgb: "251,191,36",
    engineLanguage: "javascript",
    starter: `console.log("Hello CodeOrbit")`,
  },
  {
    id: "cpp",
    label: "C++",
    icon: "C++",
    monaco: "cpp",
    filename: "main.cpp",
    description: "Remote C++ execution for fast systems-level experiments.",
    runtime: "Remote G++",
    accentRgb: "139,92,246",
    engineLanguage: "cpp",
    starter: `#include <iostream>

int main() {
  std::cout << "Hello CodeOrbit\\n";
  return 0;
}`,
  },
  {
    id: "go",
    label: "Go",
    icon: "Go",
    monaco: "go",
    filename: "main.go",
    description: "Remote Go execution with stdin and terminal output.",
    runtime: "Remote Go",
    accentRgb: "56,189,248",
    engineLanguage: "go",
    starter: `package main

import "fmt"

func main() {
  fmt.Println("Hello CodeOrbit")
}`,
  },
  {
    id: "html",
    label: "WebCore",
    icon: "🌐",
    iconPath: "/icons/languages/html.png",
    monaco: "html",
    filename: "index.html",
    description: "Build HTML, CSS, and JavaScript together in one live browser workspace with browser packages.",
    runtime: "Browser Preview",
    accentRgb: "56,189,248",
    starter: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top, #1e1b4b, #09090b 60%);
        color: white;
        font-family: Inter, sans-serif;
      }
      .card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(24, 24, 27, 0.65);
        backdrop-filter: blur(12px);
        border-radius: 24px;
        padding: 32px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hello CodeOrbit</h1>
      <p>Your WebCore preview is ready.</p>
    </div>
  </body>
</html>`,
  },
  {
    id: "sql",
    label: "SQL",
    icon: "🗄",
    iconPath: "/icons/languages/sql.png",
    monaco: "sql",
    filename: "query.sql",
    description: "Local SQLite runner for DDL, DML, and multiple result tables.",
    runtime: "SQLite WASM",
    accentRgb: "34,211,238",
    starter: `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  score INTEGER
);

INSERT INTO students (name, score) VALUES
('Rohit', 95),
('Aman', 88),
('Neha', 91);

SELECT * FROM students;`,
  },
];

const starterTemplates = Object.fromEntries(languageOptions.map((option) => [option.id, option.starter])) as Record<LanguageId, string>;
const playgroundLanguageStorageKey = "codeorbit:playground:language";
const playgroundCodesStorageKey = "codeorbit:playground:codes";
const htmlWorkspaceStorageKey = "codeorbit:playground:html-workspace";
const playgroundEditorFontStorageKey = "codeorbit:playground:editor-font";
const playgroundEditorFontSize = 14.5;
const sandboxFontOptions: SandboxFontOption[] = [
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    stack: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    preview: "Smooth, modern, and balanced.",
  },
  {
    id: "fira-code",
    label: "Fira Code",
    stack: "'Fira Code', 'SF Mono', Consolas, monospace",
    preview: "Ligature-friendly coding font.",
  },
  {
    id: "hack",
    label: "Hack",
    stack: "'Hack', 'SF Mono', Consolas, monospace",
    preview: "Crisp and compact terminal feel.",
  },
  {
    id: "cascadia-code",
    label: "Cascadia Code",
    stack: "'Cascadia Code', 'Cascadia Mono', 'SF Mono', Consolas, monospace",
    preview: "Wide, readable, and VS-style.",
  },
] as const;

const htmlWorkspaceFiles = {
  markup: {
    filename: "index.html",
    label: "HTML",
    monaco: "html",
    starter: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit WebCore Preview</title>
  </head>
  <body>
    <main class="shell">
      <section class="card">
        <span class="eyebrow">WebCore Preview</span>
        <h1 id="title">Build with WebCore</h1>
        <p id="description">
          Use HTML, CSS, and JavaScript together in one live preview.
        </p>
        <button id="actionButton" type="button">Run interaction</button>
        <div id="log" class="log">Preview ready.</div>
      </section>
    </main>
  </body>
</html>`,
  },
  styles: {
    filename: "style.css",
    label: "CSS",
    monaco: "css",
    starter: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  background: radial-gradient(circle at top, #1e293b, #020617 68%);
  color: #e2e8f0;
}

.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
}

.card {
  width: min(680px, 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.eyebrow {
  display: inline-flex;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(34, 211, 238, 0.1);
  color: #a5f3fc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 16px 0 10px;
  color: white;
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 0.95;
}

p {
  margin: 0 0 20px;
  color: #94a3b8;
  line-height: 1.7;
}

button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(90deg, #8b5cf6, #06b6d4);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.log {
  margin-top: 18px;
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}`,
  },
  script: {
    filename: "script.js",
    label: "JS",
    monaco: "javascript",
    starter: `const log = document.getElementById("log");
const button = document.getElementById("actionButton");
const title = document.getElementById("title");

function writeMessage(message) {
  if (log) {
    log.textContent = message;
  }
}

if (button) {
  button.addEventListener("click", () => {
    if (title) {
      title.textContent = "Interaction complete";
    }

    writeMessage("JavaScript is connected and running inside the WebCore preview.");
  });
}

writeMessage("Preview ready. Click the button to test the JavaScript file.");`,
  },
} as const;

function clearStoredPlaygroundState() {
  window.localStorage.removeItem(playgroundCodesStorageKey);
  window.localStorage.removeItem(playgroundLanguageStorageKey);
  window.localStorage.removeItem(htmlWorkspaceStorageKey);
  window.localStorage.removeItem(playgroundEditorFontStorageKey);
}

function buildDefaultCodeMap() {
  return {
    java: starterTemplates.java,
    python: starterTemplates.python,
    javascript: starterTemplates.javascript,
    cpp: starterTemplates.cpp,
    go: starterTemplates.go,
    html: starterTemplates.html,
    sql: starterTemplates.sql,
  } satisfies Record<LanguageId, string>;
}

function isLanguageId(value: string): value is LanguageId {
  return languageOptions.some((option) => option.id === value);
}

function isSandboxFontId(value: string): value is SandboxFontId {
  return sandboxFontOptions.some((option) => option.id === value);
}

function isHtmlWorkspaceFileId(value: string): value is HtmlWorkspaceFileId {
  return value === "markup" || value === "styles" || value === "script";
}

function isHtmlWorkspaceCustomKind(value: string): value is HtmlWorkspaceCustomKind {
  return value === "html" || value === "css" || value === "javascript";
}

function getHtmlWorkspaceKindFromBaseFileId(fileId: HtmlWorkspaceFileId): HtmlWorkspaceCustomKind {
  if (fileId === "markup") {
    return "html";
  }

  if (fileId === "styles") {
    return "css";
  }

  return "javascript";
}

function getHtmlWorkspaceFileExtension(kind: HtmlWorkspaceCustomKind) {
  if (kind === "html") {
    return "html";
  }

  if (kind === "css") {
    return "css";
  }

  return "js";
}

function getHtmlWorkspaceMonacoLanguage(kind: HtmlWorkspaceCustomKind) {
  if (kind === "html") {
    return "html";
  }

  if (kind === "css") {
    return "css";
  }

  return "javascript";
}

function inferHtmlWorkspaceCustomKind(fileName: string, fallback: HtmlWorkspaceCustomKind): HtmlWorkspaceCustomKind {
  const normalizedName = fileName.trim().toLowerCase();

  if (normalizedName.endsWith(".html") || normalizedName.endsWith(".htm")) {
    return "html";
  }

  if (normalizedName.endsWith(".css")) {
    return "css";
  }

  if (normalizedName.endsWith(".js") || normalizedName.endsWith(".mjs") || normalizedName.endsWith(".cjs")) {
    return "javascript";
  }

  return fallback;
}

function buildHtmlWorkspaceCustomStarter(kind: HtmlWorkspaceCustomKind) {
  if (kind === "html") {
    return `<section class="custom-block">
  <h2>New section</h2>
  <p>Custom HTML snippet ready.</p>
</section>`;
  }

  if (kind === "css") {
    return `.custom-block {
  padding: 16px;
  border-radius: 16px;
}`;
  }

  return `console.log("Custom JavaScript file ready.");`;
}

function buildHtmlWorkspaceCustomFileId() {
  return `html-file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildHtmlWorkspacePackageId() {
  return `html-package-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeHtmlWorkspacePackageSpecifier(value: string) {
  return value.trim().replace(/^npm:/i, "");
}

function getHtmlWorkspacePackageName(specifier: string) {
  const trimmed = specifier.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("@")) {
    const scopeSlashIndex = trimmed.indexOf("/", 1);

    if (scopeSlashIndex === -1) {
      return trimmed;
    }

    const versionIndex = trimmed.indexOf("@", scopeSlashIndex + 1);
    return versionIndex === -1 ? trimmed : trimmed.slice(0, versionIndex);
  }

  const versionIndex = trimmed.indexOf("@");
  return versionIndex === -1 ? trimmed : trimmed.slice(0, versionIndex);
}

function buildDefaultHtmlWorkspace(markupSource?: string, enableExtraFiles = true): HtmlWorkspaceState {
  return {
    activeFile: "markup",
    enabled: {
      script: enableExtraFiles,
      styles: enableExtraFiles,
    },
    fileNames: {
      markup: htmlWorkspaceFiles.markup.filename,
      script: htmlWorkspaceFiles.script.filename,
      styles: htmlWorkspaceFiles.styles.filename,
    },
    files: {
      markup: markupSource ?? htmlWorkspaceFiles.markup.starter,
      script: htmlWorkspaceFiles.script.starter,
      styles: htmlWorkspaceFiles.styles.starter,
    },
    customFiles: [],
    packages: [],
  };
}

function buildStoredHtmlWorkspace(raw: unknown, fallbackMarkup?: string): HtmlWorkspaceState {
  const defaults = buildDefaultHtmlWorkspace(fallbackMarkup);

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const record = raw as Record<string, unknown>;
  const rawFiles =
    typeof record.files === "object" && record.files !== null && !Array.isArray(record.files)
      ? (record.files as Record<string, unknown>)
      : {};
  const rawEnabled =
    typeof record.enabled === "object" && record.enabled !== null && !Array.isArray(record.enabled)
      ? (record.enabled as Record<string, unknown>)
      : {};
  const rawFileNames =
    typeof record.fileNames === "object" && record.fileNames !== null && !Array.isArray(record.fileNames)
      ? (record.fileNames as Record<string, unknown>)
      : {};
  const rawCustomFiles = Array.isArray(record.customFiles) ? record.customFiles : [];
  const rawPackages = Array.isArray(record.packages) ? record.packages : [];

  const nextState: HtmlWorkspaceState = {
    activeFile:
      typeof record.activeFile === "string" ? record.activeFile : defaults.activeFile,
    enabled: {
      script: typeof rawEnabled.script === "boolean" ? rawEnabled.script : defaults.enabled.script,
      styles: typeof rawEnabled.styles === "boolean" ? rawEnabled.styles : defaults.enabled.styles,
    },
    fileNames: {
      markup: typeof rawFileNames.markup === "string" ? rawFileNames.markup : defaults.fileNames.markup,
      script: typeof rawFileNames.script === "string" ? rawFileNames.script : defaults.fileNames.script,
      styles: typeof rawFileNames.styles === "string" ? rawFileNames.styles : defaults.fileNames.styles,
    },
    files: {
      markup: typeof rawFiles.markup === "string" ? rawFiles.markup : defaults.files.markup,
      script: typeof rawFiles.script === "string" ? rawFiles.script : defaults.files.script,
      styles: typeof rawFiles.styles === "string" ? rawFiles.styles : defaults.files.styles,
    },
    customFiles: rawCustomFiles.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const customRecord = entry as Record<string, unknown>;
      const rawKind = typeof customRecord.kind === "string" ? customRecord.kind : "";
      const kind: HtmlWorkspaceCustomKind = isHtmlWorkspaceCustomKind(rawKind)
        ? rawKind
        : inferHtmlWorkspaceCustomKind(String(customRecord.name ?? ""), "javascript");

      return [
        {
          id:
            typeof customRecord.id === "string" && customRecord.id.trim().length > 0
              ? customRecord.id
              : buildHtmlWorkspaceCustomFileId(),
          kind,
          name:
            typeof customRecord.name === "string" && customRecord.name.trim().length > 0
              ? customRecord.name
              : `custom.${getHtmlWorkspaceFileExtension(kind)}`,
          content: typeof customRecord.content === "string" ? customRecord.content : buildHtmlWorkspaceCustomStarter(kind),
          includeInPreview:
            typeof customRecord.includeInPreview === "boolean"
              ? customRecord.includeInPreview
              : kind !== "html",
        } satisfies HtmlWorkspaceCustomFile,
      ];
    }),
    packages: rawPackages.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const packageRecord = entry as Record<string, unknown>;
      const specifier = typeof packageRecord.specifier === "string" ? normalizeHtmlWorkspacePackageSpecifier(packageRecord.specifier) : "";
      const name = typeof packageRecord.name === "string" ? packageRecord.name.trim() : getHtmlWorkspacePackageName(specifier);

      if (!specifier || !name) {
        return [];
      }

      return [
        {
          id:
            typeof packageRecord.id === "string" && packageRecord.id.trim().length > 0
              ? packageRecord.id
              : buildHtmlWorkspacePackageId(),
          name,
          specifier,
        } satisfies HtmlWorkspacePackage,
      ];
    }),
  };

  if (nextState.activeFile === "styles" && !nextState.enabled.styles) {
    nextState.activeFile = "markup";
  }

  if (nextState.activeFile === "script" && !nextState.enabled.script) {
    nextState.activeFile = "markup";
  }

  if (
    !isHtmlWorkspaceFileId(nextState.activeFile) &&
    !nextState.customFiles.some((file) => file.id === nextState.activeFile)
  ) {
    nextState.activeFile = "markup";
  }

  return nextState;
}

function normalizeHtmlWorkspaceFileName(fileId: HtmlWorkspaceFileId, value: string) {
  const expectedName = htmlWorkspaceFiles[fileId].filename;
  const extension = expectedName.split(".").pop() ?? "";
  const sanitizedValue = value.trim().replace(/[\\/:*?"<>|]+/g, "-");

  if (!sanitizedValue) {
    return expectedName;
  }

  if (sanitizedValue.toLowerCase().endsWith(`.${extension}`)) {
    return sanitizedValue;
  }

  return `${sanitizedValue}.${extension}`;
}

function normalizeHtmlWorkspaceCustomFileName(kind: HtmlWorkspaceCustomKind, value: string) {
  const extension = getHtmlWorkspaceFileExtension(kind);
  const sanitizedValue = value.trim().replace(/[\\/:*?"<>|]+/g, "-");

  if (!sanitizedValue) {
    return `custom.${extension}`;
  }

  if (sanitizedValue.toLowerCase().endsWith(`.${extension}`)) {
    return sanitizedValue;
  }

  return `${sanitizedValue}.${extension}`;
}

function ensureUniqueFileName(value: string, takenNames: string[]) {
  const lowerValue = value.toLowerCase();
  const otherNames = takenNames.map((currentValue) => currentValue.toLowerCase());

  if (!otherNames.includes(lowerValue)) {
    return value;
  }

  const extensionMatch = value.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] ?? "";
  const baseName = extension ? value.slice(0, -extension.length) : value;
  let suffix = 2;
  let candidate = `${baseName}-${suffix}${extension}`;

  while (otherNames.includes(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName}-${suffix}${extension}`;
  }

  return candidate;
}

function ensureUniqueHtmlWorkspaceFileName(
  fileId: HtmlWorkspaceFileId,
  value: string,
  fileNames: Record<HtmlWorkspaceFileId, string>,
  customFiles: HtmlWorkspaceCustomFile[],
) {
  return ensureUniqueFileName(
    value,
    [
      ...(Object.entries(fileNames) as Array<[HtmlWorkspaceFileId, string]>)
        .filter(([currentFileId]) => currentFileId !== fileId)
        .map(([, currentValue]) => currentValue),
      ...customFiles.map((file) => file.name),
    ],
  );
}

function normalizeHtmlMarkup(markup: string) {
  const trimmed = markup.trim();

  if (!trimmed) {
    return htmlWorkspaceFiles.markup.starter;
  }

  if (/<html[\s>]/i.test(trimmed) || /<!doctype/i.test(trimmed)) {
    return trimmed;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeOrbit Browser Preview</title>
  </head>
  <body>
    ${trimmed}
  </body>
</html>`;
}

function injectIntoHead(markup: string, block: string) {
  if (/<\/head>/i.test(markup)) {
    return markup.replace(/<\/head>/i, `${block}\n</head>`);
  }

  if (/<body[^>]*>/i.test(markup)) {
    return markup.replace(/<body([^>]*)>/i, `<head>\n${block}\n</head>\n<body$1>`);
  }

  return `${block}\n${markup}`;
}

function injectIntoBody(markup: string, block: string) {
  if (/<\/body>/i.test(markup)) {
    return markup.replace(/<\/body>/i, `${block}\n</body>`);
  }

  return `${markup}\n${block}`;
}

function buildHtmlPreviewDocument(workspace: HtmlWorkspaceState) {
  let markup = normalizeHtmlMarkup(workspace.files.markup);
  const cssBlocks = [
    workspace.enabled.styles
      ? {
          name: workspace.fileNames.styles,
          content: workspace.files.styles.trim(),
        }
      : null,
    ...workspace.customFiles
      .filter((file) => file.kind === "css" && file.includeInPreview)
      .map((file) => ({
        name: file.name,
        content: file.content.trim(),
      })),
  ].filter((block): block is { name: string; content: string } => Boolean(block?.content));

  const scriptBlocks = [
    workspace.enabled.script
      ? {
          name: workspace.fileNames.script,
          content: workspace.files.script.trim(),
        }
      : null,
    ...workspace.customFiles
      .filter((file) => file.kind === "javascript" && file.includeInPreview)
      .map((file) => ({
        name: file.name,
        content: file.content.trim(),
      })),
  ].filter((block): block is { name: string; content: string } => Boolean(block?.content));

  const htmlBlocks = workspace.customFiles
    .filter((file) => file.kind === "html" && file.includeInPreview)
    .map((file) => ({
      name: file.name,
      content: file.content.trim(),
    }))
    .filter((block) => block.content);
  const hasModuleScripts =
    workspace.packages.length > 0 ||
    scriptBlocks.some((block) => /\bimport\s+.+from\s+['"]|^\s*import\s+['"]|\bexport\s+/m.test(block.content));

  if (workspace.packages.length > 0) {
    const imports = workspace.packages.reduce<Record<string, string>>((acc, pkg) => {
      acc[pkg.name] = `https://esm.sh/${pkg.specifier}`;
      acc[`${pkg.name}/`] = `https://esm.sh/${pkg.specifier}/`;
      return acc;
    }, {});

    markup = injectIntoHead(
      markup,
      `<script type="importmap" data-codeorbit-importmap>\n${JSON.stringify({ imports }, null, 2)}\n</script>`,
    );
  }

  for (const block of cssBlocks) {
    markup = injectIntoHead(markup, `<style data-codeorbit-file="${block.name}">\n${block.content}\n</style>`);
  }

  for (const block of htmlBlocks) {
    markup = injectIntoBody(markup, `<!-- ${block.name} -->\n${block.content}`);
  }

  for (const block of scriptBlocks) {
    markup = injectIntoBody(
      markup,
      `<script${hasModuleScripts ? ` type="module"` : ""} data-codeorbit-file="${block.name}">\n${block.content}\n</script>`,
    );
  }

  return markup;
}

function LanguageGlyph({
  option,
  className,
  size,
}: {
  option: LanguageOption;
  className?: string;
  size: number;
}) {
  if (option.iconPath) {
    return (
      <Image
        src={option.iconPath}
        alt={option.label}
        width={size}
        height={size}
        className={className ?? ""}
      />
    );
  }

  return (
    <span className={className ?? ""} style={{ fontSize: `${size}px`, lineHeight: 1 }}>
      {option.icon}
    </span>
  );
}

function PanelShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative flex h-full w-full flex-col overflow-hidden bg-[#060608] ${className}`}>
      {children}
    </section>
  );
}

function PanelGroup({
  direction,
  ...props
}: Omit<React.ComponentProps<typeof Group>, "orientation"> & {
  direction: "horizontal" | "vertical";
}) {
  return <Group orientation={direction} {...props} />;
}

function PanelResizeHandle(props: React.ComponentProps<typeof Separator>) {
  return <Separator {...props} />;
}

export function PlaygroundShell() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = usePlatformShell();
  const [activeLang, setActiveLang] = useState<LanguageId>("javascript");
  const [editorFont, setEditorFont] = useState<SandboxFontId>("jetbrains-mono");
  const [activeTab, setActiveTab] = useState<"output" | "errors" | "input">("output");
  const [isPlaygroundFullscreen, setIsPlaygroundFullscreen] = useState(false);
  const [isWebCoreActionsOpen, setIsWebCoreActionsOpen] = useState(false);
  const [webCoreActionsPosition, setWebCoreActionsPosition] = useState<{ top: number; left: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [codes, setCodes] = useState<Record<LanguageId, string>>(buildDefaultCodeMap);
  const [htmlWorkspace, setHtmlWorkspace] = useState<HtmlWorkspaceState>(buildDefaultHtmlWorkspace());
  const [inputStr, setInputStr] = useState("");
  const [outputStr, setOutputStr] = useState("");
  const [errorStr, setErrorStr] = useState("");
  const [previewDoc, setPreviewDoc] = useState("");
  const [sqlTables, setSqlTables] = useState<SqlResultTable[]>([]);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);
  const [hasRestoredPlaygroundState, setHasRestoredPlaygroundState] = useState(false);
  const playgroundRootRef = useRef<HTMLDivElement | null>(null);
  const runStartRef = useRef<number>(0);
  const webCoreActionsButtonRef = useRef<HTMLButtonElement | null>(null);

  const lang = languageOptions.find((option) => option.id === activeLang) ?? languageOptions[0];
  const selectedEditorFont =
    sandboxFontOptions.find((option) => option.id === editorFont) ?? sandboxFontOptions[0];
  const editorFontStack = selectedEditorFont.stack;

  useEffect(() => {
    if (!isAuthLoaded) {
      return;
    }

    try {
      if (!isSignedIn) {
        clearStoredPlaygroundState();
        setActiveLang("javascript");
        setEditorFont("jetbrains-mono");
        setCodes(buildDefaultCodeMap());
        setHtmlWorkspace(buildDefaultHtmlWorkspace());
        return;
      }

      const storedCodes = window.localStorage.getItem(playgroundCodesStorageKey);
      const defaultCodes = buildDefaultCodeMap();
      let restoredHtmlMarkup: string | undefined;

      if (storedCodes) {
        const parsedCodes = JSON.parse(storedCodes) as Partial<Record<LanguageId, string>>;
        restoredHtmlMarkup = typeof parsedCodes.html === "string" ? parsedCodes.html : undefined;

        setCodes(
          languageOptions.reduce(
            (acc, option) => {
              const restoredCode = parsedCodes[option.id];
              acc[option.id] = typeof restoredCode === "string" ? restoredCode : defaultCodes[option.id];
              return acc;
            },
            { ...defaultCodes },
          ),
        );
      }

      const storedHtmlWorkspace = window.localStorage.getItem(htmlWorkspaceStorageKey);

      if (storedHtmlWorkspace) {
        setHtmlWorkspace(buildStoredHtmlWorkspace(JSON.parse(storedHtmlWorkspace), restoredHtmlMarkup));
      } else if (restoredHtmlMarkup) {
        setHtmlWorkspace(buildDefaultHtmlWorkspace(restoredHtmlMarkup, false));
      }

      const storedLanguage = window.localStorage.getItem(playgroundLanguageStorageKey);
      if (storedLanguage && isLanguageId(storedLanguage)) {
        setActiveLang(storedLanguage);
      }

      const storedEditorFont = window.localStorage.getItem(playgroundEditorFontStorageKey);
      if (storedEditorFont && isSandboxFontId(storedEditorFont)) {
        setEditorFont(storedEditorFont);
      }
    } catch (error) {
      console.warn("Unable to restore playground state", error);
    } finally {
      setHasRestoredPlaygroundState(true);
    }
  }, [isAuthLoaded, isSignedIn]);

  useEffect(() => {
    if (!hasRestoredPlaygroundState || !isAuthLoaded) {
      return;
    }

    try {
      if (!isSignedIn) {
        clearStoredPlaygroundState();
        return;
      }

      window.localStorage.setItem(playgroundCodesStorageKey, JSON.stringify(codes));
      window.localStorage.setItem(playgroundLanguageStorageKey, activeLang);
      window.localStorage.setItem(htmlWorkspaceStorageKey, JSON.stringify(htmlWorkspace));
      window.localStorage.setItem(playgroundEditorFontStorageKey, editorFont);
    } catch (error) {
      console.warn("Unable to persist playground state", error);
    }
  }, [activeLang, codes, editorFont, hasRestoredPlaygroundState, htmlWorkspace, isAuthLoaded, isSignedIn]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isRunning) {
          void handleRun();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, activeLang, codes]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsPlaygroundFullscreen(document.fullscreenElement === playgroundRootRef.current);
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const clearRunState = useCallback(() => {
    setOutputStr("");
    setErrorStr("");
    setPreviewDoc("");
    setSqlTables([]);
    setExecTimeMs(null);
  }, []);

  const clearPanels = useCallback(() => {
    clearRunState();
    setHasRun(false);
    setActiveTab("output");
  }, [clearRunState]);

  const togglePlaygroundFullscreen = useCallback(async () => {
    const rootElement = playgroundRootRef.current;

    if (!rootElement || typeof document === "undefined") {
      return;
    }

    try {
      if (document.fullscreenElement === rootElement) {
        await document.exitFullscreen();
        return;
      }

      await rootElement.requestFullscreen();
    } catch (error) {
      console.warn("Unable to toggle playground fullscreen mode.", error);
    }
  }, []);

  const handleLanguageChange = useCallback(
    (next: LanguageId) => {
      if (next === activeLang) {
        return;
      }

      setIsWebCoreActionsOpen(false);
      setActiveLang(next);
      clearPanels();
    },
    [activeLang, clearPanels]
  );

  const handleReset = useCallback(() => {
    if (activeLang === "html") {
      setHtmlWorkspace((current) => {
        const defaults = buildDefaultHtmlWorkspace();
        const nextActiveFile =
          current.activeFile === "markup" ||
          (current.activeFile === "styles" && current.enabled.styles) ||
          (current.activeFile === "script" && current.enabled.script)
            ? current.activeFile
            : "markup";

        return {
          activeFile: nextActiveFile,
          enabled: current.enabled,
          fileNames: current.fileNames,
          files: defaults.files,
          customFiles: [],
          packages: current.packages,
        };
      });
    } else {
      setCodes((current) => ({ ...current, [activeLang]: starterTemplates[activeLang] }));
    }

    clearPanels();
  }, [activeLang, clearPanels]);

  const htmlVisibleFiles = [
    {
      id: "markup",
      name: htmlWorkspace.fileNames.markup,
      monaco: htmlWorkspaceFiles.markup.monaco,
      kind: getHtmlWorkspaceKindFromBaseFileId("markup"),
      isBase: true,
      canHide: false,
      canDelete: false,
      includeInPreview: true,
    },
    ...(htmlWorkspace.enabled.styles
      ? [
          {
            id: "styles",
            name: htmlWorkspace.fileNames.styles,
            monaco: htmlWorkspaceFiles.styles.monaco,
            kind: getHtmlWorkspaceKindFromBaseFileId("styles"),
            isBase: true,
            canHide: true,
            canDelete: false,
            includeInPreview: true,
          },
        ]
      : []),
    ...(htmlWorkspace.enabled.script
      ? [
          {
            id: "script",
            name: htmlWorkspace.fileNames.script,
            monaco: htmlWorkspaceFiles.script.monaco,
            kind: getHtmlWorkspaceKindFromBaseFileId("script"),
            isBase: true,
            canHide: true,
            canDelete: false,
            includeInPreview: true,
          },
        ]
      : []),
    ...htmlWorkspace.customFiles.map((file) => ({
      id: file.id,
      name: file.name,
      monaco: getHtmlWorkspaceMonacoLanguage(file.kind),
      kind: file.kind,
      isBase: false,
      canHide: false,
      canDelete: true,
      includeInPreview: file.includeInPreview,
    })),
  ];
  const currentHtmlFile = htmlVisibleFiles.find((file) => file.id === htmlWorkspace.activeFile) ?? htmlVisibleFiles[0];
  const previewConnectedFilesCount =
    1 +
    (htmlWorkspace.enabled.styles ? 1 : 0) +
    (htmlWorkspace.enabled.script ? 1 : 0) +
    htmlWorkspace.customFiles.filter((file) => file.includeInPreview).length;
  const editorFilename =
    activeLang === "html" ? currentHtmlFile?.name ?? htmlWorkspace.fileNames.markup : lang.filename;
  const editorLanguage = activeLang === "html" ? currentHtmlFile?.monaco ?? htmlWorkspaceFiles.markup.monaco : lang.monaco;
  const editorValue =
    activeLang === "html"
      ? isHtmlWorkspaceFileId(htmlWorkspace.activeFile)
        ? htmlWorkspace.files[htmlWorkspace.activeFile]
        : htmlWorkspace.customFiles.find((file) => file.id === htmlWorkspace.activeFile)?.content ?? ""
      : codes[activeLang];

  const enableHtmlWorkspaceFile = useCallback((fileId: "styles" | "script") => {
    setHtmlWorkspace((current) => ({
      ...current,
      activeFile: fileId,
      enabled: {
        ...current.enabled,
        [fileId]: true,
      },
    }));
  }, []);

  const disableHtmlWorkspaceFile = useCallback((fileId: "styles" | "script") => {
    setHtmlWorkspace((current) => ({
      ...current,
      activeFile: current.activeFile === fileId ? "markup" : current.activeFile,
      enabled: {
        ...current.enabled,
        [fileId]: false,
      },
    }));
  }, []);

  const renameHtmlWorkspaceFile = useCallback(() => {
    const activeFile = htmlWorkspace.activeFile;
    const currentName = currentHtmlFile?.name ?? htmlWorkspace.fileNames.markup;
    const suggestedName = currentName.replace(/\.[^.]+$/, "");
    const promptedName = window.prompt("Rename current file", suggestedName);

    if (promptedName === null) {
      return;
    }

    if (isHtmlWorkspaceFileId(activeFile)) {
      const normalizedName = normalizeHtmlWorkspaceFileName(activeFile, promptedName);
      const uniqueName = ensureUniqueHtmlWorkspaceFileName(
        activeFile,
        normalizedName,
        htmlWorkspace.fileNames,
        htmlWorkspace.customFiles,
      );

      setHtmlWorkspace((current) => ({
        ...current,
        fileNames: {
          ...current.fileNames,
          [activeFile]: uniqueName,
        },
      }));
      return;
    }

    const activeCustomFile = htmlWorkspace.customFiles.find((file) => file.id === activeFile);

    if (!activeCustomFile) {
      return;
    }

    const normalizedName = normalizeHtmlWorkspaceCustomFileName(activeCustomFile.kind, promptedName);
    const uniqueName = ensureUniqueFileName(normalizedName, [
      ...Object.values(htmlWorkspace.fileNames),
      ...htmlWorkspace.customFiles.filter((file) => file.id !== activeFile).map((file) => file.name),
    ]);

    setHtmlWorkspace((current) => ({
      ...current,
      customFiles: current.customFiles.map((file) =>
        file.id === activeFile
          ? {
              ...file,
              name: uniqueName,
            }
          : file,
      ),
    }));
  }, [currentHtmlFile, htmlWorkspace.activeFile, htmlWorkspace.customFiles, htmlWorkspace.fileNames]);

  const createCustomHtmlWorkspaceFile = useCallback(() => {
    const fallbackKind = currentHtmlFile?.kind ?? "javascript";
    const promptedName = window.prompt("Add extra file (examples: section.html, theme.css, helper.js)", "");

    if (promptedName === null) {
      return;
    }

    const kind = inferHtmlWorkspaceCustomKind(promptedName, fallbackKind);
    const normalizedName = normalizeHtmlWorkspaceCustomFileName(kind, promptedName || `custom.${getHtmlWorkspaceFileExtension(kind)}`);

    setHtmlWorkspace((current) => {
      const uniqueName = ensureUniqueFileName(normalizedName, [
        ...Object.values(current.fileNames),
        ...current.customFiles.map((file) => file.name),
      ]);
      const nextFile: HtmlWorkspaceCustomFile = {
        id: buildHtmlWorkspaceCustomFileId(),
        kind,
        name: uniqueName,
        content: buildHtmlWorkspaceCustomStarter(kind),
        includeInPreview: kind !== "html",
      };

      return {
        ...current,
        activeFile: nextFile.id,
        customFiles: [...current.customFiles, nextFile],
      };
    });
  }, [currentHtmlFile?.kind]);

  const addHtmlWorkspacePackage = useCallback(() => {
    const promptedSpecifier = window.prompt(
      "Add package (examples: react, react@18, three, @supabase/supabase-js)",
      "",
    );

    if (promptedSpecifier === null) {
      return;
    }

    const specifier = normalizeHtmlWorkspacePackageSpecifier(promptedSpecifier);
    const name = getHtmlWorkspacePackageName(specifier);

    if (!specifier || !name) {
      return;
    }

    setHtmlWorkspace((current) => {
      const existingPackage = current.packages.find((pkg) => pkg.name === name);
      const nextPackage: HtmlWorkspacePackage = existingPackage
        ? { ...existingPackage, specifier }
        : {
            id: buildHtmlWorkspacePackageId(),
            name,
            specifier,
          };

      return {
        ...current,
        activeFile: "script",
        enabled: {
          ...current.enabled,
          script: true,
        },
        packages: existingPackage
          ? current.packages.map((pkg) => (pkg.name === name ? nextPackage : pkg))
          : [...current.packages, nextPackage],
      };
    });
  }, []);

  const removeHtmlWorkspacePackage = useCallback((packageId: string) => {
    setHtmlWorkspace((current) => ({
      ...current,
      packages: current.packages.filter((pkg) => pkg.id !== packageId),
    }));
  }, []);

  const duplicateCurrentHtmlWorkspaceFile = useCallback(() => {
    if (!currentHtmlFile) {
      return;
    }

    const baseName = currentHtmlFile.name.replace(/\.[^.]+$/, "");
    const duplicateName = normalizeHtmlWorkspaceCustomFileName(currentHtmlFile.kind, `${baseName}-copy`);

    setHtmlWorkspace((current) => {
      const sourceContent = isHtmlWorkspaceFileId(current.activeFile)
        ? current.files[current.activeFile]
        : current.customFiles.find((file) => file.id === current.activeFile)?.content ?? "";
      const uniqueName = ensureUniqueFileName(duplicateName, [
        ...Object.values(current.fileNames),
        ...current.customFiles.map((file) => file.name),
      ]);
      const nextFile: HtmlWorkspaceCustomFile = {
        id: buildHtmlWorkspaceCustomFileId(),
        kind: currentHtmlFile.kind,
        name: uniqueName,
        content: sourceContent,
        includeInPreview: false,
      };

      return {
        ...current,
        activeFile: nextFile.id,
        customFiles: [...current.customFiles, nextFile],
      };
    });
  }, [currentHtmlFile]);

  const downloadCurrentHtmlWorkspaceFile = useCallback(() => {
    const fileBlob = new Blob([editorValue], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = editorFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);

    setOutputStr(`Downloaded ${editorFilename}.`);
    setErrorStr("");
    setActiveTab("output");
  }, [editorFilename, editorValue]);

  const toggleCurrentCustomFilePreview = useCallback(() => {
    if (isHtmlWorkspaceFileId(htmlWorkspace.activeFile)) {
      return;
    }

    setHtmlWorkspace((current) => ({
      ...current,
      customFiles: current.customFiles.map((file) =>
        file.id === current.activeFile
          ? {
              ...file,
              includeInPreview: !file.includeInPreview,
            }
          : file,
      ),
    }));
  }, [htmlWorkspace.activeFile]);

  const deleteCurrentCustomFile = useCallback(() => {
    if (isHtmlWorkspaceFileId(htmlWorkspace.activeFile)) {
      return;
    }

    setHtmlWorkspace((current) => ({
      ...current,
      activeFile: "markup",
      customFiles: current.customFiles.filter((file) => file.id !== current.activeFile),
    }));
  }, [htmlWorkspace.activeFile]);

  const updateWebCoreActionsPosition = useCallback(() => {
    if (!webCoreActionsButtonRef.current) {
      return;
    }

    const rect = webCoreActionsButtonRef.current.getBoundingClientRect();
    const menuWidth = 380;
    const nextLeft = Math.min(Math.max(16, rect.right - menuWidth), window.innerWidth - menuWidth - 16);

    setWebCoreActionsPosition({
      top: rect.bottom + 12,
      left: nextLeft,
    });
  }, []);

  const openWebCoreActions = useCallback(() => {
    updateWebCoreActionsPosition();
    setIsWebCoreActionsOpen(true);
  }, [updateWebCoreActionsPosition]);

  const closeWebCoreActions = useCallback(() => {
    setIsWebCoreActionsOpen(false);
  }, []);

  const toggleWebCoreActions = useCallback(() => {
    if (isWebCoreActionsOpen) {
      setIsWebCoreActionsOpen(false);
      return;
    }

    openWebCoreActions();
  }, [isWebCoreActionsOpen, openWebCoreActions]);

  const runWebCoreAction = useCallback(
    (action: () => void) => {
      setIsWebCoreActionsOpen(false);
      action();
    },
    [],
  );

  const runWebCoreActionAsync = useCallback(
    async (action: () => Promise<void>) => {
      setIsWebCoreActionsOpen(false);
      await action();
    },
    [],
  );

  const openHtmlPreviewInNewTab = useCallback(() => {
    const doc = buildHtmlPreviewDocument(htmlWorkspace);
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setErrorStr("Preview tab could not be opened. Please allow pop-ups and try again.");
      setActiveTab("errors");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(doc);
    previewWindow.document.close();
    previewWindow.focus();
  }, [htmlWorkspace]);

  const exportHtmlWorkspaceZip = useCallback(async () => {
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      zip.file(htmlWorkspace.fileNames.markup, htmlWorkspace.files.markup);

      if (htmlWorkspace.enabled.styles) {
        zip.file(htmlWorkspace.fileNames.styles, htmlWorkspace.files.styles);
      }

      if (htmlWorkspace.enabled.script) {
        zip.file(htmlWorkspace.fileNames.script, htmlWorkspace.files.script);
      }

      for (const customFile of htmlWorkspace.customFiles) {
        zip.file(customFile.name, customFile.content);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = "codeorbit-browser-workspace.zip";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);

      const totalFiles = 1 + (htmlWorkspace.enabled.styles ? 1 : 0) + (htmlWorkspace.enabled.script ? 1 : 0) + htmlWorkspace.customFiles.length;
      setOutputStr(`Exported ${totalFiles} file${totalFiles === 1 ? "" : "s"} as codeorbit-browser-workspace.zip.`);
      setErrorStr("");
      setActiveTab("output");
    } catch (error: unknown) {
      setErrorStr(error instanceof Error ? error.message : "Unable to export your HTML workspace.");
      setActiveTab("errors");
    }
  }, [htmlWorkspace]);

  useEffect(() => {
    if (activeLang !== "html" || !hasRun) {
      return;
    }

    setPreviewDoc(buildHtmlPreviewDocument(htmlWorkspace));
  }, [activeLang, hasRun, htmlWorkspace]);

  useEffect(() => {
    if (!isWebCoreActionsOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWebCoreActionsOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateWebCoreActionsPosition();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isWebCoreActionsOpen, updateWebCoreActionsPosition]);

  const handleRun = async () => {
    setIsRunning(true);
    setHasRun(false);
    setActiveTab("output");
    clearRunState();
    setOutputStr("Running...");
    runStartRef.current = performance.now();

    const src = activeLang === "html" ? buildHtmlPreviewDocument(htmlWorkspace) : codes[activeLang];

    try {
      if (remoteExecutionLanguages.includes(activeLang)) {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: lang.engineLanguage ?? activeLang,
            code: src,
            stdin: inputStr,
          }),
        });

        const contentType = res.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          setOutputStr("");
          setErrorStr("The execution engine returned an unexpected response. Please try again in a moment.");
          setActiveTab("errors");
        } else {
          const result = await res.json();
          setOutputStr(result.output || "Execution complete with no output.");

          if (result.error) {
            setErrorStr(result.error);
            if (!result.output) {
              setActiveTab("errors");
            }
          }
        }
      } else if (activeLang === "html") {
        setPreviewDoc(src);
        setOutputStr(
          `Preview rendered successfully using ${previewConnectedFilesCount} file${previewConnectedFilesCount === 1 ? "" : "s"}.`,
        );
      } else if (activeLang === "sql") {
        const { runSqlCode } = await import("@/lib/sqlRunner");
        const result = await runSqlCode(src);
        setOutputStr(result.output || "SQL executed successfully.");
        setSqlTables(result.tables);

        if (result.error) {
          setErrorStr(result.error);
          setActiveTab("errors");
        }
      }
    } catch (error: unknown) {
      setErrorStr(error instanceof Error ? error.message : String(error));
      setActiveTab("errors");
    } finally {
      setIsRunning(false);
      setHasRun(true);
      setExecTimeMs(Math.round(performance.now() - runStartRef.current));
    }
  };

  const stdinHint =
    activeLang === "javascript"
      ? "JavaScript: add one answer per line here. prompt(), confirm(), and input() read from this tab."
      : remoteExecutionLanguages.includes(activeLang)
        ? "Provide stdin here. Use new lines for multiple reads."
        : "Stdin is used by the remote execution languages.";

  const hasErrors = errorStr.length > 0;

  const renderOutput = () => {
    if (activeLang === "html" && hasRun) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-white/5 px-4 py-3 font-sans text-xs font-semibold tracking-tight text-zinc-400">
            Live Preview
          </div>
          <div className="min-h-0 flex-1 bg-white">
            <iframe
              className="h-full w-full border-none"
              sandbox="allow-scripts allow-modals"
              srcDoc={previewDoc || buildHtmlPreviewDocument(htmlWorkspace)}
              title="preview"
            />
          </div>
        </div>
      );
    }

    if (activeLang === "sql" && hasRun && sqlTables.length > 0) {
      return (
        <div className="space-y-3 p-4 font-sans tracking-tight">
          {outputStr ? (
            <div 
              className="rounded-xl border border-[#00ffa3]/10 bg-[#00ffa3]/5 px-4 py-3 text-[12px] font-medium text-[#00ffa3]"
              style={{ fontFamily: editorFontStack }}
            >
              {outputStr}
            </div>
          ) : null}

          {sqlTables.map((table, index) => (
            <div key={`${table.title}-${index}`} className="overflow-hidden rounded-xl border border-white/5 bg-black/10">
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <div>
                  <p className="text-[13px] font-semibold text-white">{table.title}</p>
                  <p className="text-[11px] text-zinc-500">{table.rows.length} row(s)</p>
                </div>
                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2 py-1 text-[10px] font-semibold text-cyan-300">
                  Result
                </span>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr>
                      {table.columns.map((column) => (
                        <th
                          key={column}
                          className="border-b border-white/5 bg-black/10 px-3 py-2 font-sans text-[11px] font-semibold tracking-tight text-zinc-400"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="odd:bg-white/[0.015]">
                        {row.map((value, valueIndex) => (
                          <td
                            key={valueIndex}
                            className="border-b border-white/[0.03] px-3 py-2 font-mono text-[11px] text-zinc-200"
                            style={{ fontFamily: editorFontStack }}
                          >
                            {value === null ? <span className="italic text-zinc-600">NULL</span> : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (hasRun && outputStr) {
      return (
        <div className="h-full bg-[#060609] p-4">
          <div className="mb-4 flex items-center justify-between font-sans tracking-tight">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Output</span>
            </div>
            {execTimeMs !== null ? <span className="text-[10px] text-zinc-600" style={{ fontFamily: editorFontStack }}>{execTimeMs}ms</span> : null}
          </div>
          <pre 
            className="rounded-xl bg-transparent p-1 text-[11px] leading-7 text-zinc-400"
            style={{ fontFamily: editorFontStack }}
          >
            {outputStr}
          </pre>
        </div>
      );
    }

    if (isRunning) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center font-sans tracking-tight">
          <LoaderCircle className="h-8 w-8 animate-spin text-zinc-500" />
          <div>
            <p className="text-[13px] font-semibold text-white">Executing your program</p>
            <p className="mt-1 text-xs text-zinc-500">Collecting stdout, stderr, and runtime feedback.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center font-sans tracking-tight">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 animate-pulse rounded-full bg-fuchsia-500/15 blur-2xl flex-shrink-0" />
            <div className="absolute h-32 w-32 animate-pulse rounded-full bg-cyan-500/10 blur-2xl translate-x-4 flex-shrink-0" style={{ animationDelay: '2s' }} />
          </div>
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8], y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#050505] backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.15)]"
          >
            <LanguageGlyph option={lang} size={36} className="opacity-90 grayscale-[0.2]" />
          </motion.div>
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
          Ready to execute {lang.label}
        </h3>
        <p className="mt-3 max-w-[320px] text-[12px] leading-relaxed text-zinc-400">
          Write your code in the editor and click Run Code. Output, errors, and previews will intelligently stream here.
        </p>
      </div>
    );
  };

  return (
    <div
      ref={playgroundRootRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#020202] font-sans tracking-tight text-white"
    >
      {activeLang === "html" && isWebCoreActionsOpen && webCoreActionsPosition ? (
        <div className="fixed inset-0 z-40 bg-[#020202]/84 backdrop-blur-[3px]" onClick={closeWebCoreActions}>
          <div
            className="absolute flex w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#09090d]/97 shadow-[0_30px_120px_rgba(0,0,0,0.58)]"
            onClick={(event) => event.stopPropagation()}
            style={{
              left: `${webCoreActionsPosition.left}px`,
              maxHeight: `calc(100vh - ${Math.max(24, webCoreActionsPosition.top + 24)}px)`,
              top: `${webCoreActionsPosition.top}px`,
            }}
          >
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Files</p>
                  <p className="mt-1 text-[13px] font-semibold text-white">{editorFilename}</p>
                </div>
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-300 hover:border-white/20 hover:text-white"
                  onClick={closeWebCoreActions}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-5 pr-1">
                <section className="space-y-2.5">
                  <div className="px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Main files</p>
                  </div>

                  <div className="grid gap-2">
                    <button
                      className={`w-full rounded-xl px-2 py-2.5 text-left transition-all duration-300 ${
                        htmlWorkspace.activeFile === "markup"
                          ? "bg-cyan-400/10"
                          : "hover:bg-white/[0.05]"
                      }`}
                      onClick={() =>
                        runWebCoreAction(() => {
                          setHtmlWorkspace((current) => ({ ...current, activeFile: "markup" }));
                        })
                      }
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-cyan-300/90" />
                          <p className="text-[13px] font-semibold text-white">{htmlWorkspace.fileNames.markup}</p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">Ready</span>
                      </div>
                    </button>

                    <button
                      className={`w-full rounded-xl px-2 py-2.5 text-left transition-all duration-300 ${
                        htmlWorkspace.enabled.styles
                          ? htmlWorkspace.activeFile === "styles"
                            ? "bg-cyan-400/10"
                            : "hover:bg-white/[0.05]"
                          : "hover:bg-white/[0.05]"
                      }`}
                      onClick={() =>
                        runWebCoreAction(() => {
                          if (htmlWorkspace.enabled.styles) {
                            setHtmlWorkspace((current) => ({ ...current, activeFile: "styles" }));
                            return;
                          }

                          enableHtmlWorkspaceFile("styles");
                        })
                      }
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${htmlWorkspace.enabled.styles ? "bg-cyan-300/90" : "bg-zinc-600"}`} />
                          <p className="text-[13px] font-semibold text-white">{htmlWorkspace.fileNames.styles}</p>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${htmlWorkspace.enabled.styles ? "text-cyan-200" : "text-zinc-500"}`}>
                          {htmlWorkspace.enabled.styles ? "Ready" : "Enable"}
                        </span>
                      </div>
                    </button>

                    <button
                      className={`w-full rounded-xl px-2 py-2.5 text-left transition-all duration-300 ${
                        htmlWorkspace.enabled.script
                          ? htmlWorkspace.activeFile === "script"
                            ? "bg-cyan-400/10"
                            : "hover:bg-white/[0.05]"
                          : "hover:bg-white/[0.05]"
                      }`}
                      onClick={() =>
                        runWebCoreAction(() => {
                          if (htmlWorkspace.enabled.script) {
                            setHtmlWorkspace((current) => ({ ...current, activeFile: "script" }));
                            return;
                          }

                          enableHtmlWorkspaceFile("script");
                        })
                      }
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${htmlWorkspace.enabled.script ? "bg-cyan-300/90" : "bg-zinc-600"}`} />
                          <p className="text-[13px] font-semibold text-white">{htmlWorkspace.fileNames.script}</p>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${htmlWorkspace.enabled.script ? "text-cyan-200" : "text-zinc-500"}`}>
                          {htmlWorkspace.enabled.script ? "Ready" : "Enable"}
                        </span>
                      </div>
                    </button>
                  </div>
                </section>

                <section className="space-y-2.5">
                  <div className="px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Extra files</p>
                  </div>

                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                    onClick={() => runWebCoreAction(createCustomHtmlWorkspaceFile)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5 text-zinc-400" />
                    Create extra file
                  </button>
                </section>

                <section className="space-y-2.5">
                  <div className="px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Packages</p>
                  </div>

                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                    onClick={() => runWebCoreAction(addHtmlWorkspacePackage)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5 text-zinc-400" />
                    Add package
                  </button>

                  {htmlWorkspace.packages.length > 0 ? (
                    <div className="space-y-1">
                      {htmlWorkspace.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-all duration-300 hover:bg-white/[0.04]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-white">{pkg.name}</p>
                            <p className="truncate text-[10px] text-zinc-500">{pkg.specifier}</p>
                          </div>
                          <button
                            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 transition-colors duration-300 hover:text-rose-200"
                            onClick={() => runWebCoreAction(() => removeHtmlWorkspacePackage(pkg.id))}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="space-y-2.5">
                  <div className="px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Actions</p>
                  </div>

                  <div className="grid gap-2">
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                      onClick={() => runWebCoreAction(duplicateCurrentHtmlWorkspaceFile)}
                      type="button"
                    >
                      <FileCode2 className="h-3.5 w-3.5 text-zinc-400" />
                      Duplicate current file
                    </button>

                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                      onClick={() => runWebCoreAction(renameHtmlWorkspaceFile)}
                      type="button"
                    >
                      <PencilLine className="h-3.5 w-3.5 text-zinc-400" />
                      Rename current file
                    </button>

                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                      onClick={() => runWebCoreAction(downloadCurrentHtmlWorkspaceFile)}
                      type="button"
                    >
                      <Download className="h-3.5 w-3.5 text-zinc-400" />
                      Download current file
                    </button>

                    {htmlWorkspace.enabled.styles ? (
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                        onClick={() => runWebCoreAction(() => disableHtmlWorkspaceFile("styles"))}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5 text-zinc-400" />
                        Remove CSS file
                      </button>
                    ) : null}

                    {htmlWorkspace.enabled.script ? (
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                        onClick={() => runWebCoreAction(() => disableHtmlWorkspaceFile("script"))}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5 text-zinc-400" />
                        Remove JS file
                      </button>
                    ) : null}

                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-cyan-100 transition-all duration-300 hover:bg-cyan-400/10"
                      onClick={() => {
                        void runWebCoreActionAsync(exportHtmlWorkspaceZip);
                      }}
                      type="button"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export full ZIP
                    </button>
                  </div>
                </section>

                {!currentHtmlFile?.isBase ? (
                  <section className="space-y-2.5">
                    <div className="px-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Current extra file</p>
                    </div>

                  <div className="grid gap-2">
                    <button
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold transition-all duration-300 ${
                        currentHtmlFile.includeInPreview
                          ? "text-emerald-100 hover:bg-emerald-400/10"
                          : "text-white hover:bg-white/[0.05]"
                      }`}
                      onClick={() => runWebCoreAction(toggleCurrentCustomFilePreview)}
                      type="button"
                    >
                      <span className={`h-2 w-2 rounded-full ${currentHtmlFile.includeInPreview ? "bg-emerald-300" : "bg-zinc-600"}`} />
                      {currentHtmlFile.includeInPreview ? "Preview is on" : "Preview is off"}
                    </button>

                    <button
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-rose-100 transition-all duration-300 hover:bg-rose-400/10"
                        onClick={() => runWebCoreAction(deleteCurrentCustomFile)}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                        Delete current file
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background-color: #18181b; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute top-[10%] -left-[10%] h-[60%] w-[50%] rounded-full bg-fuchsia-600/10 blur-[140px]" />
        <div className="absolute bottom-[0%] -right-[10%] h-[60%] w-[50%] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute top-[40%] left-[20%] h-[40%] w-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <header className="relative z-20 min-h-16 border-b border-white/[0.05] bg-[#020202]/60 px-3 py-3 backdrop-blur-2xl shadow-sm sm:px-4">
        <div className="flex w-full flex-wrap items-center gap-2">
          {isSidebarCollapsed ? (
            <button
              aria-label="Open sidebar"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition-all duration-300 hover:bg-white/[0.08] hover:text-white"
              onClick={toggleSidebar}
              type="button"
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}

          <div className="relative flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-cyan-500/40 group">
            <LanguageGlyph option={lang} size={16} className="h-3.5 w-3.5 flex-shrink-0 object-contain text-white opacity-80" />
            <span className="min-w-[58px] text-[10.5px] font-semibold text-zinc-200 sm:min-w-[66px] sm:text-[11px]">{lang.label}</span>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
            <select
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
              onChange={(event) => handleLanguageChange(event.target.value as LanguageId)}
              value={activeLang}
            >
              {languageOptions.map((option) => (
                <option key={option.id} value={option.id} className="bg-[#030303]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex flex-shrink-0 items-center gap-2">
            {activeLang !== "html" ? (
              <div className="flex items-center rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
                <span className="text-[10.5px] font-semibold text-zinc-300 sm:text-[11px]">{lang.runtime}</span>
              </div>
            ) : null}

            {activeLang === "html" ? (
              <button
                ref={webCoreActionsButtonRef}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-[10px] font-semibold text-cyan-100 transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-400/10"
                onClick={toggleWebCoreActions}
                type="button"
              >
                Files & Packages
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${isWebCoreActionsOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </div>

          {activeLang === "javascript" ? (
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 2xl:flex">
              <span className="text-[11px] font-medium text-cyan-200">
                JavaScript runs in Node. prompt() and input() read from the Input tab, and WebCore handles DOM code plus browser packages.
              </span>
            </div>
          ) : null}

          <div className="ml-auto flex flex-shrink-0 items-center gap-2 max-[1180px]:ml-0 max-[1180px]:w-full max-[1180px]:justify-end">
            {activeLang === "html" ? (
              <button
                className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3.5 py-1.5 text-[10.5px] font-semibold text-cyan-100 transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-400/10 sm:px-4 sm:text-[11px]"
                onClick={openHtmlPreviewInNewTab}
                type="button"
              >
                Browser Preview
              </button>
            ) : null}

            <div className="group relative">
              <div
                className={`pointer-events-none absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
                  isPlaygroundFullscreen
                    ? "bg-cyan-400/25 opacity-100"
                    : "bg-fuchsia-500/12 opacity-0 group-hover:opacity-100"
                }`}
              />
              <button
                aria-label={isPlaygroundFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border text-zinc-200 transition-all duration-300 hover:scale-[1.04] hover:text-white ${
                  isPlaygroundFullscreen
                    ? "border-cyan-300/35 bg-cyan-400/12 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.04] hover:border-cyan-300/30 hover:bg-white/[0.08]"
                }`}
                onClick={() => {
                  void togglePlaygroundFullscreen();
                }}
                type="button"
                title={isPlaygroundFullscreen ? "Minimize playground" : "Fullscreen playground"}
              >
                <div
                  className={`absolute inset-[1px] rounded-full transition-opacity duration-300 ${
                    isPlaygroundFullscreen
                      ? "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),rgba(8,47,73,0.08)_60%,transparent)] opacity-100"
                      : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)] opacity-70 group-hover:opacity-100"
                  }`}
                />
                <span className="relative z-10">
                  {isPlaygroundFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </span>
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#09090d]/96 px-3 py-1 text-[10px] font-semibold text-zinc-200 opacity-0 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:block group-hover:translate-y-0 group-hover:opacity-100">
                {isPlaygroundFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
              </span>
            </div>

            <button
              className="group relative overflow-hidden rounded-full p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRunning}
              onClick={handleRun}
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 opacity-80" />
              <div className="relative flex h-full w-full items-center justify-center gap-2 rounded-full bg-[#050505] px-4 py-2 text-[10.5px] font-bold text-zinc-100 transition-colors duration-300 group-hover:bg-transparent group-hover:text-white sm:px-5 sm:py-2.5 sm:text-[11.5px]">
                {isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                {isRunning ? "Running" : "Run Code"}
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel defaultSize={60} minSize={30} className="flex h-full min-w-0">
            <PanelShell className="flex w-full min-h-0 min-w-0 flex-col border-r border-white/[0.05]">
              <div className="flex min-h-[50px] items-center justify-between border-b border-white/[0.08] bg-black/20 px-3 py-2 sm:px-4">
                {activeLang === "html" ? (
                  <>
                    <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {htmlVisibleFiles.map((file) => {
                        const isActive = htmlWorkspace.activeFile === file.id;

                        return (
                          <div
                            key={file.id}
                            className={`group inline-flex items-center gap-1 rounded-full border pr-1 text-[10.5px] font-medium transition-all duration-300 sm:text-[11px] ${
                              isActive
                                ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                                : "border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                            }`}
                          >
                            <button
                              className="rounded-full px-2.5 py-1.5 sm:px-3"
                              style={{ fontFamily: editorFontStack }}
                              onClick={() =>
                                setHtmlWorkspace((current) => ({
                                  ...current,
                                  activeFile: file.id,
                                }))
                              }
                              type="button"
                            >
                              {file.name}
                            </button>
                            {!file.isBase && file.includeInPreview ? (
                              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2 py-0.5 text-[9px] font-semibold text-cyan-200">
                                Live
                              </span>
                            ) : null}
                            {file.canHide ? (
                              <button
                                aria-label={`Hide ${file.name}`}
                                className="rounded-full p-1 text-zinc-500 transition-colors duration-300 hover:bg-white/10 hover:text-zinc-100"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  disableHtmlWorkspaceFile(file.id as "styles" | "script");
                                }}
                                type="button"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            ) : null}
                            {file.canDelete ? (
                              <button
                                aria-label={`Delete ${file.name}`}
                                className="rounded-full p-1 text-zinc-500 transition-colors duration-300 hover:bg-white/10 hover:text-zinc-100"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setHtmlWorkspace((current) => ({
                                    ...current,
                                    activeFile: current.activeFile === file.id ? "markup" : current.activeFile,
                                    customFiles: current.customFiles.filter((entry) => entry.id !== file.id),
                                  }));
                                }}
                                type="button"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[12px] font-medium text-white shadow-sm">
                      <FileCode2 className="h-4 w-4 text-purple-400" />
                      Editor
                    </div>
                    <div className="text-[11px] text-zinc-500" style={{ fontFamily: editorFontStack }}>{editorFilename}</div>
                  </>
                )}
              </div>

              <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-black/10">
                <MonacoEditor
                beforeMount={configurePlaygroundMonaco}
                height="100%"
                language={editorLanguage}
                onChange={(value: string | undefined) => {
                  if (activeLang === "html") {
                    setHtmlWorkspace((current) => {
                      if (isHtmlWorkspaceFileId(current.activeFile)) {
                        return {
                          ...current,
                          files: {
                            ...current.files,
                            [current.activeFile]: value || "",
                          },
                        };
                      }

                      return {
                        ...current,
                        customFiles: current.customFiles.map((file) =>
                          file.id === current.activeFile
                            ? {
                                ...file,
                                content: value || "",
                              }
                            : file,
                        ),
                      };
                    });
                    return;
                  }

                  setCodes((current) => ({ ...current, [activeLang]: value || "" }));
                }}
                options={{
                  acceptSuggestionOnEnter: "smart",
                  automaticLayout: true,
                  bracketPairColorization: { enabled: false },
                  wordWrap: "on",
                  fontSize: playgroundEditorFontSize,
                  fontFamily: editorFontStack,
                  fontLigatures: true,
                  inlineSuggest: { enabled: true },
                  lineHeight: 1.6,
                  minimap: { enabled: false },
                  parameterHints: { enabled: true },
                  padding: { top: 20, bottom: 20 },
                  quickSuggestions: { comments: true, other: true, strings: true },
                  renderLineHighlight: "none",
                  scrollBeyondLastLine: false,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  snippetSuggestions: "inline",
                  suggestOnTriggerCharacters: true,
                  tabCompletion: "on",
                  wordBasedSuggestions: "allDocuments",
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showClasses: true,
                    showFunctions: true,
                    showVariables: true,
                    showWords: true,
                  }
                }}
                path={`playground/${editorFilename}`}
                saveViewState
                theme="codeorbit-dark"
                value={editorValue}
              />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-black/20 px-3 py-2 sm:px-4">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 sm:text-[10.5px]">
                  <Keyboard className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="font-semibold uppercase tracking-[0.16em]">Editor Font</span>
                  <span className="hidden text-zinc-600 sm:inline">{selectedEditorFont.preview}</span>
                </div>

                <div className="relative min-w-[180px] max-w-full rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 transition-all duration-300 hover:border-white/[0.12]">
                  <select
                    aria-label="Choose playground editor font"
                    className="w-full appearance-none bg-transparent pr-6 text-[11px] font-semibold text-zinc-200 outline-none"
                    onChange={(event) => setEditorFont(event.target.value as SandboxFontId)}
                    style={{ fontFamily: editorFontStack }}
                    value={editorFont}
                  >
                    {sandboxFontOptions.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        className="bg-[#050505] text-zinc-100"
                        style={{ fontFamily: option.stack }}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>
          </PanelShell>
          </Panel>

          <PanelResizeHandle
            className="group relative flex w-[1px] shrink-0 items-stretch justify-center bg-white/[0.05] outline-none transition-colors duration-300 hover:bg-cyan-500/50 data-[separator=hover]:bg-cyan-500/50 data-[separator=drag]:bg-cyan-500"
          >
            <span className="pointer-events-none absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-transparent" />
          </PanelResizeHandle>

          <Panel defaultSize={40} minSize={20} className="flex h-full min-w-0">
            <PanelShell className="flex w-full min-h-0 min-w-0 flex-col">
              <div className="flex min-h-[50px] flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-black/20 px-3 py-2 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-white/[0.05] bg-white/[0.02] p-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {([
                      { id: "output", label: "Output", Icon: TerminalSquare },
                      { id: "errors", label: "Errors", Icon: AlertTriangle },
                      { id: "input", label: "Input", Icon: Keyboard },
                    ] as const).map(({ id, label, Icon }) => {
                      const active = activeTab === id;

                      return (
                        <button
                          key={id}
                          className={`relative shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300 sm:px-3 sm:text-[10.5px] ${
                            active
                              ? "bg-white/[0.1] text-white shadow-sm ring-1 ring-white/[0.1]"
                              : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                          }`}
                          onClick={() => setActiveTab(id)}
                          type="button"
                        >
                          <span className="relative z-10 inline-flex items-center gap-1.5 sm:gap-2">
                            <Icon className={`h-3.5 w-3.5 ${active ? "text-zinc-200" : "text-zinc-500"}`} />
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[10px] font-medium text-zinc-400 transition-all duration-300 hover:bg-white/[0.05] hover:text-zinc-200 sm:text-[10.5px]"
                    onClick={handleReset}
                    type="button"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>

                {execTimeMs !== null ? <span className="text-[11px] text-zinc-600" style={{ fontFamily: editorFontStack }}>{execTimeMs}ms</span> : null}
              </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[#060609]">
              {activeTab === "output" ? (
                renderOutput()
              ) : activeTab === "errors" ? (
                hasErrors ? (
                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2 font-sans tracking-tight">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-[11px] font-semibold text-red-300">Stderr</span>
                    </div>
                    <pre
                      className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-4 text-[11px] leading-6 text-red-200 shadow-inner [overflow-wrap:anywhere]"
                      style={{ fontFamily: editorFontStack }}
                    >
                      {errorStr}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center font-sans tracking-tight">
                    <motion.div
                      animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.05, 1] }}
                      transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]"
                    >
                      <AlertTriangle className="h-6 w-6 text-zinc-500" />
                    </motion.div>
                    <p className="text-[13px] font-semibold text-zinc-300">No errors</p>
                    <p className="mt-2 max-w-[260px] text-xs leading-6 text-zinc-500">
                      Compiler errors, runtime exceptions, and stderr will appear here when something breaks.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4 font-sans tracking-tight">
                    <div className="h-2 w-2 rounded-full bg-cyan-400/80"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Standard Input</span>
                  </div>
                  <textarea
                    className="min-h-0 flex-1 resize-none bg-transparent px-4 py-4 text-[12px] leading-6 text-[#00ffa3] outline-none placeholder:text-zinc-700"
                    style={{ fontFamily: editorFontStack }}
                    onChange={(event) => setInputStr(event.target.value)}
                    placeholder={stdinHint}
                    value={inputStr}
                  />
                </div>
              )}
            </div>
            </PanelShell>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
