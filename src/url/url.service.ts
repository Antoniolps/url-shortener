import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encodeBase62 } from '../common/base62';
import { InvalidUrlException } from '../common/exceptions/invalid-url.exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';

@Injectable()
export class UrlService {
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService
      .getOrThrow<string>('BASE_URL')
      .replace(/\/+$/, '');
  }

  async create(dto: CreateUrlDto): Promise<UrlResponseDto> {
    this.assertValidUrl(dto.longUrl);

    // O id vem da sequence do banco antes do insert — o shortCode é derivado
    // dele, nunca gerado em memória (unicidade garantida pela sequence).
    const [{ nextval }] = await this.prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('urls_id_seq')
    `;
    const shortCode = encodeBase62(nextval);

    const url = await this.prisma.url.create({
      data: {
        id: nextval,
        shortCode,
        longUrl: dto.longUrl,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      shortCode: url.shortCode,
      shortUrl: `${this.baseUrl}/${url.shortCode}`,
      longUrl: url.longUrl,
      expiresAt: url.expiresAt,
    };
  }

  private assertValidUrl(longUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(longUrl);
    } catch {
      throw new InvalidUrlException(longUrl);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InvalidUrlException(longUrl);
    }
  }
}
