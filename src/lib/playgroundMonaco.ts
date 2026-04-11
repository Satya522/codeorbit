"use client";

import type { EditorProps } from "@monaco-editor/react";

export type MonacoInstance = Parameters<NonNullable<EditorProps["beforeMount"]>>[0];
type CompletionKind =
  | "class"
  | "constructor"
  | "field"
  | "file"
  | "function"
  | "interface"
  | "keyword"
  | "method"
  | "module"
  | "property"
  | "snippet"
  | "struct"
  | "text"
  | "variable";

type PlaygroundCompletion = {
  detail: string;
  documentation: string;
  insertText: string;
  kind: CompletionKind;
  label: string;
};

export type PlaygroundMonacoWorkspaceFile = {
  language: string;
  path: string;
  value: string;
};

export type PlaygroundMonacoWorkspacePackage = {
  name: string;
  specifier: string;
};

const playgroundWorkspaceRoot = "file:///codeorbit-playground";
const jsConfigPath = `${playgroundWorkspaceRoot}/jsconfig.json`;
const runtimeDeclarationsPath = `${playgroundWorkspaceRoot}/types/codeorbit-playground-runtime.d.ts`;
const packageDeclarationsPath = `${playgroundWorkspaceRoot}/types/codeorbit-webcore-packages.d.ts`;

type MonacoTextModel = {
  getLanguageId(): string;
  getValue(): string;
  uri: { toString(): string };
};

type MonacoCompletionContext = {
  triggerCharacter?: string;
  triggerKind?: number;
};

type MonacoCompletionPosition = {
  column: number;
  lineNumber: number;
};

type MonacoWordInfo = {
  endColumn: number;
  startColumn: number;
};

type LspCompletionTextEdit = {
  newText: string;
  range: {
    end: { character: number; line: number };
    start: { character: number; line: number };
  };
};

type LspCompletionItem = {
  detail?: string;
  documentation?: string | { kind?: string; value?: string };
  filterText?: string;
  insertText?: string;
  insertTextFormat?: number;
  kind?: number;
  label: string | { description?: string; detail?: string; label: string };
  sortText?: string;
  textEdit?: LspCompletionTextEdit;
};

type LspCompletionResponse = {
  isIncomplete?: boolean;
  items?: LspCompletionItem[];
};

const completionKinds: Record<CompletionKind, string> = {
  class: "Class",
  constructor: "Constructor",
  field: "Field",
  file: "File",
  function: "Function",
  interface: "Interface",
  keyword: "Keyword",
  method: "Method",
  module: "Module",
  property: "Property",
  snippet: "Snippet",
  struct: "Struct",
  text: "Text",
  variable: "Variable",
};

const javascriptCompletions: PlaygroundCompletion[] = [
  {
    label: "console.log",
    kind: "method",
    insertText: 'console.log(${1:value});',
    detail: "Standard output",
    documentation: "Log one or more values to the Output panel.",
  },
  {
    label: "prompt",
    kind: "function",
    insertText: 'prompt("${1:Enter a value: }")',
    detail: "Read from Input tab",
    documentation: "Consume one line from the Input tab inside the JavaScript runner.",
  },
  {
    label: "input",
    kind: "function",
    insertText: 'input("${1:Enter a value: }")',
    detail: "Read from Input tab",
    documentation: "CodeOrbit alias for prompt() inside the JavaScript runner.",
  },
  {
    label: "function",
    kind: "snippet",
    insertText: "function ${1:name}(${2:args}) {\n  ${3:// code}\n}",
    detail: "Function snippet",
    documentation: "Create a reusable JavaScript function.",
  },
  {
    label: "for...of",
    kind: "snippet",
    insertText: "for (const ${1:item} of ${2:items}) {\n  ${3:console.log(item)}\n}",
    detail: "Loop snippet",
    documentation: "Iterate over values in an iterable.",
  },
  {
    label: "try/catch",
    kind: "snippet",
    insertText: "try {\n  ${1:// code}\n} catch (${2:error}) {\n  console.error(${2:error});\n}",
    detail: "Error handling snippet",
    documentation: "Wrap code and surface runtime errors cleanly.",
  },
  {
    label: "fetch",
    kind: "function",
    insertText: 'fetch("${1:url}")\n  .then((response) => response.json())\n  .then((data) => {\n    ${2:console.log(data)};\n  });',
    detail: "Fetch request",
    documentation: "Basic browser fetch request pattern.",
  },
];

