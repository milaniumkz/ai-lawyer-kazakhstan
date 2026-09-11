import { Provider } from "@nestjs/common";
import { DatabaseService } from "../../../common/database/database.service";
import { BillingRepository } from "./billing.repository";
import { PostgresBillingRepository } from "./postgres-billing.repository";

export const BILLING_REPOSITORY = Symbol("BILLING_REPOSITORY");

export const billingRepositoryProvider: Provider<
  BillingRepository | undefined
> = {
  provide: BILLING_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (
      process.env.PERSISTENCE_MODE !== "postgres" &&
      !process.env.DATABASE_URL
    )
      return undefined;
    return new PostgresBillingRepository(db);
  },
};
