import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';
import { URL_EVENTS_EXCHANGE } from './rabbitmq.constants';

describe('RabbitMQPublisherService', () => {
  let service: RabbitMQPublisherService;
  let amqpConnection: { publish: jest.Mock; connected: boolean };

  beforeEach(() => {
    amqpConnection = { publish: jest.fn().mockResolvedValue(undefined), connected: true };
    service = new RabbitMQPublisherService(
      amqpConnection as unknown as AmqpConnection,
    );
  });

  it('publica no exchange url.events com a routing key informada', async () => {
    const payload = { version: 1, type: 'click.registered' };

    await expect(service.publish('url.click.registered', payload)).resolves.toBe(
      true,
    );
    expect(amqpConnection.publish).toHaveBeenCalledWith(
      URL_EVENTS_EXCHANGE,
      'url.click.registered',
      payload,
    );
  });

  it('falha de publicação não propaga exception (fail-open), retorna false', async () => {
    amqpConnection.publish.mockRejectedValue(new Error('broker indisponível'));

    await expect(
      service.publish('url.click.registered', { version: 1 }),
    ).resolves.toBe(false);
  });

  it('healthCheck reflete o estado da conexão', () => {
    expect(service.healthCheck()).toBe(true);
    amqpConnection.connected = false;
    expect(service.healthCheck()).toBe(false);
  });
});