const pythonCompletions: PlaygroundCompletion[] = [
  {
    label: "print",
    kind: "function",
    insertText: "print(${1:value})",
    detail: "Standard output",
    documentation: "Write a value to the Output panel.",
  },
  {
    label: "input",
    kind: "function",
    insertText: "input(${1:\"\"})",
    detail: "Read stdin",
    documentation: "Read one line from the Input tab.",
  },
  {
    label: "def",
    kind: "snippet",
    insertText: "def ${1:name}(${2:args}):\n    ${3:pass}",
    detail: "Function snippet",
    documentation: "Create a Python function.",
  },
  {
    label: "for",
    kind: "snippet",
    insertText: "for ${1:item} in ${2:items}:\n    ${3:print(item)}",
    detail: "Loop snippet",
    documentation: "Iterate through a sequence.",
  },
  {
    label: "if __name__ == '__main__'",
    kind: "snippet",
    insertText: "if __name__ == \"__main__\":\n    ${1:main()}",
    detail: "Entry-point snippet",
    documentation: "Guard code that should run only as the main module.",
  },
];

const javaCompletions: PlaygroundCompletion[] = [
  {
    label: "main",
    kind: "snippet",
    insertText:
      "public static void main(String[] args) {\n        ${1:System.out.println(\"Hello CodeOrbit\");}\n    }",
    detail: "Main method",
    documentation: "Insert the Java application entry point.",
  },
  {
    label: "System.out.println",
    kind: "method",
    insertText: "System.out.println(${1:value});",
    detail: "Print line",
    documentation: "Print a line to standard output.",
  },
  {
    label: "Scanner",
    kind: "class",
    insertText:
      "Scanner ${1:sc} = new Scanner(System.in);\n${2:int value = sc.nextInt();}",
    detail: "Standard input",
    documentation: "Read input using java.util.Scanner. Common Java imports are auto-added in the runner.",
  },
  {
    label: "for",
    kind: "snippet",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n        ${3:// code}\n    }",
    detail: "Loop snippet",
    documentation: "Insert a standard counted loop.",
  },
  {
    label: "class Main",
    kind: "snippet",
    insertText:
      "public class Main {\n    public static void main(String[] args) {\n        ${1:System.out.println(\"Hello CodeOrbit\");}\n    }\n}",
    detail: "Program template",
    documentation: "Insert a complete Main class template.",
  },
];

const htmlCompletions: PlaygroundCompletion[] = [
  {
    label: "html:5",
    kind: "snippet",
    insertText:
      "<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>${1:CodeOrbit}</title>\n    <style>\n      ${2:body {\n        margin: 0;\n        font-family: Arial, sans-serif;\n      }}\n    </style>\n  </head>\n  <body>\n    ${3:<h1>Hello CodeOrbit</h1>}\n  </body>\n</html>",
    detail: "HTML document",
    documentation: "Insert a complete HTML starter document.",
  },
  {
    label: "div.container",
    kind: "snippet",
    insertText: "<div class=\"${1:container}\">\n  ${2}\n</div>",
    detail: "Container element",
    documentation: "Insert a styled wrapper element.",
  },
  {
    label: "style",
    kind: "snippet",
    insertText: "<style>\n  ${1}\n</style>",
    detail: "Inline styles",
    documentation: "Insert a style block.",
  },
  {
    label: "script",
    kind: "snippet",
    insertText: "<script>\n  ${1}\n</script>",
    detail: "Inline script",
    documentation: "Insert a script block inside the document.",
  },
];

const cssCompletions: PlaygroundCompletion[] = [
  {
    label: "display: grid",
    kind: "snippet",
    insertText: "display: grid;\nplace-items: center;",
    detail: "Grid layout",
    documentation: "Center content quickly with CSS Grid.",
  },
  {
    label: "display: flex",
    kind: "snippet",
    insertText: "display: flex;\nalign-items: center;\njustify-content: center;",
    detail: "Flex layout",
    documentation: "Create a centered flex container.",
  },
  {
    label: "background: linear-gradient",
    kind: "snippet",
    insertText: "background: linear-gradient(135deg, ${1:#8b5cf6}, ${2:#06b6d4});",
    detail: "Gradient background",
    documentation: "Apply a smooth linear gradient background.",
  },
  {
    label: "@media",
    kind: "snippet",
    insertText: "@media (max-width: ${1:768px}) {\n  ${2:.selector} {\n    ${3:display: none;}\n  }\n}",
    detail: "Responsive breakpoint",
    documentation: "Add a responsive media query block.",
  },
];

const sqlCompletions: PlaygroundCompletion[] = [
  {
    label: "SELECT",
    kind: "keyword",
    insertText: "SELECT ${1:*}\nFROM ${2:table_name}\nWHERE ${3:condition};",
    detail: "Query rows",
    documentation: "Select rows from a table.",
  },
  {
    label: "CREATE TABLE",
    kind: "snippet",
    insertText:
      "CREATE TABLE ${1:table_name} (\n  ${2:id} INTEGER PRIMARY KEY,\n  ${3:name} TEXT\n);",
    detail: "Create table",
    documentation: "Create a new SQLite table.",
  },
  {
    label: "INSERT INTO",
    kind: "snippet",
    insertText:
      "INSERT INTO ${1:table_name} (${2:column1}, ${3:column2})\nVALUES (${4:value1}, ${5:value2});",
    detail: "Insert row",
    documentation: "Insert a record into a table.",
  },
  {
    label: "UPDATE",
    kind: "snippet",
    insertText:
      "UPDATE ${1:table_name}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};",
    detail: "Update rows",
    documentation: "Update matching rows in a table.",
  },
  {
    label: "DELETE FROM",
    kind: "snippet",
    insertText: "DELETE FROM ${1:table_name}\nWHERE ${2:condition};",
    detail: "Delete rows",
    documentation: "Delete matching rows from a table.",
  },
  {
    label: "JOIN",
    kind: "snippet",
    insertText:
      "SELECT ${1:a.*}, ${2:b.*}\nFROM ${3:table_a} ${4:a}\nJOIN ${5:table_b} ${6:b} ON ${7:a.id = b.id};",
    detail: "Join query",
    documentation: "Insert a basic inner join query.",
  },
];

const cppCompletions: PlaygroundCompletion[] = [
  {
    label: "#include",
    kind: "keyword",
    insertText: "#include <${1:iostream}>",
    detail: "Include directive",
    documentation: "Include standard library header."
  },
  {
    label: "main",
    kind: "snippet",
    insertText: "int main() {\n    ${1:std::cout << \"Hello CodeOrbit\\n\";}\n    return 0;\n}",
    detail: "Main function",
    documentation: "Standard C++ main entry point."
  },
  {
    label: "std::cout",
    kind: "snippet",
    insertText: "std::cout << ${1:value} << \"\\n\";",
    detail: "Console out",
    documentation: "Print to standard output."
  },
  {
    label: "for",
    kind: "snippet",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}",
    detail: "For loop",
    documentation: "Standard for loop."
  }
];

