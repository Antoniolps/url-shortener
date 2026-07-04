import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    // enableOfflineQueue: false faz comandos falharem rápido quando o Redis
    // está fora do ar, em vez de enfileirar — essencial pro fail-open do
    // caminho de leitura (o consumidor cai pro Postgres imediatamente).
    super(configService.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.on('error', (error: Error) =>
      this.logger.warn(`Erro de conexão com o Redis: ${error.message}`),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      // Fail-open: Redis indisponível não impede o boot da aplicação.
      this.logger.warn(
        `Redis indisponível no boot, seguindo sem cache: ${(error as Error).message}`,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.quit();
    } catch {
      this.disconnect();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return (await this.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
