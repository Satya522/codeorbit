"use client";

import type { EditorProps } from "@monaco-editor/react";
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
import {
  buildPlaygroundModelPath,
  configurePlaygroundMonaco,
  syncPlaygroundMonacoWorkspace,
  type MonacoInstance,
  type PlaygroundMonacoWorkspaceFile,
} from "@/lib/playgroundMonaco";
import {
  buildRuntimeDependencyWorkspaceFiles,
  detectRuntimeImports,
  inferManagedDependencyName,
  isRemoteDependencyLanguage,
  mergeManagedDependenciesWithDetectedImports,
  normalizeManagedDependencySpecifier,
  type DetectedRuntimeImport,
  type ManagedRuntimeDependency,
  type RemoteDependencyLanguage,
} from "@/lib/playgroundDependencies";
import {
  getWebCorePresetDefinitions,
  getWebCoreSuggestedPackages,
  type WebCorePresetId,
  type WebCorePresetPackage,
} from "@/lib/webcorePresets";
import {
  buildWebCoreModuleImportMap,
  buildDefaultWebCoreMarkup,
  buildDefaultWebCoreScript,
  buildDefaultWebCoreStyles,
  ensureWebCoreBaseLinks,
  inlineLinkedScript,
  inlineLinkedStylesheet,
  isWebCoreModuleScriptKind,
  renameLinkedScript,
  renameLinkedStylesheet,
  resolveWebCoreCssPackageImports,
  removeLinkedScript,
  removeLinkedStylesheet,
  shouldUseTailwindBrowserRuntime,
  shouldUseWebCoreModulePipeline,
  type WebCoreScriptKind,
} from "@/lib/webcoreWorkspace";
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
type HtmlWorkspaceCustomKind = "html" | "css" | WebCoreScriptKind;

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

type RuntimeDependencyState = Record<RemoteDependencyLanguage, ManagedRuntimeDependency[]>;

type CachedRemoteExecutionResult = {
  error: string;
  output: string;
};

type MonacoEditorInstance = Parameters<NonNullable<EditorProps["onMount"]>>[0];

const remoteExecutionLanguages: LanguageId[] = ["java", "python", "cpp", "javascript", "go"];

const languageOptions: LanguageOption[] = [
  {
    id: "java",
    label: "Java",
    icon: "☕",
    iconPath: "/icons/languages/java.png",
    monaco: "java",
    filename: "Main.java",
    description: "Secure remote JDK runner for DSA, stdin/stdout, and algorithm-focused practice.",
    runtime: "Secure JDK 17",
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
    description: "Secure remote Python runner for scripts, problem solving, and clean stdin/stdout loops.",
    runtime: "Secure Python",
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
    description: "Secure Node-style runner for scripts and backend logic. Browser packages and UI code belong in WebCore.",
    runtime: "Secure Node",
    accentRgb: "251,191,36",
    engineLanguage: "javascript",
    starter: `console.log("Hello CodeOrbit")`,
  },
  {
    id: "cpp",
    label: "C++",
    icon: "C++",
    iconPath: "/icons/languages/cpp.svg",
    monaco: "cpp",
    filename: "main.cpp",
    description: "Secure C++ compile-run focused on DSA speed, stdin, and tight algorithm loops.",
    runtime: "Secure G++",
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
    iconPath: "/icons/languages/go.svg",
    monaco: "go",
    filename: "main.go",
    description: "Secure Go runner for problem solving, stdin/stdout, and clean systems-style scripts.",
    runtime: "Secure Go",
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
    description: "Frontend-first browser workspace for React, Three.js, charts, Supabase, and import-heavy UI work.",
    runtime: "Frontend Workspace",
    accentRgb: "56,189,248",
    starter: buildDefaultWebCoreMarkup({
      markup: "index.html",
      script: "script.js",
      styles: "style.css",
    }),
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
const runtimeDependencyStorageKey = "codeorbit:playground:runtime-dependencies";
const playgroundEditorFontStorageKey = "codeorbit:playground:editor-font";
const MAX_LOCAL_EXECUTION_CACHE_ENTRIES = 20;
const prewarmableExecutionLanguages: LanguageId[] = ["java", "python", "cpp"];
const webCorePresetDefinitions = getWebCorePresetDefinitions();
const webCoreSuggestedPackages = getWebCoreSuggestedPackages();
const defaultWebCoreFileNames = {
  markup: "index.html",
  script: "script.js",
  styles: "style.css",
} as const;

function buildRemoteExecutionCacheKey(
  language: LanguageId,
  code: string,
  stdin: string,
  dependencies: ManagedRuntimeDependency[] = [],
) {
  return `${language}\u0000${stdin}\u0000${dependencies.map((dependency) => dependency.specifier).join("\u0001")}\u0000${code}`;
}

function rememberCachedRemoteExecution(
  cache: Map<string, CachedRemoteExecutionResult>,
  cacheKey: string,
  result: CachedRemoteExecutionResult,
) {
  cache.delete(cacheKey);
  cache.set(cacheKey, result);

  while (cache.size > MAX_LOCAL_EXECUTION_CACHE_ENTRIES) {
    const oldestCacheKey = cache.keys().next().value;

    if (!oldestCacheKey) {
      break;
    }

    cache.delete(oldestCacheKey);
  }
}
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
    filename: defaultWebCoreFileNames.markup,
    label: "HTML",
    monaco: "html",
    starter: buildDefaultWebCoreMarkup(defaultWebCoreFileNames),
  },
  styles: {
    filename: defaultWebCoreFileNames.styles,
    label: "CSS",
    monaco: "css",
    starter: buildDefaultWebCoreStyles(),
  },
  script: {
    filename: defaultWebCoreFileNames.script,
    label: "JS",
    monaco: "javascript",
    starter: buildDefaultWebCoreScript(),
  },
} as const;

