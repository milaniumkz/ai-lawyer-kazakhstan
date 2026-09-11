import { Provider } from "@nestjs/common";
import { DatabaseService } from "../../../common/database/database.service";
import { PostgresTemplatesRepository } from "./postgres-templates.repository";
import { TemplatesRepository } from "./templates.repository";

export const TEMPLATES_REPOSITORY = Symbol("TEMPLATES_REPOSITORY");

export const templatesRepositoryProvider: Provider<
  TemplatesRepository | undefined
> = {
  provide: TEMPLATES_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (
      process.env.PERSISTENCE_MODE !== "postgres" &&
      !process.env.DATABASE_URL
    )
      return undefined;
    return new PostgresTemplatesRepository(db);
  },
};
