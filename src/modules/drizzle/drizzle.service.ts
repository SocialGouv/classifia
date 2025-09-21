import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DrizzleAsyncProvider } from './drizzle.provider';
import * as schema from './schema';

export class DrizzleService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    public readonly db: NodePgDatabase<typeof schema>,
  ) {}
}
