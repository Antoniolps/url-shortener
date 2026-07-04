import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Rate limiting em POST /urls (10 req/min por IP)', () => {
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

  it('11ª criação no mesmo minuto retorna 429 e leitura segue funcionando', async () => {
    const server = app.getHttpServer();

    let firstCode = '';
    for (let i = 1; i <= 10; i++) {
      const response = await request(server)
        .post('/urls')
        .send({ longUrl: `https://exemplo.com/rate-${i}` })
        .expect(201);
      createdCodes.push(response.body.shortCode);
      if (i === 1) {
        firstCode = response.body.shortCode;
      }
    }

    const throttled = await request(server)
      .post('/urls')
      .send({ longUrl: 'https://exemplo.com/rate-11' })
      .expect(429);
    expect(throttled.body).toMatchObject({
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      path: '/urls',
    });

    // Rotas de leitura não são afetadas pelo limite de escrita.
    await request(server).get(`/${firstCode}`).expect(302);
    await request(server).get(`/urls/${firstCode}/stats`).expect(200);
  });
});
