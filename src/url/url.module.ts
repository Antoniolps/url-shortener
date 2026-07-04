import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

@Module({
  imports: [
    // RNF04: 10 criações/minuto por IP. Storage em memória — suficiente
    // para instância única; multi-instância exigiria storage Redis.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
