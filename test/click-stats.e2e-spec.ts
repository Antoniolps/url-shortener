import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/** Polling com timeout — nunca sleep arbitrário (testing-conventions). */
async function waitUntil(
  condition: () => Promise<boolean>,
  { timeoutMs = 15_000, intervalMs = 250, description = 'condição' } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`timeout de ${timeoutMs}ms aguardando: ${description}`);
}

describe('Fluxo criar → clicar → consultar stats', () => {
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

  it('clickCount reflete os cliques processados assincronamente pelo worker', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/urls')
      .send({ longUrl: 'https://exemplo.com/stats-flow' })
      .expect(201);
    const shortCode: string = created.body.shortCode;
    createdCodes.push(shortCode);

    await request(server).get(`/${shortCode}`).expect(302);
    await request(server).get(`/${shortCode}`).expect(302);

    await waitUntil(
      async () => {
        const stats = await request(server).get(`/urls/${shortCode}/stats`);
        return stats.status === 200 && stats.body.clickCount >= 2;
      },
      { description: 'worker processar 2 cliques' },
    );

    const stats = await request(server)
      .get(`/urls/${shortCode}/stats`)
      .expect(200);

    expect(stats.body).toMatchObject({
      shortCode,
      longUrl: 'https://exemplo.com/stats-flow',
      clickCount: 2,
      expiresAt: null,
    });
    expect(typeof stats.body.createdAt).toBe('string');
  });

  it('código inexistente retorna 404 no formato padrão', async () => {
    const response = await request(app.getHttpServer())
      .get('/urls/naoexiste/stats')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'URL_NOT_FOUND',
      path: '/urls/naoexiste/stats',
    });
  });
});
