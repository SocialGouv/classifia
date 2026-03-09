import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { validateConfig } from './core/config/app.schema.config';
import { AiModule } from './modules/ai/ai.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { CrispModule } from './modules/crisp/crisp.module';
import { DrizzleModule } from './modules/drizzle/drizzle.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateConfig,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProdOrPreprod =
          configService.get('NODE_ENV') === 'preproduction' ||
          configService.get('NODE_ENV') === 'production';
        const isDev = configService.get('NODE_ENV') === 'development';
        const level = isProdOrPreprod ? 'info' : 'debug';
        const transport = isDev
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined;

        return {
          pinoHttp: {
            level,
            transport,
            serializers: {
              req: (req) => ({
                method: req.method,
                url: req.url,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                },
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    AiModule,
    CrispModule,
    ConversationsModule,
    DrizzleModule,
  ],
})
export class AppModule {}
