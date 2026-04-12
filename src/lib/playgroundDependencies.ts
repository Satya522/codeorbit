export type RemoteDependencyLanguage = "cpp" | "go" | "java" | "javascript" | "python";

export type ManagedRuntimeDependency = {
  id: string;
  name: string;
  specifier: string;
};

export type DetectedRuntimeImport = {
  canAutoAdd: boolean;
  detail: string;
  kind: "builtin" | "external" | "relative";
  label: string;
  packageName: string;
  specifier: string;
};

export type RuntimeDependencyWorkspaceFile = {
  language: string;
  path: string;
  value: string;
};

const nodeBuiltinModules = new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

const pythonStdlibModules = new Set([
  "abc",
  "argparse",
  "array",
  "asyncio",
  "base64",
  "bisect",
  "collections",
  "csv",
  "datetime",
  "decimal",
  "enum",
  "functools",
  "gc",
  "glob",
  "hashlib",
  "heapq",
  "hmac",
  "html",
  "http",
  "inspect",
  "io",
  "itertools",
  "json",
  "logging",
  "math",
  "operator",
  "os",
  "pathlib",
  "queue",
  "random",
  "re",
  "select",
  "shlex",
  "shutil",
  "signal",
  "socket",
  "sqlite3",
  "statistics",
  "string",
  "struct",
  "subprocess",
  "sys",
  "tempfile",
  "textwrap",
  "threading",
  "time",
  "typing",
  "unittest",
  "urllib",
  "uuid",
  "xml",
  "zipfile",
]);

const pythonImportToPackageMap: Record<string, string> = {
  bs4: "beautifulsoup4",
  cv2: "opencv-python",
  PIL: "Pillow",
  sklearn: "scikit-learn",
  yaml: "PyYAML",
};

const cppStdHeaders = new Set([
  "algorithm",
  "array",
  "bitset",
  "chrono",
  "cmath",
  "deque",
  "fstream",
  "functional",
  "iomanip",
  "iostream",
  "limits",
  "list",
  "map",
  "memory",
  "numeric",
  "optional",
  "queue",
  "set",
  "sstream",
  "stack",
  "stdexcept",
  "string",
  "tuple",
  "unordered_map",
  "unordered_set",
  "utility",
  "variant",
  "vector",
  "bits/stdc++.h",
]);

