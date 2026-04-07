"use client";

import type { EditorProps } from "@monaco-editor/react";

type MonacoInstance = Parameters<NonNullable<EditorProps["beforeMount"]>>[0];
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
    detail: "Browser console output",
    documentation: "Log one or more values to the Output panel.",
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
    documentation: "Read input using java.util.Scanner.",
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

function registerProvider(
  monaco: MonacoInstance,
  language: string,
  items: PlaygroundCompletion[],
  triggerCharacters?: string[]
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
      position: { column: number; lineNumber: number }
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: buildSuggestions(monaco, items).map((suggestion) => ({
          ...suggestion,
          range,
        })),
      };
    },
  });
}

let playgroundMonacoConfigured = false;

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

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    lib: ["dom", "es2020"],
    target: monaco.languages.typescript.ScriptTarget.ES2020,
  });

  registerProvider(monaco, "javascript", javascriptCompletions, ["."]);
  registerProvider(monaco, "python", pythonCompletions, ["."]);
  registerProvider(monaco, "java", javaCompletions, ["."]);
  registerProvider(monaco, "html", htmlCompletions, ["<"]);
  registerProvider(monaco, "sql", sqlCompletions);
  registerProvider(monaco, "cpp", cppCompletions, ["<", "."]);
  registerProvider(monaco, "go", goCompletions, ["."]);
}
