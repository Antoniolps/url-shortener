export interface ClickRegisteredEvent {
  version: number;
  type: string;
  /** Quando o clique aconteceu no domínio, não quando foi publicado. */
  occurredAt: string;
  data: {
    shortCode: string;
  };
}
