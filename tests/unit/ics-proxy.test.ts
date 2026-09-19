import { describe, expect, it } from 'vitest';
import { isPublicAddress, resolvePublicAddress, validateTarget } from '../../server/ics-proxy.js';

describe('ICS proxy target policy', () => {
  it('accepts public HTTPS URLs without credentials or fragments', () => {
    expect(validateTarget('https://calendar.example.test/public.ics').href).toBe(
      'https://calendar.example.test/public.ics',
    );
  });

  it('rejects unsafe URL shapes', () => {
    expect(() => validateTarget('http://calendar.example.test/public.ics')).toThrow();
    expect(() => validateTarget('https://user:pass@calendar.example.test/public.ics')).toThrow();
    expect(() => validateTarget('https://calendar.example.test/public.ics#fragment')).toThrow();
    expect(() => validateTarget('https://calendar.example.test:8443/public.ics')).toThrow();
  });

  it('rejects non-public address ranges', () => {
    expect(isPublicAddress('127.0.0.1')).toBe(false);
    expect(isPublicAddress('10.0.0.1')).toBe(false);
    expect(isPublicAddress('192.168.1.1')).toBe(false);
    expect(isPublicAddress('::1')).toBe(false);
    expect(isPublicAddress('::ffff:0a00:0001')).toBe(false);
    expect(isPublicAddress('100::1')).toBe(false);
    expect(isPublicAddress('2001:0000::1')).toBe(false);
    expect(isPublicAddress('2001:10::1')).toBe(false);
    expect(isPublicAddress('3fff::1')).toBe(false);
    expect(isPublicAddress('2001:db8::1')).toBe(false);
    expect(isPublicAddress('2001:4860:4860::8888')).toBe(true);
  });

  it('rejects oversized target URLs', () => {
    expect(() => validateTarget(`https://example.test/${'x'.repeat(2048)}`)).toThrow();
  });

  it('rejects mixed DNS answers when any answer is private', async () => {
    await expect(resolvePublicAddress(new URL('https://calendar.example.test/public.ics'), async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '192.168.1.10', family: 4 },
    ])).rejects.toThrow();
  });
});
