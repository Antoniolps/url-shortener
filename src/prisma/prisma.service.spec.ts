import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('postgresql://test:test@localhost:5433/test'),
    } as unknown as ConfigService;
    service = new PrismaService(configService);
  });

  it('healthCheck retorna true quando o banco responde', async () => {
    jest.spyOn(service, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
    await expect(service.healthCheck()).resolves.toBe(true);
  });

  it('healthCheck retorna false em falha de conexão, sem propagar exception', async () => {
    jest
      .spyOn(service, '$queryRaw')
      .mockRejectedValue(new Error('connection refused'));
    await expect(service.healthCheck()).resolves.toBe(false);
  });
});
