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
      "This free Java runner now auto-adds common JDK imports like java.util and java.io, but it still cannot install Maven or Gradle dependencies on demand. For external Java libraries, you would need a dependency-aware sandbox or your own hosted compiler worker.",
      trimmedError,
    );
  }

  if (language === "javascript" && /Cannot find module|ERR_MODULE_NOT_FOUND/.test(trimmedError)) {
    return buildDependencyMessage(
      "This remote Node runner does not install npm packages on the fly. For browser-side libraries, switch to WebCore and use Files & Packages -> Add package. For server-side npm modules, you would need a dependency-aware sandbox.",
      trimmedError,
    );
  }

  if (language === "python" && /ModuleNotFoundError:\s+No module named/.test(trimmedError)) {
    return buildDependencyMessage(
      "This free Python runner supports stdin and the standard library, but it does not pip-install third-party packages automatically. For external Python libraries, you would need a dependency-aware sandbox.",
      trimmedError,
    );
  }

  if (language === "go" && /no required module provides package|cannot find package/.test(trimmedError)) {
    return buildDependencyMessage(
      "This free Go runner supports the standard library, but it does not run go get or resolve external modules automatically. External Go packages need a dependency-aware sandbox.",
      trimmedError,
    );
  }

  if (language === "cpp" && /fatal error: .*: No such file or directory/.test(trimmedError)) {
    return buildDependencyMessage(
      "This free C++ runner supports system headers that already exist in the compiler image, but it cannot install extra libraries automatically. External C++ dependencies need a custom sandbox image.",
      trimmedError,
    );
  }

  return trimmedError;
}
