import { IsDateString, IsOptional, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'longUrl deve ser uma URL http/https válida' },
  )
  longUrl: string;

  @IsOptional()
  @IsDateString({}, { message: 'expiresAt deve ser uma data ISO 8601' })
  expiresAt?: string;
}
