import {
  buildUnsupportedJavaScriptRuntimeMessage,
  getUnsupportedJavaScriptBrowserApi,
  prepareJavaScriptForExecution,
  usesJavaScriptPromptHelpers,
} from "@/lib/playgroundJavascriptRuntime";
import { formatExecutionFeedback } from "@/lib/playgroundExecutionFeedback";
import { prepareJavaForExecution } from "@/lib/playgroundJavaRuntime";
import { spawnSync } from "node:child_process";

describe("playground javascript runtime", () => {
  it("allows prompt-style helpers in the JavaScript runner", () => {
    expect(getUnsupportedJavaScriptBrowserApi('const name = prompt("Name");')).toBeNull();
    expect(getUnsupportedJavaScriptBrowserApi('const confirmed = window.confirm("Continue?");')).toBeNull();
  });

  it("flags browser APIs that require the DOM runtime", () => {
    expect(getUnsupportedJavaScriptBrowserApi("console.log(document.title);")).toBe("document");
    expect(getUnsupportedJavaScriptBrowserApi("console.log(navigator.userAgent);")).toBe("navigator");
  });

  it("detects when the Input tab helpers should be wired in", () => {
    expect(usesJavaScriptPromptHelpers('const value = input("Age");')).toBe(true);
    expect(usesJavaScriptPromptHelpers('console.log("plain node");')).toBe(false);
  });

  it("injects the prompt runtime only when needed", () => {
    const interactiveCode = 'const name = prompt("Name: ");\nconsole.log(name);';
    const preparedInteractiveCode = prepareJavaScriptForExecution(interactiveCode);

    expect(preparedInteractiveCode).toContain("globalThis.prompt");
    expect(preparedInteractiveCode).toContain(interactiveCode);

    const plainNodeCode = 'const fs = require("fs");\nconsole.log(fs.readFileSync(0, "utf8"));';
    expect(prepareJavaScriptForExecution(plainNodeCode)).toBe(plainNodeCode);
  });

  it("executes prompt-driven JavaScript with stdin answers", () => {
    const preparedCode = prepareJavaScriptForExecution(
      'const name = prompt("Name: ");\nconsole.log(`Hello ${name}`);',
    );

    const result = spawnSync(process.execPath, ["-e", preparedCode], {
      encoding: "utf8",
      input: "Aman\n",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Name: Hello Aman");
  });

  it("builds a helpful unsupported API message", () => {
    expect(buildUnsupportedJavaScriptRuntimeMessage("document")).toContain("prompt()");
    expect(buildUnsupportedJavaScriptRuntimeMessage("document")).toContain("document");
  });
});

describe("playground java runtime", () => {
  it("injects common standard-library imports for simple Java snippets", () => {
    const preparedCode = prepareJavaForExecution(
      "public class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n  }\n}",
    );

    expect(preparedCode).toContain("import java.util.*;");
    expect(preparedCode).toContain("import java.io.*;");
    expect(preparedCode).toContain("public class Main");
  });

  it("keeps the package declaration at the top when adding imports", () => {
    const preparedCode = prepareJavaForExecution(
      "package demo;\npublic class Main {\n  public static void main(String[] args) {}\n}",
    );

    expect(preparedCode.startsWith("package demo;")).toBe(true);
    expect(preparedCode).toMatch(/^package demo;\n\nimport java\.io\.\*;/);
    expect(preparedCode).toContain("import java.util.*;");
  });

  it("does not duplicate an existing java.util import", () => {
    const preparedCode = prepareJavaForExecution(
      "import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {}\n}",
    );

    expect(preparedCode.match(/import java\.util\.\*;/g)).toBeNull();
  });
});

describe("playground execution feedback", () => {
  it("explains missing npm packages clearly", () => {
    const message = formatExecutionFeedback("javascript", "Error: Cannot find module 'axios'");

    expect(message).toContain("Imports & Setup");
    expect(message).toContain("WebCore");
  });

  it("explains missing Java dependencies clearly", () => {
    const message = formatExecutionFeedback("java", "package com.google.gson does not exist");

    expect(message).toContain("Common Java imports");
    expect(message).toContain("Maven coordinates");
  });
});
