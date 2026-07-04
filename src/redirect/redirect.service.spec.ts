import { UrlExpiredException } from '../common/exceptions/url-expired.exception';
import { UrlNotFoundException } from '../common/exceptions/url-not-found.exception';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  CACHE_KEY_PREFIX,
  CACHE_TTL_SECONDS,
  RedirectService,
} from './redirect.service';

describe('RedirectService', () => {
  let service: RedirectService;
  let redisMock: { get: jest.Mock; set: jest.Mock };
  let prismaMock: { url: { findUnique: jest.Mock } };

  const urlRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1n,
    shortCode: 'aZ3kQ1',
    longUrl: 'https://exemplo.com',
    clickCount: 0n,
    createdAt: new Date(),
    expiresAt: null,
    ...overrides,
  });

  beforeEach(() => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
    prismaMock = { url: { findUnique: jest.fn().mockResolvedValue(null) } };
    service = new RedirectService(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as RedisService,
    );
  });

  it('cache hit retorna direto sem consultar o Postgres', async () => {
    redisMock.get.mockResolvedValue('https://exemplo.com');

    await expect(service.resolve('aZ3kQ1')).resolves.toBe(
      'https://exemplo.com',
    );
    expect(prismaMock.url.findUnique).not.toHaveBeenCalled();
  });

  it('cache miss busca no Postgres e popula o Redis com TTL padrão', async () => {
    prismaMock.url.findUnique.mockResolvedValue(urlRow());

    await expect(service.resolve('aZ3kQ1')).resolves.toBe(
      'https://exemplo.com',
    );
    expect(redisMock.set).toHaveBeenCalledWith(
      `${CACHE_KEY_PREFIX}aZ3kQ1`,
      'https://exemplo.com',
      'EX',
      CACHE_TTL_SECONDS,
    );
  });

  it('TTL dinâmico: usa o tempo até expiresAt quando menor que 3600s', async () => {
    prismaMock.url.findUnique.mockResolvedValue(
      urlRow({ expiresAt: new Date(Date.now() + 60_000) }),
    );

    await service.resolve('aZ3kQ1');

    const ttl = redisMock.set.mock.calls[0][3] as number;
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('código inexistente lança UrlNotFoundException', async () => {
    await expect(service.resolve('naoexiste')).rejects.toThrow(
      UrlNotFoundException,
    );
  });

  it('código expirado lança UrlExpiredException e não cacheia', async () => {
    prismaMock.url.findUnique.mockResolvedValue(
      urlRow({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(service.resolve('aZ3kQ1')).rejects.toThrow(
      UrlExpiredException,
    );
    expect(redisMock.set).not.toHaveBeenCalled();
  });

  it('falha do Redis no GET não vira 500: cai pro Postgres (fail-open)', async () => {
    redisMock.get.mockRejectedValue(new Error('connection refused'));
    prismaMock.url.findUnique.mockResolvedValue(urlRow());

    await expect(service.resolve('aZ3kQ1')).resolves.toBe(
      'https://exemplo.com',
    );
  });

  it('falha do Redis no SET não impede a resposta (fail-open)', async () => {
    prismaMock.url.findUnique.mockResolvedValue(urlRow());
    redisMock.set.mockRejectedValue(new Error('connection refused'));

    await expect(service.resolve('aZ3kQ1')).resolves.toBe(
      'https://exemplo.com',
    );
  });
});