const goCompletions: PlaygroundCompletion[] = [
  {
    label: "main",
    kind: "snippet",
    insertText: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t${1:fmt.Println(\"Hello CodeOrbit\")}\n}",
    detail: "Main package",
    documentation: "Standard Go main package and function."
  },
  {
    label: "fmt.Println",
    kind: "function",
    insertText: "fmt.Println(${1:value})",
    detail: "Print line",
    documentation: "Print to standard output."
  },
  {
    label: "func",
    kind: "snippet",
    insertText: "func ${1:name}(${2:args}) ${3:error} {\n\t${4:// code}\n\treturn nil\n}",
    detail: "Function declaration",
    documentation: "Standard function."
  },
  {
    label: "for",
    kind: "snippet",
    insertText: "for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t${3:// code}\n}",
    detail: "For loop",
    documentation: "Standard Go for loop."
  }
];

function buildSuggestions(monaco: MonacoInstance, items: PlaygroundCompletion[]) {
  return items.map((item) => ({
    label: item.label,
    kind: monaco.languages.CompletionItemKind[completionKinds[item.kind]],
    insertText: item.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: item.detail,
    documentation: {
      value: item.documentation,
    },
  }));
}

function buildCompletionRange(position: MonacoCompletionPosition, word: MonacoWordInfo) {
  return {
    endColumn: word.endColumn,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    startLineNumber: position.lineNumber,
  };
}

function registerProvider(
  monaco: MonacoInstance,
  language: string,
  items: PlaygroundCompletion[],
  triggerCharacters?: string[],
) {
  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters,
    provideCompletionItems(
      model: {
        getWordUntilPosition: (position: { column: number; lineNumber: number }) => {
          endColumn: number;
          startColumn: number;
        };
      },
      position: { column: number; lineNumber: number },
    ) {
      const word = model.getWordUntilPosition(position);
      const range = buildCompletionRange(position, word);

      return {
        suggestions: buildSuggestions(monaco, items).map((suggestion) => ({
          ...suggestion,
          range,
        })),
      };
    },
  });
}

