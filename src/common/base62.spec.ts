import { decodeBase62, encodeBase62 } from './base62';
import { InvalidShortCodeException } from './exceptions/invalid-short-code.exception';

describe('base62', () => {
  it('encode é determinístico para id pequeno', () => {
    expect(encodeBase62(1n)).toBe('1');
    expect(encodeBase62(1n)).toBe('1');
    expect(encodeBase62(0n)).toBe('0');
    expect(encodeBase62(61n)).toBe('z');
    expect(encodeBase62(62n)).toBe('10');
  });

  it('faz round-trip com id grande (~10^15)', () => {
    const id = 1_000_000_000_000_000n;
    const code = encodeBase62(id);

    expect(code.length).toBeLessThanOrEqual(10);
    expect(decodeBase62(code)).toBe(id);
  });

  it('faz round-trip para uma faixa de ids', () => {
    for (const id of [1n, 42n, 12345n, 999_999_999n, 2n ** 40n]) {
      expect(decodeBase62(encodeBase62(id))).toBe(id);
    }
  });

  it('decode lança exception de domínio para caractere fora do alfabeto', () => {
    expect(() => decodeBase62('abc$1')).toThrow(InvalidShortCodeException);
    expect(() => decodeBase62('não')).toThrow(InvalidShortCodeException);
    expect(() => decodeBase62('')).toThrow(InvalidShortCodeException);
  });

  it('encode lança exception de domínio para id negativo', () => {
    expect(() => encodeBase62(-1n)).toThrow(InvalidShortCodeException);
  });
});