function clearStoredPlaygroundState() {
  window.localStorage.removeItem(playgroundCodesStorageKey);
  window.localStorage.removeItem(playgroundLanguageStorageKey);
  window.localStorage.removeItem(htmlWorkspaceStorageKey);
  window.localStorage.removeItem(runtimeDependencyStorageKey);
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

function buildRuntimeDependencyId() {
  return `runtime-dependency-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultRuntimeDependencyMap() {
  return {
    cpp: [] as ManagedRuntimeDependency[],
    go: [] as ManagedRuntimeDependency[],
    java: [] as ManagedRuntimeDependency[],
    javascript: [] as ManagedRuntimeDependency[],
    python: [] as ManagedRuntimeDependency[],
  } satisfies RuntimeDependencyState;
}

function buildStoredRuntimeDependencies(raw: unknown): RuntimeDependencyState {
  const defaults = buildDefaultRuntimeDependencyMap();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const record = raw as Record<string, unknown>;

  for (const language of Object.keys(defaults) as RemoteDependencyLanguage[]) {
    const rawEntries = Array.isArray(record[language]) ? record[language] : [];

    defaults[language] = rawEntries.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const dependencyRecord = entry as Record<string, unknown>;
      const specifier =
        typeof dependencyRecord.specifier === "string"
          ? normalizeManagedDependencySpecifier(language, dependencyRecord.specifier)
          : "";
      const name =
        typeof dependencyRecord.name === "string" && dependencyRecord.name.trim().length > 0
          ? dependencyRecord.name.trim()
          : inferManagedDependencyName(language, specifier);

      if (!specifier || !name) {
        return [];
      }

      return [
        {
          id:
            typeof dependencyRecord.id === "string" && dependencyRecord.id.trim().length > 0
              ? dependencyRecord.id
              : buildRuntimeDependencyId(),
          name,
          specifier,
        } satisfies ManagedRuntimeDependency,
      ];
    });
  }

  return defaults;
}

function canManuallyManageRuntimeDependencies(language: RemoteDependencyLanguage) {
  return language !== "cpp";
}

function getRuntimeDependencyPrompt(language: RemoteDependencyLanguage) {
  switch (language) {
    case "javascript":
      return "Add npm package (examples: axios, zod, react@19.2.0)";
    case "python":
      return "Add Python package (examples: requests, numpy==2.2.5, Pillow)";
    case "java":
      return "Add Maven dependency (example: com.google.code.gson:gson:2.11.0)";
    case "go":
      return "Add Go module (example: github.com/gin-gonic/gin)";
    case "cpp":
      return "C++ external libraries come from the sandbox image, so manual package install is not available here.";
  }
}

function getRuntimeDependencyHint(language: RemoteDependencyLanguage) {
  switch (language) {
    case "javascript":
      return "Detected imports can auto-link npm packages for runs and IntelliSense.";
    case "python":
      return "Standard library imports stay local; third-party modules can be tracked here explicitly.";
    case "java":
      return "Common JDK imports are already handled. External libraries need Maven coordinates.";
    case "go":
      return "Go standard packages stay builtin; external modules can be linked from imports.";
    case "cpp":
      return "Includes are tracked for clarity, but native libraries still belong in the sandbox image itself.";
  }
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
  return value === "html" || value === "css" || isWebCoreModuleScriptKind(value);
}

function getHtmlWorkspaceScriptKindFromFileName(fileName: string): WebCoreScriptKind {
  const inferredKind = inferHtmlWorkspaceCustomKind(fileName, "javascript");
  return isWebCoreModuleScriptKind(inferredKind) ? inferredKind : "javascript";
}

function getHtmlWorkspaceKindFromBaseFileId(
  fileId: HtmlWorkspaceFileId,
  fileNames: Record<HtmlWorkspaceFileId, string>,
): HtmlWorkspaceCustomKind {
  if (fileId === "markup") {
    return "html";
  }

  if (fileId === "styles") {
    return "css";
  }

  return getHtmlWorkspaceScriptKindFromFileName(fileNames.script);
}

function getHtmlWorkspaceFileExtension(kind: HtmlWorkspaceCustomKind) {
  switch (kind) {
    case "html":
      return "html";
    case "css":
      return "css";
    case "jsx":
      return "jsx";
    case "typescript":
      return "ts";
    case "tsx":
      return "tsx";
    default:
      return "js";
  }
}

function getHtmlWorkspaceMonacoLanguage(kind: HtmlWorkspaceCustomKind) {
  switch (kind) {
    case "html":
      return "html";
    case "css":
      return "css";
    case "typescript":
    case "tsx":
      return "typescript";
    default:
      return "javascript";
  }
}

function inferHtmlWorkspaceCustomKind(fileName: string, fallback: HtmlWorkspaceCustomKind): HtmlWorkspaceCustomKind {
  const normalizedName = fileName.trim().toLowerCase();

  if (normalizedName.endsWith(".html") || normalizedName.endsWith(".htm")) {
    return "html";
  }

  if (normalizedName.endsWith(".css")) {
    return "css";
  }

  if (normalizedName.endsWith(".tsx")) {
    return "tsx";
  }

  if (normalizedName.endsWith(".ts")) {
    return "typescript";
  }

  if (normalizedName.endsWith(".jsx")) {
    return "jsx";
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

  if (kind === "jsx") {
    return `export function PromoCard() {
  return <section className="custom-block">JSX file ready.</section>;
}`;
  }

  if (kind === "typescript") {
    return `export function formatLabel(label: string) {
  return \`\${label} ready\`;
}

console.log(formatLabel("TypeScript file"));`;
  }

  if (kind === "tsx") {
    return `type PromoCardProps = {
  title: string;
};

export function PromoCard({ title }: PromoCardProps) {
  return <section className="custom-block">{title}</section>;
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

function buildHtmlWorkspacePackageRecord(pkg: WebCorePresetPackage): HtmlWorkspacePackage {
  return {
    id: buildHtmlWorkspacePackageId(),
    name: pkg.name,
    specifier: normalizeHtmlWorkspacePackageSpecifier(pkg.specifier),
  };
}

function buildDefaultHtmlWorkspaceFromPreset(presetId: WebCorePresetId): HtmlWorkspaceState {
  const preset = getWebCorePresetDefinitions().find((entry) => entry.id === presetId) ?? getWebCorePresetDefinitions()[0];
  const fileNames = {
    markup: htmlWorkspaceFiles.markup.filename,
    script: htmlWorkspaceFiles.script.filename,
    styles: htmlWorkspaceFiles.styles.filename,
  };

  return {
    activeFile: "script",
    enabled: {
      script: true,
      styles: true,
    },
    fileNames: {
      markup: fileNames.markup,
      script: fileNames.script,
      styles: fileNames.styles,
    },
    files: {
      markup: ensureWebCoreBaseLinks(preset.markup, fileNames, { script: true, styles: true }),
      script: preset.script,
      styles: preset.styles,
    },
    customFiles: [],
    packages: preset.packages.map(buildHtmlWorkspacePackageRecord),
  };
}

function buildDefaultHtmlWorkspace(markupSource?: string, enableExtraFiles = true): HtmlWorkspaceState {
  const fileNames = {
    markup: htmlWorkspaceFiles.markup.filename,
    script: htmlWorkspaceFiles.script.filename,
    styles: htmlWorkspaceFiles.styles.filename,
  };

  return {
    activeFile: "markup",
    enabled: {
      script: enableExtraFiles,
      styles: enableExtraFiles,
    },
    fileNames: {
      markup: fileNames.markup,
      script: fileNames.script,
      styles: fileNames.styles,
    },
    files: {
      markup: ensureWebCoreBaseLinks(markupSource ?? htmlWorkspaceFiles.markup.starter, fileNames, {
        script: enableExtraFiles,
        styles: enableExtraFiles,
      }),
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

  nextState.files.markup = ensureWebCoreBaseLinks(nextState.files.markup, nextState.fileNames, nextState.enabled);

  return nextState;
}

function normalizeHtmlWorkspaceFileName(fileId: HtmlWorkspaceFileId, value: string) {
  const expectedName = htmlWorkspaceFiles[fileId].filename;
  const sanitizedValue = value.trim().replace(/[\\/:*?"<>|]+/g, "-");

  if (!sanitizedValue) {
    return expectedName;
  }

  if (fileId === "script") {
    return /\.(?:js|jsx|ts|tsx|mjs|cjs)$/i.test(sanitizedValue) ? sanitizedValue : `${sanitizedValue}.js`;
  }

  const extension = expectedName.split(".").pop() ?? "";
  return sanitizedValue.toLowerCase().endsWith(`.${extension}`) ? sanitizedValue : `${sanitizedValue}.${extension}`;
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
  const baseScriptKind = getHtmlWorkspaceScriptKindFromFileName(workspace.fileNames.script);
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
          kind: baseScriptKind,
        }
      : null,
    ...workspace.customFiles
      .filter((file) => isWebCoreModuleScriptKind(file.kind) && file.includeInPreview)
      .map((file) => ({
        name: file.name,
        content: file.content.trim(),
        kind: file.kind,
      })),
  ].filter((block): block is { name: string; content: string; kind: WebCoreScriptKind } => Boolean(block?.content));

  const htmlBlocks = workspace.customFiles
    .filter((file) => file.kind === "html" && file.includeInPreview)
    .map((file) => ({
      name: file.name,
      content: file.content.trim(),
    }))
    .filter((block) => block.content);
  const browserModulePackages = workspace.packages.filter(
    (pkg) => pkg.name !== "tailwindcss" && pkg.name !== "@tailwindcss/browser",
  );
  const usesTailwindBrowserRuntime = cssBlocks.some((block) =>
    shouldUseTailwindBrowserRuntime(block.content, workspace.packages),
  );
  const usesModulePipeline = shouldUseWebCoreModulePipeline(
    scriptBlocks.map((block) => ({ content: block.content, kind: block.kind })),
    browserModulePackages,
  );
  const packageImports = browserModulePackages.reduce<Record<string, string>>((acc, pkg) => {
    acc[pkg.name] = `https://esm.sh/${pkg.specifier}?bundle`;
    acc[`${pkg.name}/`] = `https://esm.sh/${pkg.specifier}/`;
    return acc;
  }, {});
  const moduleImportMap = usesModulePipeline
    ? buildWebCoreModuleImportMap(
        scriptBlocks.map((block) => ({
          content: block.content,
          entry: true,
          kind: block.kind,
          name: block.name,
        })),
      )
    : null;
  const combinedImports = {
    ...packageImports,
    ...(moduleImportMap?.imports ?? {}),
  };

  markup = ensureWebCoreBaseLinks(markup, workspace.fileNames, workspace.enabled);

  if (!workspace.enabled.styles) {
    markup = removeLinkedStylesheet(markup, workspace.fileNames.styles);
  }

  if (!workspace.enabled.script) {
    markup = removeLinkedScript(markup, workspace.fileNames.script);
  }

  for (const file of workspace.customFiles) {
    if (file.includeInPreview) {
      continue;
    }

    if (file.kind === "css") {
      markup = removeLinkedStylesheet(markup, file.name);
    }

    if (isWebCoreModuleScriptKind(file.kind)) {
      markup = removeLinkedScript(markup, file.name);
    }
  }

  const headBlocks: string[] = [];

  if (browserModulePackages.length > 0) {
    headBlocks.push(
      browserModulePackages
        .map((pkg) => `<link rel="modulepreload" href="https://esm.sh/${pkg.specifier}?bundle" />`)
        .join("\n"),
    );
  }

  if (Object.keys(combinedImports).length > 0) {
    headBlocks.push(
      `<script type="importmap" data-codeorbit-importmap>\n${JSON.stringify({ imports: combinedImports }, null, 2)}\n</script>`,
    );
  }

  if (usesTailwindBrowserRuntime) {
    headBlocks.push(
      '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" data-codeorbit-tailwind></script>',
    );
  }

  if (headBlocks.length > 0) {
    markup = injectIntoHead(markup, headBlocks.filter(Boolean).join("\n"));
  }

  for (const block of cssBlocks) {
    const resolvedCssContent = resolveWebCoreCssPackageImports(block.content, workspace.packages);
    const styleAttributes = shouldUseTailwindBrowserRuntime(resolvedCssContent, workspace.packages)
      ? ' type="text/tailwindcss"'
      : "";
    const replacement = inlineLinkedStylesheet(markup, block.name, resolvedCssContent, styleAttributes);

    markup = replacement.replaced
      ? replacement.markup
      : injectIntoHead(
          markup,
          `<style${styleAttributes} data-codeorbit-file="${block.name}">\n${resolvedCssContent}\n</style>`,
        );
  }

  for (const block of htmlBlocks) {
    markup = injectIntoBody(markup, `<!-- ${block.name} -->\n${block.content}`);
  }

  for (const [index, block] of scriptBlocks.entries()) {
    const entrySpecifier = moduleImportMap?.entrySpecifiers[index];
    const inlineContent = usesModulePipeline && entrySpecifier ? `import "${entrySpecifier}";` : block.content;
    const replacement = inlineLinkedScript(markup, block.name, inlineContent, usesModulePipeline);

    markup = replacement.replaced
      ? replacement.markup
      : injectIntoBody(
          markup,
          `<script${usesModulePipeline ? ` type="module"` : ""} data-codeorbit-file="${block.name}">\n${inlineContent}\n</script>`,
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
  const [isRuntimeDependenciesOpen, setIsRuntimeDependenciesOpen] = useState(false);
  const [webCoreActionsPosition, setWebCoreActionsPosition] = useState<{ top: number; left: number } | null>(null);
  const [runtimeDependenciesPosition, setRuntimeDependenciesPosition] = useState<{ top: number; left: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [codes, setCodes] = useState<Record<LanguageId, string>>(buildDefaultCodeMap);
  const [htmlWorkspace, setHtmlWorkspace] = useState<HtmlWorkspaceState>(buildDefaultHtmlWorkspace());
  const [runtimeDependencies, setRuntimeDependencies] = useState<RuntimeDependencyState>(buildDefaultRuntimeDependencyMap());
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
  const runtimeDependenciesButtonRef = useRef<HTMLButtonElement | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const localExecutionCacheRef = useRef<Map<string, CachedRemoteExecutionResult>>(new Map());
  const prewarmedExecutionLanguagesRef = useRef<Set<LanguageId>>(new Set());

  const lang = languageOptions.find((option) => option.id === activeLang) ?? languageOptions[0];
  const selectedEditorFont =
    sandboxFontOptions.find((option) => option.id === editorFont) ?? sandboxFontOptions[0];
  const editorFontStack = selectedEditorFont.stack;
  const activeRuntimeLanguage = isRemoteDependencyLanguage(activeLang) ? activeLang : null;
  const currentRemoteCode = remoteExecutionLanguages.includes(activeLang) ? codes[activeLang] : "";
  const activeRuntimeDependencies = activeRuntimeLanguage ? runtimeDependencies[activeRuntimeLanguage] : [];
  const detectedRuntimeImports =
    remoteExecutionLanguages.includes(activeLang) && activeRuntimeLanguage
      ? detectRuntimeImports(activeRuntimeLanguage, currentRemoteCode)
      : [];
  const syncedRuntimeDependencies =
    remoteExecutionLanguages.includes(activeLang) && activeRuntimeLanguage
      ? mergeManagedDependenciesWithDetectedImports(activeRuntimeLanguage, activeRuntimeDependencies, currentRemoteCode)
      : activeRuntimeDependencies;
  const linkedRuntimeDependencySpecifiers = new Set(
    syncedRuntimeDependencies.map((dependency) =>
      activeRuntimeLanguage
        ? normalizeManagedDependencySpecifier(activeRuntimeLanguage, dependency.specifier)
        : dependency.specifier,
    ),
  );
  const pendingDetectedRuntimeImports = detectedRuntimeImports.filter(
    (detectedImport) =>
      detectedImport.canAutoAdd &&
      activeRuntimeLanguage &&
      !linkedRuntimeDependencySpecifiers.has(
        normalizeManagedDependencySpecifier(activeRuntimeLanguage, detectedImport.packageName),
      ),
  );

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
        setRuntimeDependencies(buildDefaultRuntimeDependencyMap());
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
      const storedRuntimeDependencies = window.localStorage.getItem(runtimeDependencyStorageKey);

      if (storedHtmlWorkspace) {
        setHtmlWorkspace(buildStoredHtmlWorkspace(JSON.parse(storedHtmlWorkspace), restoredHtmlMarkup));
      } else if (restoredHtmlMarkup) {
        setHtmlWorkspace(buildDefaultHtmlWorkspace(restoredHtmlMarkup, false));
      }

      if (storedRuntimeDependencies) {
        setRuntimeDependencies(buildStoredRuntimeDependencies(JSON.parse(storedRuntimeDependencies)));
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
      window.localStorage.setItem(runtimeDependencyStorageKey, JSON.stringify(runtimeDependencies));
      window.localStorage.setItem(playgroundEditorFontStorageKey, editorFont);
    } catch (error) {
      console.warn("Unable to persist playground state", error);
    }
  }, [activeLang, codes, editorFont, hasRestoredPlaygroundState, htmlWorkspace, isAuthLoaded, isSignedIn, runtimeDependencies]);

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

  const warmExecutionLanguage = useCallback(async (languageId: LanguageId) => {
    if (!prewarmableExecutionLanguages.includes(languageId) || !remoteExecutionLanguages.includes(languageId)) {
      return;
    }

    if (prewarmedExecutionLanguagesRef.current.has(languageId)) {
      return;
    }

    prewarmedExecutionLanguagesRef.current.add(languageId);

    try {
      await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: languageOptions.find((option) => option.id === languageId)?.engineLanguage ?? languageId,
          code: starterTemplates[languageId],
          stdin: "",
          warmup: true,
        }),
      });
    } catch (error) {
      console.warn(`Unable to prewarm the ${languageId} runner.`, error);
      prewarmedExecutionLanguagesRef.current.delete(languageId);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredPlaygroundState || !prewarmableExecutionLanguages.includes(activeLang)) {
      return;
    }

    void warmExecutionLanguage(activeLang);
  }, [activeLang, hasRestoredPlaygroundState, warmExecutionLanguage]);

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
      setIsRuntimeDependenciesOpen(false);
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
      kind: getHtmlWorkspaceKindFromBaseFileId("markup", htmlWorkspace.fileNames),
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
            kind: getHtmlWorkspaceKindFromBaseFileId("styles", htmlWorkspace.fileNames),
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
            monaco: getHtmlWorkspaceMonacoLanguage(getHtmlWorkspaceScriptKindFromFileName(htmlWorkspace.fileNames.script)),
            kind: getHtmlWorkspaceKindFromBaseFileId("script", htmlWorkspace.fileNames),
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
  const editorPath =
    activeLang === "html"
      ? buildPlaygroundModelPath("webcore", editorFilename)
      : buildPlaygroundModelPath(activeLang, editorFilename);

  const syncMonacoWorkspace = useCallback(
    (monaco: MonacoInstance) => {
      const runtimeDependencySupportFiles: PlaygroundMonacoWorkspaceFile[] =
        activeLang !== "html" && activeLang !== "sql" && activeRuntimeLanguage
          ? buildRuntimeDependencyWorkspaceFiles(activeRuntimeLanguage, syncedRuntimeDependencies, buildPlaygroundModelPath)
          : [];
      const workspaceFiles: PlaygroundMonacoWorkspaceFile[] =
        activeLang === "html"
          ? [
              {
                language: "html",
                path: buildPlaygroundModelPath("webcore", htmlWorkspace.fileNames.markup),
                value: htmlWorkspace.files.markup,
              },
              ...(htmlWorkspace.enabled.styles
                ? [
                    {
                      language: "css",
                      path: buildPlaygroundModelPath("webcore", htmlWorkspace.fileNames.styles),
                      value: htmlWorkspace.files.styles,
                    } satisfies PlaygroundMonacoWorkspaceFile,
                  ]
                : []),
              ...(htmlWorkspace.enabled.script
                ? [
                    {
                      language: getHtmlWorkspaceMonacoLanguage(
                        getHtmlWorkspaceScriptKindFromFileName(htmlWorkspace.fileNames.script),
                      ),
                      path: buildPlaygroundModelPath("webcore", htmlWorkspace.fileNames.script),
                      value: htmlWorkspace.files.script,
                    } satisfies PlaygroundMonacoWorkspaceFile,
                  ]
                : []),
              ...htmlWorkspace.customFiles.map((file) => ({
                language: getHtmlWorkspaceMonacoLanguage(file.kind),
                path: buildPlaygroundModelPath("webcore", file.name),
                value: file.content,
              })),
            ]
          : [
              {
                language: lang.monaco,
                path: buildPlaygroundModelPath(activeLang, lang.filename),
                value: codes[activeLang],
              },
              ...runtimeDependencySupportFiles,
            ];

      syncPlaygroundMonacoWorkspace(
        monaco,
        workspaceFiles,
        activeLang === "html"
          ? htmlWorkspace.packages
          : activeLang === "javascript"
            ? syncedRuntimeDependencies
            : [],
      );
    },
    [activeLang, activeRuntimeLanguage, codes, htmlWorkspace, lang.filename, lang.monaco, syncedRuntimeDependencies],
  );

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    syncMonacoWorkspace(monacoRef.current);
  }, [syncMonacoWorkspace]);

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
        files:
          activeFile === "styles"
            ? {
                ...current.files,
                markup: renameLinkedStylesheet(current.files.markup, current.fileNames.styles, uniqueName),
              }
            : activeFile === "script"
              ? {
                  ...current.files,
                  markup: renameLinkedScript(current.files.markup, current.fileNames.script, uniqueName),
                }
              : current.files,
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
    const promptedName = window.prompt("Add extra file (examples: section.html, theme.css, helper.ts, card.tsx)", "");

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
      'Add package (examples: react, react@19, three, tailwindcss@4, @supabase/supabase-js)',
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

  const addSuggestedHtmlWorkspacePackage = useCallback((specifier: string) => {
    const normalizedSpecifier = normalizeHtmlWorkspacePackageSpecifier(specifier);
    const name = getHtmlWorkspacePackageName(normalizedSpecifier);

    if (!normalizedSpecifier || !name) {
      return;
    }

    setHtmlWorkspace((current) => {
      const existingPackage = current.packages.find((pkg) => pkg.name === name);
      const nextPackage: HtmlWorkspacePackage = existingPackage
        ? { ...existingPackage, specifier: normalizedSpecifier }
        : {
            id: buildHtmlWorkspacePackageId(),
            name,
            specifier: normalizedSpecifier,
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

  const applyWebCorePreset = useCallback((presetId: WebCorePresetId) => {
    const preset = webCorePresetDefinitions.find((entry) => entry.id === presetId) ?? webCorePresetDefinitions[0];
    setHtmlWorkspace(buildDefaultHtmlWorkspaceFromPreset(preset.id));
    setOutputStr(`Loaded the ${preset.label} WebCore starter.`);
    setErrorStr("");
    setActiveTab("output");
  }, []);

  const removeHtmlWorkspacePackage = useCallback((packageId: string) => {
    setHtmlWorkspace((current) => ({
      ...current,
      packages: current.packages.filter((pkg) => pkg.id !== packageId),
    }));
  }, []);

  const addRuntimeDependency = useCallback(() => {
    if (!activeRuntimeLanguage) {
      return;
    }

    if (!canManuallyManageRuntimeDependencies(activeRuntimeLanguage)) {
      setOutputStr(getRuntimeDependencyHint(activeRuntimeLanguage));
      setErrorStr("");
      setActiveTab("output");
      return;
    }

    const promptedSpecifier = window.prompt(getRuntimeDependencyPrompt(activeRuntimeLanguage), "");

    if (promptedSpecifier === null) {
      return;
    }

    const specifier = normalizeManagedDependencySpecifier(activeRuntimeLanguage, promptedSpecifier);
    const name = inferManagedDependencyName(activeRuntimeLanguage, specifier);

    if (!specifier || !name) {
      return;
    }

    setRuntimeDependencies((current) => {
      const existingDependency = current[activeRuntimeLanguage].find(
        (dependency) =>
          normalizeManagedDependencySpecifier(activeRuntimeLanguage, dependency.specifier) === specifier,
      );
      const nextDependency: ManagedRuntimeDependency = existingDependency
        ? { ...existingDependency, name, specifier }
        : {
            id: buildRuntimeDependencyId(),
            name,
            specifier,
          };

      return {
        ...current,
        [activeRuntimeLanguage]: existingDependency
          ? current[activeRuntimeLanguage].map((dependency) => (dependency.id === existingDependency.id ? nextDependency : dependency))
          : [...current[activeRuntimeLanguage], nextDependency],
      };
    });
  }, [activeRuntimeLanguage]);

  const linkDetectedRuntimeImport = useCallback(
    (detectedImport: DetectedRuntimeImport) => {
      if (!activeRuntimeLanguage || !detectedImport.canAutoAdd) {
        return;
      }

      const specifier = normalizeManagedDependencySpecifier(activeRuntimeLanguage, detectedImport.packageName);
      const name = inferManagedDependencyName(activeRuntimeLanguage, specifier);

      if (!specifier || !name) {
        return;
      }

      setRuntimeDependencies((current) => {
        const alreadyLinked = current[activeRuntimeLanguage].some(
          (dependency) =>
            normalizeManagedDependencySpecifier(activeRuntimeLanguage, dependency.specifier) === specifier,
        );

        if (alreadyLinked) {
          return current;
        }

        return {
          ...current,
          [activeRuntimeLanguage]: [
            ...current[activeRuntimeLanguage],
            {
              id: buildRuntimeDependencyId(),
              name,
              specifier,
            },
          ],
        };
      });
    },
    [activeRuntimeLanguage],
  );

  const removeRuntimeDependency = useCallback(
    (dependencyId: string) => {
      if (!activeRuntimeLanguage) {
        return;
      }

      setRuntimeDependencies((current) => ({
        ...current,
        [activeRuntimeLanguage]: current[activeRuntimeLanguage].filter((dependency) => dependency.id !== dependencyId),
      }));
    },
    [activeRuntimeLanguage],
  );

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

  const updateRuntimeDependenciesPosition = useCallback(() => {
    if (!runtimeDependenciesButtonRef.current) {
      return;
    }

    const rect = runtimeDependenciesButtonRef.current.getBoundingClientRect();
    const menuWidth = 380;
    const nextLeft = Math.min(Math.max(16, rect.right - menuWidth), window.innerWidth - menuWidth - 16);

    setRuntimeDependenciesPosition({
      top: rect.bottom + 12,
      left: nextLeft,
    });
  }, []);

  const openRuntimeDependencies = useCallback(() => {
    updateRuntimeDependenciesPosition();
    setIsWebCoreActionsOpen(false);
    setIsRuntimeDependenciesOpen(true);
  }, [updateRuntimeDependenciesPosition]);

  const closeRuntimeDependencies = useCallback(() => {
    setIsRuntimeDependenciesOpen(false);
  }, []);

  const toggleRuntimeDependencies = useCallback(() => {
    if (isRuntimeDependenciesOpen) {
      setIsRuntimeDependenciesOpen(false);
      return;
    }

    openRuntimeDependencies();
  }, [isRuntimeDependenciesOpen, openRuntimeDependencies]);

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
    setIsRuntimeDependenciesOpen(false);
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
    if (!isRuntimeDependenciesOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRuntimeDependenciesOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateRuntimeDependenciesPosition();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isRuntimeDependenciesOpen, updateRuntimeDependenciesPosition]);

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
    const src = activeLang === "html" ? buildHtmlPreviewDocument(htmlWorkspace) : codes[activeLang];
    const runtimeDependenciesForRun =
      remoteExecutionLanguages.includes(activeLang) && activeRuntimeLanguage
        ? mergeManagedDependenciesWithDetectedImports(activeRuntimeLanguage, runtimeDependencies[activeRuntimeLanguage], src)
        : [];
    const currentRuntimeDependencySignature =
      remoteExecutionLanguages.includes(activeLang) && activeRuntimeLanguage
        ? runtimeDependencies[activeRuntimeLanguage].map((dependency) => dependency.specifier).join("\u0001")
        : "";
    const nextRuntimeDependencySignature = runtimeDependenciesForRun
      .map((dependency) => dependency.specifier)
      .join("\u0001");
    const remoteExecutionCacheKey = remoteExecutionLanguages.includes(activeLang)
      ? buildRemoteExecutionCacheKey(activeLang, src, inputStr, runtimeDependenciesForRun)
      : null;
    const cachedRemoteExecution = remoteExecutionCacheKey
      ? localExecutionCacheRef.current.get(remoteExecutionCacheKey)
      : null;

    if (
      remoteExecutionLanguages.includes(activeLang) &&
      activeRuntimeLanguage &&
      nextRuntimeDependencySignature !== currentRuntimeDependencySignature
    ) {
      setRuntimeDependencies((current) => ({
        ...current,
        [activeRuntimeLanguage]: runtimeDependenciesForRun,
      }));
    }

    setHasRun(false);
    setActiveTab("output");
    clearRunState();

    if (cachedRemoteExecution) {
      setOutputStr(cachedRemoteExecution.output);
      setErrorStr(cachedRemoteExecution.error);

      if (cachedRemoteExecution.error && cachedRemoteExecution.output === "Execution complete with no output.") {
        setActiveTab("errors");
      }

      setHasRun(true);
      setExecTimeMs(0);
      return;
    }

    setIsRunning(true);
    setOutputStr("Running...");
    runStartRef.current = performance.now();

    try {
      if (remoteExecutionLanguages.includes(activeLang)) {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dependencies: runtimeDependenciesForRun.map((dependency) => dependency.specifier),
            language: lang.engineLanguage ?? activeLang,
            mainFile: lang.filename,
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
          const nextOutput = result.output || "Execution complete with no output.";
          const nextError = result.error ?? "";

          setOutputStr(nextOutput);

          if (nextError) {
            setErrorStr(nextError);
            if (!result.output) {
              setActiveTab("errors");
            }
          }

          if (remoteExecutionCacheKey) {
            rememberCachedRemoteExecution(localExecutionCacheRef.current, remoteExecutionCacheKey, {
              error: nextError,
              output: nextOutput,
            });
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
        <div className="h-full bg-[#05070c] p-4">
          <div className="mb-4 flex items-center justify-between font-sans tracking-tight">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300">Output</span>
            </div>
            {execTimeMs !== null ? (
              <span className="text-[10px] text-zinc-400" style={{ fontFamily: editorFontStack }}>
                {execTimeMs}ms
              </span>
            ) : null}
          </div>
          <pre 
            className="h-[calc(100%-2.25rem)] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-[12px] font-medium leading-7 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [overflow-wrap:anywhere]"
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
      {remoteExecutionLanguages.includes(activeLang) &&
      activeRuntimeLanguage &&
      isRuntimeDependenciesOpen &&
      runtimeDependenciesPosition ? (
        <div className="fixed inset-0 z-40 bg-[#020202]/84 backdrop-blur-[3px]" onClick={closeRuntimeDependencies}>
          <div
            className="absolute flex w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#09090d]/97 shadow-[0_30px_120px_rgba(0,0,0,0.58)]"
            onClick={(event) => event.stopPropagation()}
            style={{
              left: `${runtimeDependenciesPosition.left}px`,
              maxHeight: `calc(100vh - ${Math.max(24, runtimeDependenciesPosition.top + 24)}px)`,
              top: `${runtimeDependenciesPosition.top}px`,
            }}
          >
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Imports</p>
                  <p className="mt-1 text-[13px] font-semibold text-white">{lang.label} setup</p>
                  <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-zinc-400">{getRuntimeDependencyHint(activeRuntimeLanguage)}</p>
                </div>
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-300 hover:border-white/20 hover:text-white"
                  onClick={closeRuntimeDependencies}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-5 pr-1">
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Managed dependencies</p>
                    {canManuallyManageRuntimeDependencies(activeRuntimeLanguage) ? (
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 transition-all duration-300 hover:border-emerald-300/25 hover:bg-emerald-400/10"
                        onClick={addRuntimeDependency}
                        type="button"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    ) : null}
                  </div>

                  {syncedRuntimeDependencies.length > 0 ? (
                    <div className="space-y-1">
                      {syncedRuntimeDependencies.map((dependency) => (
                        <div
                          key={dependency.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-white">{dependency.name}</p>
                            <p className="truncate text-[10px] text-zinc-500">{dependency.specifier}</p>
                          </div>
                          <button
                            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 transition-colors duration-300 hover:text-rose-200"
                            onClick={() => removeRuntimeDependency(dependency.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] leading-relaxed text-zinc-500">
                      No managed dependencies yet. CodeOrbit can auto-link many imports on the next run, and you can pin package names here when you want more control.
                    </div>
                  )}
                </section>

                <section className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Detected imports</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                      {detectedRuntimeImports.length} found
                    </span>
                  </div>

                  {detectedRuntimeImports.length > 0 ? (
                    <div className="space-y-1">
                      {detectedRuntimeImports.map((detectedImport) => {
                        const isLinked = linkedRuntimeDependencySpecifiers.has(
                          normalizeManagedDependencySpecifier(activeRuntimeLanguage, detectedImport.packageName),
                        );

                        return (
                          <div
                            key={`${detectedImport.kind}:${detectedImport.specifier}`}
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all duration-300 hover:bg-white/[0.04]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-white">{detectedImport.label}</p>
                              <p className="truncate text-[10px] text-zinc-500">{detectedImport.detail}</p>
                            </div>
                            {detectedImport.canAutoAdd ? (
                              isLinked ? (
                                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                                  Linked
                                </span>
                              ) : (
                                <button
                                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 transition-colors duration-300 hover:border-emerald-300/25 hover:text-emerald-100"
                                  onClick={() => linkDetectedRuntimeImport(detectedImport)}
                                  type="button"
                                >
                                  Add
                                </button>
                              )
                            ) : (
                              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                {detectedImport.kind}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] leading-relaxed text-zinc-500">
                      Start typing imports in the editor and they will show up here for quicker linking and cleaner runs.
                    </div>
                  )}
                </section>

                {pendingDetectedRuntimeImports.length > 0 ? (
                  <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-3 text-[11px] leading-relaxed text-cyan-100">
                    {pendingDetectedRuntimeImports.length} external import{pendingDetectedRuntimeImports.length === 1 ? "" : "s"} can be auto-linked on the next run.
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Starter packs</p>
                  </div>

                  <div className="grid gap-2">
                    {webCorePresetDefinitions.map((preset) => (
                      <button
                        key={preset.id}
                        className="w-full rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3 text-left transition-all duration-300 hover:border-cyan-300/20 hover:bg-cyan-400/[0.06]"
                        onClick={() => runWebCoreAction(() => applyWebCorePreset(preset.id))}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-white">{preset.label}</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{preset.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                            Load
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

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
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      JavaScript imports use browser packages directly. CSS package imports also work here with syntax like{" "}
                      <span className="font-semibold text-cyan-200">@import "bootstrap";</span> or{" "}
                      <span className="font-semibold text-cyan-200">@import "tailwindcss";</span>.
                    </p>
                  </div>

                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-white transition-all duration-300 hover:bg-white/[0.05]"
                    onClick={() => runWebCoreAction(addHtmlWorkspacePackage)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5 text-zinc-400" />
                    Add package
                  </button>

                  <div className="grid gap-2">
                    {webCoreSuggestedPackages.map((pkg) => (
                      <button
                        key={pkg.specifier}
                        className="w-full rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 text-left transition-all duration-300 hover:border-cyan-300/20 hover:bg-cyan-400/[0.06]"
                        onClick={() => runWebCoreAction(() => addSuggestedHtmlWorkspacePackage(pkg.specifier))}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-white">{pkg.label}</p>
                            <p className="mt-1 truncate text-[10px] text-zinc-500">{pkg.description}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                            Quick add
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

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

            {remoteExecutionLanguages.includes(activeLang) && activeRuntimeLanguage ? (
              <button
                ref={runtimeDependenciesButtonRef}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-[10px] font-semibold text-emerald-100 transition-all duration-300 hover:border-emerald-300/25 hover:bg-emerald-400/10"
                onClick={toggleRuntimeDependencies}
                type="button"
              >
                Imports & Setup
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${isRuntimeDependenciesOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}

            {activeLang === "html" ? (
              <button
                ref={webCoreActionsButtonRef}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-[10px] font-semibold text-cyan-100 transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-400/10"
                onClick={toggleWebCoreActions}
                type="button"
              >
                Frontend Workspace
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${isWebCoreActionsOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </div>

          {activeLang === "javascript" ? (
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 2xl:flex">
              <span className="text-[11px] font-medium text-cyan-200">
                JavaScript runs in Node. Imports & Setup manages server-side packages, and WebCore still handles DOM code plus browser packages.
              </span>
            </div>
          ) : null}

          {activeLang === "html" ? (
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 2xl:flex">
              <span className="text-[11px] font-medium text-emerald-100">
                WebCore is your frontend workspace for React, Three.js, charts, Supabase, and import-heavy browser projects.
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
                  beforeMount={(monaco) => {
                    monacoRef.current = monaco;
                    configurePlaygroundMonaco(monaco);
                    syncMonacoWorkspace(monaco);
                  }}
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
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    syncMonacoWorkspace(monaco);
                  }}
                  options={{
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: "smart",
                    automaticLayout: true,
                    autoClosingBrackets: "languageDefined",
                    autoClosingQuotes: "languageDefined",
                    autoIndent: "full",
                    bracketPairColorization: { enabled: false },
                    fontFamily: editorFontStack,
                    fontLigatures: true,
                    fontSize: playgroundEditorFontSize,
                    formatOnPaste: true,
                    formatOnType: true,
                    hideCursorInOverviewRuler: true,
                    inlineSuggest: { enabled: true },
                    lineHeight: 1.6,
                    linkedEditing: true,
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    padding: { top: 20, bottom: 20 },
                    parameterHints: { enabled: true },
                    quickSuggestions: { comments: true, other: true, strings: true },
                    quickSuggestionsDelay: 0,
                    renderLineHighlight: "none",
                    scrollBeyondLastLine: false,
                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                    snippetSuggestions: "top",
                    suggestOnTriggerCharacters: true,
                    suggestSelection: "recentlyUsedByPrefix",
                    tabCompletion: "on",
                    wordBasedSuggestions: "allDocuments",
                    wordWrap: "on",
                    suggest: {
                      showClasses: true,
                      showFunctions: true,
                      showKeywords: true,
                      showSnippets: true,
                      showVariables: true,
                      showWords: true,
                    },
                  }}
                  path={editorPath}
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