function isPlaygroundModel(model: MonacoTextModel) {
  return model.uri.toString().startsWith(playgroundWorkspaceRoot);
}

function buildWorkspaceFileRecord(model: MonacoTextModel): PlaygroundMonacoWorkspaceFile {
  return {
    language: model.getLanguageId(),
    path: model.uri.toString(),
    value: model.getValue(),
  };
}

function mergeWorkspaceFiles(...groups: PlaygroundMonacoWorkspaceFile[][]) {
  const merged = new Map<string, PlaygroundMonacoWorkspaceFile>();

  for (const group of groups) {
    for (const file of group) {
      merged.set(file.path, file);
    }
  }

  return Array.from(merged.values());
}

function collectPlaygroundWorkspaceFiles(monaco: MonacoInstance) {
  const workspaceModels = (monaco.editor.getModels() as MonacoTextModel[]).filter(
    isPlaygroundModel,
  );

  return mergeWorkspaceFiles(
    workspaceModels.map(buildWorkspaceFileRecord),
    getPlaygroundSupportFiles(),
  );
}

function lspKindToMonacoKind(monaco: MonacoInstance, kind?: number) {
  switch (kind) {
    case 2:
      return monaco.languages.CompletionItemKind.Method;
    case 3:
      return monaco.languages.CompletionItemKind.Function;
    case 4:
      return monaco.languages.CompletionItemKind.Constructor;
    case 5:
      return monaco.languages.CompletionItemKind.Field;
    case 6:
      return monaco.languages.CompletionItemKind.Variable;
    case 7:
      return monaco.languages.CompletionItemKind.Class;
    case 8:
      return monaco.languages.CompletionItemKind.Interface;
    case 9:
      return monaco.languages.CompletionItemKind.Module;
    case 10:
      return monaco.languages.CompletionItemKind.Property;
    case 14:
      return monaco.languages.CompletionItemKind.Keyword;
    case 15:
      return monaco.languages.CompletionItemKind.Snippet;
    case 17:
      return monaco.languages.CompletionItemKind.File;
    case 22:
      return monaco.languages.CompletionItemKind.Struct;
    default:
      return monaco.languages.CompletionItemKind.Text;
  }
}

function getLspItemLabel(item: LspCompletionItem) {
  return typeof item.label === "string" ? item.label : item.label.label;
}

