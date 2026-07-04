import { Controller, Get, HttpStatus, Param, Redirect } from '@nestjs/common';
import { RedirectService } from './redirect.service';

@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  // 302 Found: preserva contagem de clique e permite expiração/alteração
  // futura do destino sem depender de cache do navegador (RNF03).
  @Get(':shortCode')
  @Redirect(undefined, HttpStatus.FOUND)
  async redirect(
    @Param('shortCode') shortCode: string,
  ): Promise<{ url: string }> {
    const longUrl = await this.redirectService.resolve(shortCode);
    return { url: longUrl };
  }
}
