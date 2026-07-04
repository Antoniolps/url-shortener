import { InvalidShortCodeException } from './exceptions/invalid-short-code.exception';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BigInt(ALPHABET.length);

/**
 * Converte o `id` da sequence do Postgres em `shortCode`. A unicidade vem da
 * sequence — nunca gerar código em memória sem ela (risco de colisão).
 */
export function encodeBase62(id: bigint): string {
  if (id < 0n) {
    throw new InvalidShortCodeException(id.toString());
  }
  if (id === 0n) {
    return ALPHABET[0];
  }

  let remaining = id;
  let code = '';
  while (remaining > 0n) {
    code = ALPHABET[Number(remaining % BASE)] + code;
    remaining /= BASE;
  }
  return code;
}

export function decodeBase62(code: string): bigint {
  if (code.length === 0) {
    throw new InvalidShortCodeException(code);
  }

  let id = 0n;
  for (const char of code) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new InvalidShortCodeException(code);
    }
    id = id * BASE + BigInt(value);
  }
  return id;
}