function getLspItemDetail(item: LspCompletionItem) {
  const labelDetail = typeof item.label === "string" ? undefined : item.label.detail;
  const labelDescription = typeof item.label === "string" ? undefined : item.label.description;

  return [item.detail, labelDetail, labelDescription].filter(Boolean).join(" • ") || undefined;
}

function getLspItemDocumentation(item: LspCompletionItem) {
  if (!item.documentation) {
    return undefined;
  }

  if (typeof item.documentation === "string") {
    return { value: item.documentation };
  }

  return item.documentation.value ? { value: item.documentation.value } : undefined;
}

function toMonacoRangeFromTextEdit(
  position: MonacoCompletionPosition,
  word: MonacoWordInfo,
  textEdit?: LspCompletionTextEdit,
) {
  if (!textEdit) {
    return buildCompletionRange(position, word);
  }

  return {
    endColumn: textEdit.range.end.character + 1,
    endLineNumber: textEdit.range.end.line + 1,
    startColumn: textEdit.range.start.character + 1,
    startLineNumber: textEdit.range.start.line + 1,
  };
}

function mapLspCompletionItemToMonaco(
  monaco: MonacoInstance,
  item: LspCompletionItem,
  position: MonacoCompletionPosition,
  word: MonacoWordInfo,
) {
  return {
    detail: getLspItemDetail(item),
    documentation: getLspItemDocumentation(item),
    filterText: item.filterText,
    insertText: item.textEdit?.newText ?? item.insertText ?? getLspItemLabel(item),
    insertTextRules:
      item.insertTextFormat === 2
        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        : undefined,
    kind: lspKindToMonacoKind(monaco, item.kind),
    label: getLspItemLabel(item),
    range: toMonacoRangeFromTextEdit(position, word, item.textEdit),
    sortText: item.sortText,
  };
}

async function requestLspCompletions(
  language: "cpp" | "css" | "html" | "java" | "javascript" | "python",
  body: {
    documentUri: string;
    files: PlaygroundMonacoWorkspaceFile[];
    position: { column: number; line: number };
    requestContext?: MonacoCompletionContext;
  },
) {
  const response = await fetch("/api/playground/lsp", {
    body: JSON.stringify({
      ...body,
      language,
    }),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    items?: LspCompletionItem[] | LspCompletionResponse | null;
  };

  if (!payload.items) {
    return [];
  }

  return Array.isArray(payload.items) ? payload.items : payload.items.items ?? [];
}

function registerLspCompletionProvider(
  monaco: MonacoInstance,
  language: "cpp" | "css" | "html" | "java" | "javascript" | "python",
  triggerCharacters?: string[],
) {
  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters,
    async provideCompletionItems(
      model: MonacoTextModel & {
        getWordUntilPosition(position: MonacoCompletionPosition): MonacoWordInfo;
      },
      position: MonacoCompletionPosition,
      context: MonacoCompletionContext,
    ) {
      if (!isPlaygroundModel(model)) {
        return { suggestions: [] };
      }

      try {
        const workspaceFiles = collectPlaygroundWorkspaceFiles(monaco);
        const lspItems = await requestLspCompletions(language, {
          documentUri: model.uri.toString(),
          files: workspaceFiles,
          position: {
            column: position.column,
            line: position.lineNumber,
          },
          requestContext: context,
        });
        const word = model.getWordUntilPosition(position);

        return {
          suggestions: lspItems.map((item) =>
            mapLspCompletionItemToMonaco(monaco, item, position, word),
          ),
        };
      } catch (error) {
        console.warn(
          `[CodeOrbit:${language}] Unable to load LSP completions.`,
          error instanceof Error ? error.message : error,
        );

        return { suggestions: [] };
      }
    },
  });
}

let playgroundMonacoConfigured = false;
let codeorbitRuntimeLibDisposable: { dispose(): void } | null = null;
let webcorePackagesLibDisposable: { dispose(): void } | null = null;
let syncedWorkspaceModelPaths = new Set<string>();
let currentWebCorePackageDeclarations = "export {};";

