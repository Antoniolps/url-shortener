import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('redis://localhost:6380'),
    } as unknown as ConfigService;
    // lazyConnect: true no service — instanciar não abre conexão real.
    service = new RedisService(configService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('healthCheck retorna true quando o Redis responde PONG', async () => {
    jest.spyOn(service, 'ping').mockResolvedValue('PONG');
    await expect(service.healthCheck()).resolves.toBe(true);
  });

  it('healthCheck retorna false em falha de conexão, sem propagar exception', async () => {
    jest.spyOn(service, 'ping').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.healthCheck()).resolves.toBe(false);
  });

  it('boot não falha quando o Redis está indisponível (fail-open)', async () => {
    jest
      .spyOn(service, 'connect')
      .mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
