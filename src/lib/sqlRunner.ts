type SqlJsExecResult = {
  columns: string[];
  values: unknown[][];
};

type SqlJsDatabase = {
  exec: (sql: string) => SqlJsExecResult[];
  close: () => void;
};

type SqlJsModule = {
  Database: new () => SqlJsDatabase;
};

export type SqlResultTable = {
  title: string;
  columns: string[];
  rows: unknown[][];
};

export type SqlRunResult = {
  output: string;
  error: string;
  tables: SqlResultTable[];
};

let sqlJsPromise: Promise<SqlJsModule> | null = null;

function ensureBrowserContext() {
  if (typeof window === "undefined") {
    throw new Error("SQL execution is only available in the browser.");
  }
}

async function getSqlJs() {
  ensureBrowserContext();

  if (sqlJsPromise) {
    return sqlJsPromise;
  }

  sqlJsPromise = import("sql.js")
    .then(async (module) => {
      const initSqlJs = module.default;
      return initSqlJs({
        locateFile: (file: string) => `/${file}`,
      }) as Promise<SqlJsModule>;
    })
    .catch((error) => {
      sqlJsPromise = null;
      throw error;
    });

  return sqlJsPromise;
}

function normalizeError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

export async function runSqlCode(sql: string): Promise<SqlRunResult> {
  const trimmedSql = sql.trim();

  if (!trimmedSql) {
    return {
      output: "",
      error: "No SQL provided.",
      tables: [],
    };
  }

  const SQL = await getSqlJs();
  const database = new SQL.Database();

  try {
    const results = database.exec(trimmedSql);
    const tables: SqlResultTable[] = results.map((result, index) => ({
      title: results.length > 1 ? `Result Set ${index + 1}` : "Query Result",
      columns: result.columns,
      rows: result.values,
    }));

    return {
      output:
        tables.length > 0
          ? `SQL executed successfully. ${tables.length} result set${tables.length === 1 ? "" : "s"} returned.`
          : "SQL executed successfully.",
      error: "",
      tables,
    };
  } catch (error) {
    return {
      output: "",
      error: normalizeError(error),
      tables: [],
    };
  } finally {
    database.close();
  }
}
