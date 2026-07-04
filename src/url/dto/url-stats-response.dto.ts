export class UrlStatsResponseDto {
  shortCode: string;
  longUrl: string;
  /** BigInt no banco; convertido para number na resposta JSON. */
  clickCount: number;
  createdAt: Date;
  expiresAt: Date | null;
}
