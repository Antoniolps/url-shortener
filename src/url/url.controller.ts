import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { UrlStatsResponseDto } from './dto/url-stats-response.dto';
import { UrlService } from './url.service';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  // Guard só na criação — rotas de leitura ficam fora do limite (RNF04).
  @Post()
  @UseGuards(ThrottlerGuard)
  async create(@Body() dto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlService.create(dto);
  }

  @Get(':shortCode/stats')
  async stats(
    @Param('shortCode') shortCode: string,
  ): Promise<UrlStatsResponseDto> {
    return this.urlService.getStats(shortCode);
  }
}
