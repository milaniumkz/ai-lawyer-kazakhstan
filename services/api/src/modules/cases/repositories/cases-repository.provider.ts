import { Provider } from "@nestjs/common";
import { DatabaseService } from "../../../common/database/database.service";
import { CasesRepository } from "./cases.repository";
import { PostgresCasesRepository } from "./postgres-cases.repository";

export const CASES_REPOSITORY = Symbol("CASES_REPOSITORY");

export const casesRepositoryProvider: Provider<CasesRepository | undefined> = {
  provide: CASES_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (
      process.env.PERSISTENCE_MODE !== "postgres" &&
      !process.env.DATABASE_URL
    )
      return undefined;
    return new PostgresCasesRepository(db);
  },
};
