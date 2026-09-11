import { Provider } from "@nestjs/common";
import { DatabaseService } from "../../../common/database/database.service";
import { DocumentsRepository } from "./documents.repository";
import { PostgresDocumentsRepository } from "./postgres-documents.repository";

export const DOCUMENTS_REPOSITORY = Symbol("DOCUMENTS_REPOSITORY");

export const documentsRepositoryProvider: Provider<
  DocumentsRepository | undefined
> = {
  provide: DOCUMENTS_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (
      process.env.PERSISTENCE_MODE !== "postgres" &&
      !process.env.DATABASE_URL
    )
      return undefined;
    return new PostgresDocumentsRepository(db);
  },
};
