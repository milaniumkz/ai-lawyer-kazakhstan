import { Provider } from "@nestjs/common";
import { DatabaseService } from "../../../common/database/database.service";
import { LegalRepository } from "./legal.repository";
import { PostgresLegalRepository } from "./postgres-legal.repository";

export const LEGAL_REPOSITORY = Symbol("LEGAL_REPOSITORY");

export const legalRepositoryProvider: Provider<LegalRepository | undefined> = {
  provide: LEGAL_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (
      process.env.PERSISTENCE_MODE !== "postgres" &&
      !process.env.DATABASE_URL
    )
      return undefined;
    return new PostgresLegalRepository(db);
  },
};
