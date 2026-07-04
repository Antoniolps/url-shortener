import { ConfigService } from '@nestjs/config';
import { InvalidUrlException } from '../common/exceptions/invalid-url.exception';
import { PrismaService } from '../prisma/prisma.service';
import { UrlService } from './url.service';

describe('UrlService', () => {
  let service: UrlService;
  let prismaMock: {
    $queryRaw: jest.Mock;
    url: { create: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ nextval: 125n }]),
      url: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            clickCount: 0n,
            createdAt: new Date(),
            expiresAt: data.expiresAt ?? null,
          }),
        ),
      },
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('http://localhost:3000/'),
    } as unknown as ConfigService;

    service = new UrlService(
      prismaMock as unknown as PrismaService,
      configService,
    );
  });

  it('cria URL curta com shortCode derivado da sequence do banco', async () => {
    const result = await service.create({ longUrl: 'https://exemplo.com/x' });

    // 125 em Base62 = '21'
    expect(result.shortCode).toBe('21');
    expect(result.shortUrl).toBe('http://localhost:3000/21');
    expect(result.longUrl).toBe('https://exemplo.com/x');
    expect(result.expiresAt).toBeNull();
    expect(prismaMock.url.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 125n, shortCode: '21' }),
    });
  });

  it('persiste expiresAt quando informado', async () => {
    const result = await service.create({
      longUrl: 'https://exemplo.com',
      expiresAt: '2027-12-31T23:59:59.000Z',
    });

    expect(result.expiresAt).toEqual(new Date('2027-12-31T23:59:59.000Z'));
  });

  it('lança InvalidUrlException para longUrl sem forma de URL', async () => {
    await expect(service.create({ longUrl: 'não é url' })).rejects.toThrow(
      InvalidUrlException,
    );
    expect(prismaMock.url.create).not.toHaveBeenCalled();
  });

  it('lança InvalidUrlException para protocolo fora de http/https', async () => {
    await expect(
      service.create({ longUrl: 'ftp://exemplo.com/arquivo' }),
    ).rejects.toThrow(InvalidUrlException);
  });
});
