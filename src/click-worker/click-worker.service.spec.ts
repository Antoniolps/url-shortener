import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { ClickWorkerService } from './click-worker.service';

describe('ClickWorkerService', () => {
  let service: ClickWorkerService;
  let prismaMock: { url: { updateMany: jest.Mock } };

  const validEvent = {
    version: 1,
    type: 'click.registered',
    occurredAt: '2026-07-04T14:32:10Z',
    data: { shortCode: 'aZ3kQ1' },
  };

  beforeEach(() => {
    prismaMock = {
      url: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    service = new ClickWorkerService(
      prismaMock as unknown as PrismaService,
      {} as AmqpConnection,
    );
  });

  it('evento válido incrementa click_count atomicamente e é ackado', async () => {
    const result = await service.handleClickRegistered(validEvent);

    expect(result).toBeUndefined(); // retorno void = ack
    expect(prismaMock.url.updateMany).toHaveBeenCalledWith({
      where: { shortCode: 'aZ3kQ1' },
      data: { clickCount: { increment: 1 } },
    });
  });

  it.each([
    ['payload nulo', null],
    ['sem data', { version: 1, type: 'click.registered' }],
    ['shortCode vazio', { ...validEvent, data: { shortCode: '' } }],
    ['versão desconhecida', { ...validEvent, version: 99 }],
    ['type errado', { ...validEvent, type: 'outra.coisa' }],
  ])(
    'mensagem malformada (%s) vai pra DLQ via Nack sem requeue, sem exception',
    async (_label, message) => {
      const result = await service.handleClickRegistered(message);

      expect(result).toBeInstanceOf(Nack);
      expect((result as Nack).requeue).toBe(false);
      expect(prismaMock.url.updateMany).not.toHaveBeenCalled();
    },
  );

  it('falha de banco não derruba o worker: Nack sem requeue', async () => {
    prismaMock.url.updateMany.mockRejectedValue(new Error('db indisponível'));

    const result = await service.handleClickRegistered(validEvent);

    expect(result).toBeInstanceOf(Nack);
    expect((result as Nack).requeue).toBe(false);
  });
});
