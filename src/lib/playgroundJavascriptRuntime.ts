const supportedJavaScriptPromptHelperPatterns = [
  /\b(?:prompt|alert|confirm|input)\s*\(/,
  /\bwindow\.(?:prompt|alert|confirm|input)\s*\(/,
];

const unsupportedJavaScriptBrowserApiPatterns = [
  { label: "document", pattern: /\bdocument\./ },
  { label: "localStorage", pattern: /\blocalStorage\b/ },
  { label: "sessionStorage", pattern: /\bsessionStorage\b/ },
  { label: "navigator", pattern: /\bnavigator\./ },
] as const;

const javascriptPromptRuntimePrelude = String.raw`
const __codeorbitPromptLines = (() => {
  const __codeorbitRawInput = require("node:fs").readFileSync(0, "utf8").replace(/\r\n/g, "\n");
  return __codeorbitRawInput.length > 0
    ? (__codeorbitRawInput.match(/[^\n]*\n|[^\n]+/g) ?? [])
    : [];
})();
let __codeorbitPromptIndex = 0;
function __codeorbitReadInputLine() {
  if (__codeorbitPromptIndex >= __codeorbitPromptLines.length) {
    throw new Error("Input exhausted. Add another line in the Input tab for prompt(), confirm(), or input().");
  }
  const __codeorbitChunk = __codeorbitPromptLines[__codeorbitPromptIndex];
  __codeorbitPromptIndex += 1;
  return __codeorbitChunk.endsWith("\n") ? __codeorbitChunk.slice(0, -1) : __codeorbitChunk;
}
function __codeorbitPrompt(message = "") {
  if (message) {
    process.stdout.write(String(message));
  }
  return __codeorbitReadInputLine();
}
globalThis.prompt = globalThis.prompt ?? __codeorbitPrompt;
globalThis.input = globalThis.input ?? __codeorbitPrompt;
globalThis.alert =
  globalThis.alert ??
  ((...values) => {
    if (values.length > 0) {
      console.log(...values);
    }
  });
globalThis.confirm =
  globalThis.confirm ??
  ((message = "") => {
    const __codeorbitValue = __codeorbitPrompt(message).trim().toLowerCase();
    return !["", "0", "false", "no", "n", "cancel"].includes(__codeorbitValue);
  });
globalThis.window = globalThis.window ?? globalThis;
`;

export function getUnsupportedJavaScriptBrowserApi(code: string) {
  const match = unsupportedJavaScriptBrowserApiPatterns.find(({ pattern }) => pattern.test(code));
  return match?.label ?? null;
}

export function buildUnsupportedJavaScriptRuntimeMessage(api: string) {
  return `This JavaScript runner supports prompt(), alert(), confirm(), and input() through the Input tab, but ${api} is not available here. For browser UI code, switch to WebCore and place your JavaScript inside a <script> tag.`;
}

export function usesJavaScriptPromptHelpers(code: string) {
  return supportedJavaScriptPromptHelperPatterns.some((pattern) => pattern.test(code));
}

export function prepareJavaScriptForExecution(code: string) {
  if (!usesJavaScriptPromptHelpers(code)) {
    return code;
  }

  return `${javascriptPromptRuntimePrelude}\n${code}`;
}