function buildRuntimeDeclarations() {
  return [
    "declare function input(prompt?: string): string;",
    "declare function prompt(message?: string): string;",
    "declare function alert(message?: string): void;",
    "declare module \"*.css\" {",
    "  const href: string;",
    "  export default href;",
    "}",
    "declare module \"*.html\" {",
    "  const markup: string;",
    "  export default markup;",
    "}",
  ].join("\n");
}

function buildJsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        checkJs: true,
        jsx: "react-jsx",
        lib: ["dom", "dom.iterable", "es2022"],
        module: "ESNext",
        moduleResolution: "Bundler",
        target: "ES2022",
      },
      include: ["**/*"],
    },
    null,
    2,
  );
}

function buildWebCorePackageDeclarations(packages: PlaygroundMonacoWorkspacePackage[]) {
  if (packages.length === 0) {
    return "export {};";
  }

  return packages
    .map((pkg) =>
      [
        `declare module "${pkg.name}" {`,
        "  const mod: any;",
        "  export default mod;",
        "}",
        `declare module "${pkg.name}/*" {`,
        "  const mod: any;",
        "  export default mod;",
        "}",
      ].join("\n"),
    )
    .join("\n\n");
}

function getPlaygroundSupportFiles() {
  return [
    {
      language: "json",
      path: jsConfigPath,
      value: buildJsConfig(),
    },
    {
      language: "typescript",
      path: runtimeDeclarationsPath,
      value: buildRuntimeDeclarations(),
    },
    {
      language: "typescript",
      path: packageDeclarationsPath,
      value: currentWebCorePackageDeclarations,
    },
  ] satisfies PlaygroundMonacoWorkspaceFile[];
}

function setSharedTypeScriptDefaults(monaco: MonacoInstance) {
  const sharedCompilerOptions = {
    allowJs: true,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    checkJs: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    lib: ["dom", "dom.iterable", "es2022"],
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    noEmit: true,
    resolveJsonModule: true,
    target: monaco.languages.typescript.ScriptTarget.ES2022,
  } as const;

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(sharedCompilerOptions);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
    onlyVisible: false,
  });
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(sharedCompilerOptions);
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
    onlyVisible: false,
  });
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
}

function ensureExtraLibs(
  monaco: MonacoInstance,
  packages: PlaygroundMonacoWorkspacePackage[] = [],
) {
  const runtimeDeclarations = buildRuntimeDeclarations();
  currentWebCorePackageDeclarations = buildWebCorePackageDeclarations(packages);

  codeorbitRuntimeLibDisposable?.dispose();
  codeorbitRuntimeLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
    runtimeDeclarations,
    runtimeDeclarationsPath,
  );

  webcorePackagesLibDisposable?.dispose();
  webcorePackagesLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
    currentWebCorePackageDeclarations,
    packageDeclarationsPath,
  );
}

function syncWorkspaceModel(monaco: MonacoInstance, file: PlaygroundMonacoWorkspaceFile) {
  const modelUri = monaco.Uri.parse(file.path);
  const existingModel = monaco.editor.getModel(modelUri);

  if (!existingModel) {
    monaco.editor.createModel(file.value, file.language, modelUri);
    return;
  }

  if (existingModel.getLanguageId() !== file.language) {
    monaco.editor.setModelLanguage(existingModel, file.language);
  }

  if (existingModel.getValue() !== file.value) {
    existingModel.setValue(file.value);
  }
}