function uniqueBySpecifier(items: DetectedRuntimeImport[]) {
  const seen = new Set<string>();
  const unique: DetectedRuntimeImport[] = [];

  for (const item of items) {
    const key = `${item.kind}:${item.specifier}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function buildManagedRuntimeDependencyId() {
  return `runtime-dependency-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isRemoteDependencyLanguage(value: string): value is RemoteDependencyLanguage {
  return value === "cpp" || value === "go" || value === "java" || value === "javascript" || value === "python";
}

function normalizeJavascriptSpecifier(value: string) {
  return value.trim().replace(/^npm:/i, "");
}

function getJavascriptPackageName(specifier: string) {
  const trimmed = normalizeJavascriptSpecifier(specifier);

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

  const slashIndex = trimmed.indexOf("/");
  const versionIndex = trimmed.indexOf("@");

  if (slashIndex !== -1 && (versionIndex === -1 || slashIndex < versionIndex)) {
    return trimmed.slice(0, slashIndex);
  }

  return versionIndex === -1 ? trimmed : trimmed.slice(0, versionIndex);
}

function normalizePythonSpecifier(value: string) {
  return value.trim();
}

function getPythonPackageName(specifier: string) {
  const trimmed = normalizePythonSpecifier(specifier);
  const match = trimmed.match(/^[A-Za-z0-9_.-]+(?:\[[A-Za-z0-9_,.-]+\])?/);
  return match ? match[0] : "";
}

function normalizeJavaSpecifier(value: string) {
  return value.trim();
}

function getJavaPackageName(specifier: string) {
  const trimmed = normalizeJavaSpecifier(specifier);
  const segments = trimmed.split(":").filter(Boolean);

  if (segments.length >= 2) {
    return segments[1];
  }

  return trimmed.split(".").filter(Boolean).pop() ?? "";
}

function normalizeGoSpecifier(value: string) {
  return value.trim();
}

function getGoPackageName(specifier: string) {
  const trimmed = normalizeGoSpecifier(specifier);
  return trimmed.split("/").filter(Boolean).pop() ?? trimmed;
}

function normalizeCppSpecifier(value: string) {
  return value.trim();
}

function getCppPackageName(specifier: string) {
  return normalizeCppSpecifier(specifier);
}

export function normalizeManagedDependencySpecifier(language: RemoteDependencyLanguage, value: string) {
  switch (language) {
    case "javascript":
      return normalizeJavascriptSpecifier(value);
    case "python":
      return normalizePythonSpecifier(value);
    case "java":
      return normalizeJavaSpecifier(value);
    case "go":
      return normalizeGoSpecifier(value);
    case "cpp":
      return normalizeCppSpecifier(value);
  }
}

export function inferManagedDependencyName(language: RemoteDependencyLanguage, specifier: string) {
  switch (language) {
    case "javascript":
      return getJavascriptPackageName(specifier);
    case "python":
      return getPythonPackageName(specifier);
    case "java":
      return getJavaPackageName(specifier);
    case "go":
      return getGoPackageName(specifier);
    case "cpp":
      return getCppPackageName(specifier);
  }
}

function classifyJavascriptImport(specifier: string): DetectedRuntimeImport {
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("http://") || specifier.startsWith("https://")) {
    return {
      canAutoAdd: false,
      detail: "Relative or URL import",
      kind: "relative",
      label: specifier,
      packageName: specifier,
      specifier,
    };
  }

  const packageName = getJavascriptPackageName(specifier.replace(/^node:/, ""));

  if (specifier.startsWith("node:") || nodeBuiltinModules.has(packageName)) {
    return {
      canAutoAdd: false,
      detail: "Node builtin module",
      kind: "builtin",
      label: specifier,
      packageName,
      specifier,
    };
  }

  return {
    canAutoAdd: true,
    detail: "npm dependency",
    kind: "external",
    label: specifier,
    packageName,
    specifier,
  };
}

function detectJavascriptImports(code: string) {
  const results: DetectedRuntimeImport[] = [];
  const importPattern =
    /(?:import\s+(?:[^"'`]+\s+from\s+)?|import\s*\(\s*|require\s*\(\s*)["'`]([^"'`]+)["'`]/g;

  for (const match of code.matchAll(importPattern)) {
    const specifier = match[1]?.trim();

    if (!specifier) {
      continue;
    }

    results.push(classifyJavascriptImport(specifier));
  }

  return uniqueBySpecifier(results);
}

function detectPythonImports(code: string) {
  const results: DetectedRuntimeImport[] = [];

  for (const match of code.matchAll(/^\s*import\s+([A-Za-z0-9_., \t]+)/gm)) {
    const segment = match[1] ?? "";
    const imports = segment
      .split(",")
      .map((value) => value.trim().split(/\s+as\s+/i)[0]?.trim())
      .filter(Boolean);

    for (const specifier of imports) {
      const topLevelName = specifier.split(".")[0] ?? specifier;
      const packageName = pythonImportToPackageMap[topLevelName] ?? topLevelName;
      const isBuiltin = pythonStdlibModules.has(topLevelName);

      results.push({
        canAutoAdd: !isBuiltin,
        detail: isBuiltin ? "Python standard library" : "PyPI package",
        kind: isBuiltin ? "builtin" : "external",
        label: specifier,
        packageName,
        specifier,
      });
    }
  }

  for (const match of code.matchAll(/^\s*from\s+([A-Za-z0-9_\.]+)\s+import\s+/gm)) {
    const specifier = match[1]?.trim();

    if (!specifier) {
      continue;
    }

    if (specifier.startsWith(".")) {
      results.push({
        canAutoAdd: false,
        detail: "Relative module",
        kind: "relative",
        label: specifier,
        packageName: specifier,
        specifier,
      });
      continue;
    }

    const topLevelName = specifier.split(".")[0] ?? specifier;
    const packageName = pythonImportToPackageMap[topLevelName] ?? topLevelName;
    const isBuiltin = pythonStdlibModules.has(topLevelName);

    results.push({
      canAutoAdd: !isBuiltin,
      detail: isBuiltin ? "Python standard library" : "PyPI package",
      kind: isBuiltin ? "builtin" : "external",
      label: specifier,
      packageName,
      specifier,
    });
  }

  return uniqueBySpecifier(results);
}

function detectJavaImports(code: string) {
  const results: DetectedRuntimeImport[] = [];

  for (const match of code.matchAll(/^\s*import\s+(?:static\s+)?([A-Za-z0-9_.]+)(?:\.\*)?\s*;/gm)) {
    const specifier = match[1]?.trim();

    if (!specifier) {
      continue;
    }

    const isBuiltin =
      specifier.startsWith("java.") ||
      specifier.startsWith("javax.") ||
      specifier.startsWith("jakarta.") ||
      specifier.startsWith("org.w3c.") ||
      specifier.startsWith("org.xml.");

    results.push({
      canAutoAdd: false,
      detail: isBuiltin ? "JDK package" : "External Java import",
      kind: isBuiltin ? "builtin" : "external",
      label: specifier,
      packageName: specifier,
      specifier,
    });
  }

  return uniqueBySpecifier(results);
}

function detectGoImports(code: string) {
  const results: DetectedRuntimeImport[] = [];

  for (const match of code.matchAll(/^\s*import\s+(?:[A-Za-z_][A-Za-z0-9_]*\s+)?\"([^\"]+)\"/gm)) {
    const specifier = match[1]?.trim();

    if (!specifier) {
      continue;
    }

    const topLevelSegment = specifier.split("/")[0] ?? specifier;
    const isBuiltin = !topLevelSegment.includes(".");

    results.push({
      canAutoAdd: !isBuiltin,
      detail: isBuiltin ? "Go standard library" : "Go module",
      kind: isBuiltin ? "builtin" : "external",
      label: specifier,
      packageName: specifier,
      specifier,
    });
  }

  for (const blockMatch of code.matchAll(/^\s*import\s*\(([\s\S]*?)^\s*\)/gm)) {
    const block = blockMatch[1] ?? "";

    for (const lineMatch of block.matchAll(/^\s*(?:[A-Za-z_][A-Za-z0-9_]*\s+)?\"([^\"]+)\"/gm)) {
      const specifier = lineMatch[1]?.trim();

      if (!specifier) {
        continue;
      }

      const topLevelSegment = specifier.split("/")[0] ?? specifier;
      const isBuiltin = !topLevelSegment.includes(".");

      results.push({
        canAutoAdd: !isBuiltin,
        detail: isBuiltin ? "Go standard library" : "Go module",
        kind: isBuiltin ? "builtin" : "external",
        label: specifier,
        packageName: specifier,
        specifier,
      });
    }
  }

  return uniqueBySpecifier(results);
}

function detectCppImports(code: string) {
  const results: DetectedRuntimeImport[] = [];

  for (const match of code.matchAll(/^\s*#\s*include\s+([<"])([^>"]+)[>"]/gm)) {
    const boundary = match[1];
    const specifier = match[2]?.trim();

    if (!specifier) {
      continue;
    }

    if (boundary === "\"") {
      results.push({
        canAutoAdd: false,
        detail: "Project header",
        kind: "relative",
        label: specifier,
        packageName: specifier,
        specifier,
      });
      continue;
    }

    const isBuiltin = cppStdHeaders.has(specifier) || !specifier.includes("/");

    results.push({
      canAutoAdd: false,
      detail: isBuiltin ? "C++ standard or image-provided header" : "External native header",
      kind: isBuiltin ? "builtin" : "external",
      label: specifier,
      packageName: specifier,
      specifier,
    });
  }

  return uniqueBySpecifier(results);
}

export function detectRuntimeImports(language: RemoteDependencyLanguage, code: string) {
  switch (language) {
    case "javascript":
      return detectJavascriptImports(code);
    case "python":
      return detectPythonImports(code);
    case "java":
      return detectJavaImports(code);
    case "go":
      return detectGoImports(code);
    case "cpp":
      return detectCppImports(code);
  }
}

export function mergeManagedDependenciesWithDetectedImports(
  language: RemoteDependencyLanguage,
  currentDependencies: ManagedRuntimeDependency[],
  code: string,
) {
  const detectedImports = detectRuntimeImports(language, code);
  const merged = [...currentDependencies];
  const existingSpecifiers = new Set(
    currentDependencies.map((dependency) => normalizeManagedDependencySpecifier(language, dependency.specifier)),
  );

  for (const detectedImport of detectedImports) {
    if (!detectedImport.canAutoAdd || !detectedImport.packageName) {
      continue;
    }

    const specifier = normalizeManagedDependencySpecifier(language, detectedImport.packageName);

    if (!specifier || existingSpecifiers.has(specifier)) {
      continue;
    }

    existingSpecifiers.add(specifier);
    merged.push({
      id: buildManagedRuntimeDependencyId(),
      name: inferManagedDependencyName(language, specifier) || specifier,
      specifier,
    });
  }

  return merged;
}

function buildJavascriptPackageJson(dependencies: ManagedRuntimeDependency[]) {
  const manifestDependencies = Object.fromEntries(
    dependencies.map((dependency) => {
      const name = inferManagedDependencyName("javascript", dependency.specifier);

      if (!name) {
        return [dependency.specifier, "latest"];
      }

      if (dependency.specifier === name) {
        return [name, "latest"];
      }

      if (dependency.specifier.startsWith(`${name}@`)) {
        return [name, dependency.specifier.slice(name.length + 1) || "latest"];
      }

      return [name, dependency.specifier];
    }),
  );

  return JSON.stringify(
    {
      name: "codeorbit-playground",
      private: true,
      type: "module",
      dependencies: manifestDependencies,
    },
    null,
    2,
  );
}

function buildJavaPomXml(dependencies: ManagedRuntimeDependency[]) {
  const validDependencies = dependencies.filter((dependency) => dependency.specifier.split(":").length === 3);

  if (validDependencies.length === 0) {
    return null;
  }

  const dependencyXml = validDependencies
    .map((dependency) => {
      const [groupId, artifactId, version] = dependency.specifier.split(":");

      return `    <dependency>
      <groupId>${groupId}</groupId>
      <artifactId>${artifactId}</artifactId>
      <version>${version}</version>
    </dependency>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>codeorbit</groupId>
  <artifactId>playground</artifactId>
  <version>1.0.0</version>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
  </properties>

  <dependencies>
${dependencyXml}
  </dependencies>
</project>`;
}

function buildGoMod(dependencies: ManagedRuntimeDependency[]) {
  if (dependencies.length === 0) {
    return null;
  }

  const requireBlock = dependencies
    .map((dependency) => `\t${dependency.specifier} latest`)
    .join("\n");

  return `module codeorbit-playground

go 1.22

require (
${requireBlock}
)`;
}

export function buildRuntimeDependencyWorkspaceFiles(
  language: RemoteDependencyLanguage,
  dependencies: ManagedRuntimeDependency[],
  buildModelPath: (...segments: string[]) => string,
) {
  if (dependencies.length === 0) {
    return [] satisfies RuntimeDependencyWorkspaceFile[];
  }

  switch (language) {
    case "javascript":
      return [
        {
          language: "json",
          path: buildModelPath(language, "package.json"),
          value: buildJavascriptPackageJson(dependencies),
        },
      ] satisfies RuntimeDependencyWorkspaceFile[];
    case "python":
      return [
        {
          language: "plaintext",
          path: buildModelPath(language, "requirements.txt"),
          value: dependencies.map((dependency) => dependency.specifier).join("\n"),
        },
      ] satisfies RuntimeDependencyWorkspaceFile[];
    case "java": {
      const pomXml = buildJavaPomXml(dependencies);

      return pomXml
        ? [
            {
              language: "xml",
              path: buildModelPath(language, "pom.xml"),
              value: pomXml,
            },
          ]
        : [];
    }
    case "go": {
      const goMod = buildGoMod(dependencies);

      return goMod
        ? [
            {
              language: "plaintext",
              path: buildModelPath(language, "go.mod"),
              value: goMod,
            },
          ]
        : [];
    }
    case "cpp":
      return [];
  }
}
