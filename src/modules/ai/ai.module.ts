import { Module } from '@nestjs/common';

import { AgentsModule } from './agents/agents.module';

@Module({
  exports: [AgentsModule],
  imports: [AgentsModule],
})
export class AiModule {}