export function buildPlaygroundModelPath(...segments: string[]) {
  const sanitizedPath = segments
    .flatMap((segment) => segment.split("/"))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${playgroundWorkspaceRoot}/${sanitizedPath}`;
}

export function syncPlaygroundMonacoWorkspace(
  monaco: MonacoInstance,
  files: PlaygroundMonacoWorkspaceFile[],
  packages: PlaygroundMonacoWorkspacePackage[] = [],
) {
  ensureExtraLibs(monaco, packages);

  const allWorkspaceFiles = mergeWorkspaceFiles(files, getPlaygroundSupportFiles());
  const nextWorkspaceModelPaths = new Set(allWorkspaceFiles.map((file) => file.path));

  for (const previousPath of syncedWorkspaceModelPaths) {
    if (nextWorkspaceModelPaths.has(previousPath)) {
      continue;
    }

    const staleModel = monaco.editor.getModel(monaco.Uri.parse(previousPath));
    staleModel?.dispose();
  }

  for (const file of allWorkspaceFiles) {
    syncWorkspaceModel(monaco, file);
  }

  syncedWorkspaceModelPaths = nextWorkspaceModelPaths;
}

export function configurePlaygroundMonaco(monaco: MonacoInstance) {
  // Always define the theme on mount so fast-refreshes don't drop it and fallback to white.
  monaco.editor.defineTheme("codeorbit-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "52525b", fontStyle: "italic" },
      { token: "keyword", foreground: "a78bfa" },
      { token: "identifier", foreground: "d4d4d8" },
      { token: "identifier.js", foreground: "d4d4d8" },
      { token: "variable", foreground: "d4d4d8" },
      { token: "variable.js", foreground: "d4d4d8" },
      { token: "variable.parameter", foreground: "fdba74" },
      { token: "variable.parameter.js", foreground: "fdba74" },
      { token: "type.identifier", foreground: "86efac" },
      { token: "type.identifier.js", foreground: "86efac" },
      { token: "type", foreground: "86efac" },
      { token: "function", foreground: "67e8f9" },
      { token: "function.js", foreground: "67e8f9" },
      { token: "function.call", foreground: "67e8f9" },
      { token: "support.class", foreground: "86efac" },
      { token: "support.type", foreground: "86efac" },
      { token: "support.function", foreground: "67e8f9" },
      { token: "string", foreground: "86efac" },
      { token: "number", foreground: "4ade80" },
      { token: "operator", foreground: "d4d4d8" },
      { token: "delimiter", foreground: "fde047" },
      { token: "delimiter.bracket", foreground: "fde047" },
      { token: "delimiter.parenthesis", foreground: "fde047" },
    ],
    colors: {
      "editor.background": "#0c0c0f",
      "editor.foreground": "#d4d4d8",
      "editorLineNumber.foreground": "#3f3f46",
      "editorLineNumber.activeForeground": "#71717a",
      "editor.selectionBackground": "#27272a",
      "editor.inactiveSelectionBackground": "#1f1f23",
      "editorCursor.foreground": "#67e8f9",
      "editorIndentGuide.background": "#27272a",
      "editorIndentGuide.activeBackground": "#3f3f46",
      "editor.lineHighlightBackground": "#0f0f13",
      "editor.lineHighlightBorder": "#00000000",
    },
  });

  if (playgroundMonacoConfigured) {
    return;
  }

  playgroundMonacoConfigured = true;

  setSharedTypeScriptDefaults(monaco);
  ensureExtraLibs(monaco);

  registerProvider(monaco, "javascript", javascriptCompletions, ["."]);
  registerProvider(monaco, "python", pythonCompletions, ["."]);
  registerProvider(monaco, "java", javaCompletions, ["."]);
  registerProvider(monaco, "html", htmlCompletions, ["<"]);
  registerProvider(monaco, "css", cssCompletions, [":", "-", "."]);
  registerProvider(monaco, "sql", sqlCompletions);
  registerProvider(monaco, "cpp", cppCompletions, ["<", "."]);
  registerProvider(monaco, "go", goCompletions, ["."]);
  registerLspCompletionProvider(monaco, "javascript", [".", "\"", "'", "/", "@"]);
  registerLspCompletionProvider(monaco, "html", ["<", " ", "\"", "=", "/"]);
  registerLspCompletionProvider(monaco, "css", [":", "-", ".", "@", "#"]);
  registerLspCompletionProvider(monaco, "java", ["."]);
  registerLspCompletionProvider(monaco, "python", ["."]);
  registerLspCompletionProvider(monaco, "cpp", [".", ">", ":"]);
}
