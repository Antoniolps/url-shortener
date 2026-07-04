import {
  AmqpConnection,
  Nack,
  RabbitSubscribe,
  defaultNackErrorHandler,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClickRegisteredEvent } from '../rabbitmq/events/click-registered.event';
import {
  CLICK_REGISTERED_EVENT_TYPE,
  CLICK_REGISTERED_EVENT_VERSION,
  CLICK_REGISTERED_ROUTING_KEY,
  CLICK_WORKER_DLQ,
  CLICK_WORKER_QUEUE,
  URL_EVENTS_EXCHANGE,
} from '../rabbitmq/rabbitmq.constants';

@Injectable()
export class ClickWorkerService implements OnModuleInit {
  private readonly logger = new Logger(ClickWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  onModuleInit(): void {
    // Garante a existência da DLQ mesmo antes da primeira dead letter —
    // addSetup roda (e re-roda) quando a conexão está de pé.
    void this.amqpConnection.managedChannel.addSetup(
      async (channel: {
        assertQueue: (queue: string, opts: object) => Promise<unknown>;
      }) => {
        await channel.assertQueue(CLICK_WORKER_DLQ, { durable: true });
      },
    );
  }

  @RabbitSubscribe({
    exchange: URL_EVENTS_EXCHANGE,
    routingKey: CLICK_REGISTERED_ROUTING_KEY,
    queue: CLICK_WORKER_QUEUE,
    queueOptions: {
      durable: true,
      // Nack sem requeue roteia pro DLQ via default exchange.
      deadLetterExchange: '',
      deadLetterRoutingKey: CLICK_WORKER_DLQ,
    },
    // Erro antes do handler (ex: JSON inválido) também vai pra DLQ —
    // o default do golevelup faz requeue e travaria a fila em loop.
    errorHandler: defaultNackErrorHandler,
  })
  async handleClickRegistered(message: unknown): Promise<void | Nack> {
    const shortCode = this.extractShortCode(message);
    if (shortCode === null) {
      this.logger.warn(
        `Mensagem malformada roteada para a DLQ: ${JSON.stringify(message)}`,
      );
      return new Nack(false);
    }

    try {
      // Incremento atômico no banco; idempotência não implementada —
      // contagem aproximada é aceitável (RF03).
      await this.prisma.url.updateMany({
        where: { shortCode },
        data: { clickCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao incrementar clique de ${shortCode}, mensagem vai pra DLQ`,
        (error as Error).stack,
      );
      return new Nack(false);
    }
  }

  private extractShortCode(message: unknown): string | null {
    const event = message as Partial<ClickRegisteredEvent> | null;
    if (
      !event ||
      event.version !== CLICK_REGISTERED_EVENT_VERSION ||
      event.type !== CLICK_REGISTERED_EVENT_TYPE ||
      typeof event.data?.shortCode !== 'string' ||
      event.data.shortCode.length === 0
    ) {
      return null;
    }
    return event.data.shortCode;
  }
}
