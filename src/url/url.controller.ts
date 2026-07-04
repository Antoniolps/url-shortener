import { Body, Controller, Post } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { UrlService } from './url.service';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  async create(@Body() dto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlService.create(dto);
  }
}
