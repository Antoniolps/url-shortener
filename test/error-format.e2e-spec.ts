import {
  Body,
  Controller,
  Get,
  INestApplication,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { UrlExpiredException } from '../src/common/exceptions/url-expired.exception';
import { UrlNotFoundException } from '../src/common/exceptions/url-not-found.exception';

class StubDto {
  @IsUrl({ require_protocol: true })
  longUrl: string;
}

@Controller('stub')
class StubController {
  @Get('not-found')
  notFound(): never {
    throw new UrlNotFoundException('abc123');
  }

  @Get('expired')
  expired(): never {
    throw new UrlExpiredException('abc123');
  }

  @Get('boom')
  boom(): never {
    throw new Error('detalhe interno que não pode vazar');
  }

  @Post('validated')
  validated(@Body() dto: StubDto): StubDto {
    return dto;
  }
}

describe('Formato padrão de erro (AllExceptionsFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StubController],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('404 de domínio segue o formato padrão', async () => {
    const response = await request(app.getHttpServer())
      .get('/stub/not-found')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'URL_NOT_FOUND',
      path: '/stub/not-found',
    });
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('410 de domínio produz code URL_EXPIRED', async () => {
    const response = await request(app.getHttpServer())
      .get('/stub/expired')
      .expect(410);

    expect(response.body).toMatchObject({
      statusCode: 410,
      code: 'URL_EXPIRED',
    });
  });

  it('400 do ValidationPipe segue o formato padrão', async () => {
    const response = await request(app.getHttpServer())
      .post('/stub/validated')
      .send({ longUrl: 'não é url' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      path: '/stub/validated',
    });
  });

  it('exception não tratada vira 500 INTERNAL_ERROR sem vazar detalhe', async () => {
    const response = await request(app.getHttpServer())
      .get('/stub/boom')
      .expect(500);

    expect(response.body).toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    });
    expect(JSON.stringify(response.body)).not.toContain('detalhe interno');
    expect(JSON.stringify(response.body)).not.toContain('at ');
  });
});
