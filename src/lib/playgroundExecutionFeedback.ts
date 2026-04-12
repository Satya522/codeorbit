type ExecutionLanguage = "cpp" | "go" | "java" | "javascript" | "python";

function buildDependencyMessage(summary: string, rawError: string) {
  return `${summary}\n\n${rawError}`;
}

export function formatExecutionFeedback(language: ExecutionLanguage, rawError: string) {
  const trimmedError = rawError.trim();

  if (!trimmedError) {
    return trimmedError;
  }

  if (language === "java" && /package\s+[\w.]+\s+does not exist/.test(trimmedError)) {
    return buildDependencyMessage(
      "Common Java imports like java.util and java.io are auto-added here. For external Java libraries, open Imports & Setup and add Maven coordinates such as groupId:artifactId:version.",
      trimmedError,
    );
  }

  if (language === "javascript" && /Cannot find module|ERR_MODULE_NOT_FOUND/.test(trimmedError)) {
    return buildDependencyMessage(
      "Open Imports & Setup to link the npm package for this server-side JavaScript run. Browser libraries still belong in WebCore under Files & Packages.",
      trimmedError,
    );
  }

  if (language === "python" && /ModuleNotFoundError:\s+No module named/.test(trimmedError)) {
    return buildDependencyMessage(
      "Open Imports & Setup to link the third-party Python package you want for this run. Standard library imports keep working automatically.",
      trimmedError,
    );
  }

  if (language === "go" && /no required module provides package|cannot find package/.test(trimmedError)) {
    return buildDependencyMessage(
      "Open Imports & Setup to link the Go module path for this run. Standard library packages keep working automatically.",
      trimmedError,
    );
  }

  if (language === "cpp" && /fatal error: .*: No such file or directory/.test(trimmedError)) {
    return buildDependencyMessage(
      "CodeOrbit can track your includes, but external C++ libraries still have to exist in the sandbox image itself. Imports & Setup will show what your code is trying to include.",
      trimmedError,
    );
  }

  return trimmedError;
}
