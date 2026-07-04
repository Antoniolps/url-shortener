import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { decodeBase62 } from '../src/common/base62';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('POST /urls (criação de URL curta)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdCodes: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.url.deleteMany({ where: { shortCode: { in: createdCodes } } });
    await app.close();
  });

  it('retorna 201 com shortCode único e reversível', async () => {
    const response = await request(app.getHttpServer())
      .post('/urls')
      .send({ longUrl: 'https://exemplo.com/pagina' })
      .expect(201);

    const { shortCode, shortUrl, longUrl, expiresAt } = response.body;
    createdCodes.push(shortCode);

    expect(longUrl).toBe('https://exemplo.com/pagina');
    expect(shortUrl).toMatch(new RegExp(`/${shortCode}$`));
    expect(expiresAt).toBeNull();

    // reversível: o shortCode decodifica de volta pro id da linha criada
    const row = await prisma.url.findUnique({ where: { shortCode } });
    expect(row).not.toBeNull();
    expect(decodeBase62(shortCode)).toBe(row!.id);
  });

  it('aceita expiresAt opcional', async () => {
    const expiresAt = '2027-12-31T23:59:59.000Z';
    const response = await request(app.getHttpServer())
      .post('/urls')
      .send({ longUrl: 'https://exemplo.com', expiresAt })
      .expect(201);

    createdCodes.push(response.body.shortCode);
    expect(new Date(response.body.expiresAt).toISOString()).toBe(expiresAt);
  });

  it('retorna 400 no formato padrão para longUrl inválida', async () => {
    const response = await request(app.getHttpServer())
      .post('/urls')
      .send({ longUrl: 'sem-protocolo.com' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      path: '/urls',
    });
  });
});
