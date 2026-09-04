import { Provider } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { IdentityRepository } from './identity.repository';
import { PostgresIdentityRepository } from './postgres-identity.repository';

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');

export const identityRepositoryProvider: Provider<IdentityRepository | undefined> = {
  provide: IDENTITY_REPOSITORY,
  inject: [DatabaseService],
  useFactory: (db: DatabaseService) => {
    if (process.env.PERSISTENCE_MODE !== 'postgres') return undefined;
    return new PostgresIdentityRepository(db);
  },
};
