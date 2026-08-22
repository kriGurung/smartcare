import { describe, it, expect, beforeEach } from 'vitest';
import { encryptField, decryptField } from '../utils/crypto.js';
import env from '../config/env.js';

describe('AES-256-GCM column encryption', () => {
  // setup.js sets a 64-hex-char key, so encryption is active.
  beforeEach(() => {
    expect(env.fieldEncryptionKey.length).toBe(64);
  });

  it('round-trips plaintext', () => {
    const enc = encryptField('1234-5678-9012');
    expect(enc).not.toBe('1234-5678-9012');
    expect(decryptField(enc)).toBe('1234-5678-9012');
  });

  it('produces a distinct ciphertext per call (random IV)', () => {
    expect(encryptField('secret')).not.toBe(encryptField('secret'));
  });

  it('prefixes encrypted values so they are detectable', () => {
    expect(encryptField('secret')).toMatch(/^enc::/);
  });

  it('passes through null / empty values untouched', () => {
    expect(encryptField(null)).toBeNull();
    expect(encryptField('')).toBe('');
  });

  it('returns plaintext unchanged if it was never encrypted', () => {
    expect(decryptField('plain value')).toBe('plain value');
  });
});
