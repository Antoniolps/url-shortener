import { Injectable, Logger } from '@nestjs/common';
import { UrlExpiredException } from '../common/exceptions/url-expired.exception';
import { UrlNotFoundException } from '../common/exceptions/url-not-found.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ClickRegisteredEvent } from '../rabbitmq/events/click-registered.event';
import { RabbitMQPublisherService } from '../rabbitmq/rabbitmq-publisher.service';
import {
  CLICK_REGISTERED_EVENT_TYPE,
  CLICK_REGISTERED_EVENT_VERSION,
  CLICK_REGISTERED_ROUTING_KEY,
} from '../rabbitmq/rabbitmq.constants';
import { RedisService } from '../redis/redis.service';

export const CACHE_KEY_PREFIX = 'url:';
export const CACHE_TTL_SECONDS = 3600;

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly publisher: RabbitMQPublisherService,
  ) {}

  async resolve(shortCode: string): Promise<string> {
    const cacheKey = `${CACHE_KEY_PREFIX}${shortCode}`;

    // Cache-aside com fail-open: qualquer erro do Redis cai pro Postgres.
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        this.registerClick(shortCode);
        return cached;
      }
    } catch (error) {
      this.logger.warn(
        `Redis indisponível no GET, caindo pro Postgres: ${(error as Error).message}`,
      );
    }

    const url = await this.prisma.url.findUnique({ where: { shortCode } });
    if (!url) {
      throw new UrlNotFoundException(shortCode);
    }

    const now = new Date();
    if (url.expiresAt && url.expiresAt.getTime() <= now.getTime()) {
      throw new UrlExpiredException(shortCode);
    }

    // TTL dinâmico: nunca maior que o tempo até expirar — o cache hit não
    // precisa checar expiração porque a chave morre junto com o link.
    const ttl = this.ttlFor(url.expiresAt, now);
    if (ttl > 0) {
      try {
        await this.redis.set(cacheKey, url.longUrl, 'EX', ttl);
      } catch (error) {
        this.logger.warn(
          `Redis indisponível no SET, seguindo sem cache: ${(error as Error).message}`,
        );
      }
    }

    this.registerClick(shortCode);
    return url.longUrl;
  }

  /**
   * Fire-and-forget: nunca aguarda a publicação nem propaga falha — perda
   * ocasional de evento de clique é degradação aceitável (RF03).
   */
  private registerClick(shortCode: string): void {
    const event: ClickRegisteredEvent = {
      version: CLICK_REGISTERED_EVENT_VERSION,
      type: CLICK_REGISTERED_EVENT_TYPE,
      occurredAt: new Date().toISOString(),
      data: { shortCode },
    };

    this.publisher.publish(CLICK_REGISTERED_ROUTING_KEY, event).catch((error: Error) => {
      this.logger.warn(`Falha ao publicar clique de ${shortCode}: ${error.message}`);
    });
  }

  private ttlFor(expiresAt: Date | null, now: Date): number {
    if (!expiresAt) {
      return CACHE_TTL_SECONDS;
    }
    const secondsUntilExpiry = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000,
    );
    return Math.min(CACHE_TTL_SECONDS, secondsUntilExpiry);
  }
}
