import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { URL_EVENTS_EXCHANGE } from './rabbitmq.constants';

@Injectable()
export class RabbitMQPublisherService {
  private readonly logger = new Logger(RabbitMQPublisherService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Publica fire-and-forget no exchange `url.events`. Falha de publicação é
   * degradação aceitável: loga e retorna false, nunca propaga exception.
   */
  async publish(routingKey: string, payload: object): Promise<boolean> {
    try {
      await this.amqpConnection.publish(URL_EVENTS_EXCHANGE, routingKey, payload);
      return true;
    } catch (error) {
      this.logger.warn(
        `Falha ao publicar evento ${routingKey}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  healthCheck(): boolean {
    return this.amqpConnection.connected;
  }
}
