import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv();

function databasePath(): string {
  return path.resolve(process.env.DATABASE_PATH ?? "./data/planning.db");
}

export const config = {
  databasePath,
  statementsDir: () =>
    path.resolve(
      process.env.STATEMENTS_DIR ??
        path.join(path.dirname(databasePath()), "..", "inbox"),
    ),
};
