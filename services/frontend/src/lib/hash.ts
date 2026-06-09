const HASH_CHARS = 'abcdef0123456789';

export function shortHash(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += HASH_CHARS.charAt(Math.floor(Math.random() * HASH_CHARS.length));
  }
  return out;
}
